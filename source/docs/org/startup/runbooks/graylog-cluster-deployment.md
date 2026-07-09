# Graylog cluster deployment

Runbook for deploying a three-node Graylog cluster with OpenSearch as the search backend and MongoDB for metadata storage. Dr. Crucible designed the initial architecture; Angua reviewed it for alerting requirements. The cluster was operational within 48 hours of the Seamstresses' Guild portal breach being discovered.

## Architecture

Three Hetzner CX31 instances in the Helsinki region, all on the private network `10.0.2.0/24`:

| Role | Hostname | Private IP |
|---|---|---|
| Master | graylog-1.golemtrust.am | 10.0.2.1 |
| Node | graylog-2.golemtrust.am | 10.0.2.2 |
| Node | graylog-3.golemtrust.am | 10.0.2.3 |

Each node runs Graylog, OpenSearch, and MongoDB. This is a co-located deployment appropriate for the current log volume. If log ingestion grows significantly, OpenSearch should be moved to dedicated nodes first.

A Hetzner load balancer sits in front, routing port 443 to the Graylog web interface on port 9000 and GELF UDP input on port 12201. The load balancer health check hits `/api/system/lbstatus` on each node.

## Prerequisites

- Three Hetzner CX31 instances running Debian 12 on the private network
- DNS A record for `graylog.golemtrust.am` pointing to the load balancer
- TLS certificate for `graylog.golemtrust.am` (Certbot with Cloudflare DNS)
- Java 17 (Graylog requires Java 17; do not use 21 for this deployment)

## System preparation

On all three nodes:

```
apt update && apt upgrade -y
apt install -y curl wget gnupg2 apt-transport-https pwgen
```

Install Java 17:

```
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" \
  > /etc/apt/sources.list.d/adoptium.list
apt update && apt install -y temurin-17-jdk
```

Set system limits for OpenSearch. Add to `/etc/sysctl.conf`:

```
vm.max_map_count=262144
vm.swappiness=1
net.ipv4.tcp_retries2=5
```

Apply immediately: `sysctl -p`

Add to `/etc/security/limits.conf`:

```
* soft nofile 65536
* hard nofile 65536
* soft memlock unlimited
* hard memlock unlimited
```

## MongoDB installation

On all three nodes. MongoDB 7.0:

```
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" \
  | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
```

Configure `/etc/mongod.conf` for the replica set. The `bindIp` should include both localhost and the node's private IP:

```
net:
  port: 27017
  bindIp: 127.0.0.1,10.0.2.1

replication:
  replSetName: "graylog-rs"
```

Adjust `bindIp` per node (`10.0.2.2` on node 2, `10.0.2.3` on node 3).

Start MongoDB on all three nodes:

```
systemctl enable mongod
systemctl start mongod
```

Initiate the replica set from `graylog-1` only:

```
mongosh --eval '
rs.initiate({
  _id: "graylog-rs",
  members: [
    { _id: 0, host: "10.0.2.1:27017" },
    { _id: 1, host: "10.0.2.2:27017" },
    { _id: 2, host: "10.0.2.3:27017" }
  ]
});'
```

Verify: `mongosh --eval 'rs.status()'`. All three members should show as healthy.

## OpenSearch installation

See the OpenSearch configuration runbook for the full OpenSearch setup. Install OpenSearch on all three nodes before proceeding with Graylog.

## Graylog installation

On all three nodes:

```
wget https://packages.graylog2.org/repo/packages/graylog-6.1-repository_latest.deb
dpkg -i graylog-6.1-repository_latest.deb
apt update && apt install -y graylog-server
```

Generate the required secrets. Run these on any machine and record the output:

```
pwgen -N 1 -s 96   # password_secret
echo -n "yourpassword" | sha256sum  # root_password_sha2
```

Store the plaintext root password in Vaultwarden under the Infrastructure collection. The SHA256 hash goes in the configuration file; the plaintext never does.

Configure `/etc/graylog/server/server.conf` on `graylog-1`. Key settings; leave others at their defaults:

```
password_secret = <96-char secret from pwgen>
root_password_sha2 = <sha256 of root password>
root_email = crucible@golemtrust.am
http_bind_address = 0.0.0.0:9000
http_publish_uri = https://graylog.golemtrust.am/
elasticsearch_hosts = http://10.0.2.1:9200,http://10.0.2.2:9200,http://10.0.2.3:9200
mongodb_uri = mongodb://10.0.2.1:27017,10.0.2.2:27017,10.0.2.3:27017/graylog?replicaSet=graylog-rs
is_leader = true
```

On `graylog-2` and `graylog-3`, use the same `password_secret` and `root_password_sha2`, but set `is_leader = false` and update `http_bind_address` if needed. All nodes must share the same `password_secret`.

Start Graylog on all three nodes, leader first:

```
systemctl enable graylog-server
systemctl start graylog-server
```

## Nginx reverse proxy

Install Nginx on `graylog-1` (the leader node handles the web interface):

```
apt install -y nginx certbot python3-certbot-dns-cloudflare
```

Create `/etc/nginx/sites-available/graylog`:

```
server {
    listen 80;
    server_name graylog.golemtrust.am;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name graylog.golemtrust.am;

    ssl_certificate /etc/letsencrypt/live/graylog.golemtrust.am/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/graylog.golemtrust.am/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 150;
        proxy_send_timeout 100;
        proxy_read_timeout 100;
    }
}
```

```
certbot certonly --dns-cloudflare --dns-cloudflare-credentials /etc/cloudflare.ini \
  -d graylog.golemtrust.am --email crucible@golemtrust.am --agree-tos --non-interactive
ln -s /etc/nginx/sites-available/graylog /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Verification

Log in at `https://graylog.golemtrust.am` with username `admin` and the root password stored in Vaultwarden. Navigate to System, then Nodes. All three nodes should appear as running. Navigate to System, then Indices; the default index set should be green.

If a node does not appear, check `journalctl -u graylog-server -n 100` on that node. Common failures are MongoDB connectivity (check replica set status) and OpenSearch connectivity (check the OpenSearch runbook).
Last updated: 20 March 2026
