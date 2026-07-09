# DERP server setup

Runbook for deploying DERP (Designated Encrypted Relay for Packets) servers. DERP servers relay WireGuard traffic when nodes cannot establish a direct peer-to-peer connection. They see only encrypted ciphertext and cannot read the traffic they relay. Deploying custom DERP servers in Helsinki and Nuremberg keeps relay traffic within Golem Trust's infrastructure and within the EU, satisfying the data residency aspect of Mr. Bent's requirements.

## Why two regions

Most nodes are in Helsinki. When two Helsinki nodes cannot connect directly (a rare occurrence on Hetzner's private network but possible when workstations connect from outside), they relay through the Helsinki DERP server with minimal latency. Banking operations personnel connecting from the Royal Bank's offices in Ankh-Morpork may route through either server depending on their network path.

The Nuremberg server provides redundancy: if the Helsinki DERP server is unavailable, relay traffic falls back to Nuremberg. Latency increases but connectivity is maintained.

## DERP server instances

| Location | Hostname | Hetzner region |
|---|---|---|
| Helsinki | derp-hel.golemtrust.am | hel1 |
| Nuremberg | derp-nbg.golemtrust.am | nbg1 |

Both run on Hetzner CX11 instances (the minimum size; DERP servers are lightweight). Both run Debian 12.

## Installation

Tailscale provides a `derper` binary as part of the Tailscale distribution. Install the Tailscale package on each DERP server:

```
curl -fsSL https://tailscale.com/install.sh | sh
```

The `derper` binary is included at `/usr/local/bin/derper` or within the Tailscale package. If not present, build it from source:

```
apt install -y golang
go install tailscale.com/cmd/derper@latest
mv ~/go/bin/derper /usr/local/bin/derper
```

## TLS certificates

Each DERP server needs a TLS certificate for its hostname. The DERP protocol requires TLS; it does not operate over plain HTTP.

On each DERP server:

```
apt install -y certbot python3-certbot-dns-cloudflare
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/cloudflare.ini \
  -d derp-hel.golemtrust.am \
  --email ponder@golemtrust.am \
  --agree-tos \
  --non-interactive
```

Adjust the domain for the Nuremberg server. Renew certificates automatically:

```
0 3 * * * certbot renew --quiet && systemctl reload derper
```

## Systemd unit

Create `/etc/systemd/system/derper.service` on each DERP server:

```
[Unit]
Description=Tailscale DERP server
After=network-online.target

[Service]
ExecStart=/usr/local/bin/derper \
  -hostname derp-hel.golemtrust.am \
  -a :443 \
  -http-port 80 \
  -certdir /etc/letsencrypt/live/derp-hel.golemtrust.am \
  -certmode manual \
  -verify-clients=true
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

The `-verify-clients=true` flag requires connecting clients to prove they are registered with the Headscale control plane before the DERP server will relay their traffic. This prevents the DERP servers from being used as open relays by nodes not belonging to Golem Trust. Change the hostname and certificate path for the Nuremberg server.

```
systemctl daemon-reload
systemctl enable derper
systemctl start derper
```

## Firewall rules

Each DERP server needs:

- TCP 443 from `0.0.0.0/0` (DERP relay traffic)
- UDP 3478 from `0.0.0.0/0` (STUN for NAT traversal)
- TCP 80 from `0.0.0.0/0` (HTTP to HTTPS redirect only)

DERP servers must be publicly reachable. They have no access to the private Hetzner network and no credentials for any other system. Their exposure is intentional and limited.

## DERP map configuration

Headscale serves the DERP map to all clients. The DERP map tells nodes which relay servers exist and how to reach them. Create `/etc/headscale/derp.yaml` on the Headscale server:

```
regions:
  900:
    regionid: 900
    regioncode: hel1
    regionname: Helsinki
    nodes:
      - name: 900a
        regionid: 900
        hostname: derp-hel.golemtrust.am
        ipv4: <public IP of derp-hel>
        stunport: 3478
        derpport: 443

  901:
    regionid: 901
    regioncode: nbg1
    regionname: Nuremberg
    nodes:
      - name: 901a
        regionid: 901
        hostname: derp-nbg.golemtrust.am
        ipv4: <public IP of derp-nbg>
        stunport: 3478
        derpport: 443
```

Update the Headscale configuration to reference this file:

```
derp:
  paths:
    - /etc/headscale/derp.yaml
  auto_update_enabled: false
```

Restart Headscale after updating the DERP map: `systemctl restart headscale`.

## Verification

From a registered Tailscale node, force a DERP connection (temporarily blocking direct UDP to simulate a restricted network):

```
tailscale ping --tsmp derp-hel.golemtrust.am
```

Check the DERP server logs for the connection:

```
journalctl -u derper -n 50
```

A successful relay shows the connection being accepted and forwarded. The log does not contain any payload content; it shows only connection events and byte counts.

Monitor DERP traffic volume via the Prometheus node exporter on each DERP server. High relay volume is worth investigating; it may indicate that direct connections are failing between a pair of nodes for a reason that can be fixed.
Last updated: 20 March 2026
