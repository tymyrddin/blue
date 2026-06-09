# Zeek deployment

Runbook for deploying Zeek as a network security monitor. Zeek runs on a dedicated Hetzner instance, `nsm.golemtrust.am`, which receives a mirrored copy of all traffic traversing the main Hetzner private network. Dr. Crucible chose Zeek specifically because it produces structured, protocol-aware logs rather than raw packet captures. "We do not want to read every letter," he said. "We want the catalogue."

## Instance and interface requirements

The monitoring instance requires two network interfaces:

- `eth0`: management interface, connected to the private network (`10.0.3.1`), used for SSH, Graylog log shipping, and Zeek management
- `eth1`: monitoring interface, connected to the mirrored traffic port, no IP address assigned, promiscuous mode

Provision a Hetzner CX41 instance (4 vCPU, 8GB RAM) running Debian 12. The traffic volume at current scale does not justify a larger instance; revisit if additional customer portals are added.

Configure `eth1` at boot with no IP and promiscuous mode enabled. Create `/etc/network/interfaces.d/eth1`:

```
auto eth1
iface eth1 inet manual
  up ip link set $IFACE promisc on
  up ip link set $IFACE up
  down ip link set $IFACE promisc off
  down ip link set $IFACE down
```

## Installation

Zeek is not available in the Debian repositories at a current version. Install from the official OpenSUSE Build Service repository:

```
apt install -y curl gnupg2

echo 'deb http://download.opensuse.org/repositories/security:/zeek/Debian_12/ /' \
  | tee /etc/apt/sources.list.d/security:zeek.list
curl -fsSL https://download.opensuse.org/repositories/security:zeek/Debian_12/Release.key \
  | gpg --dearmor | tee /etc/apt/trusted.gpg.d/security_zeek.gpg > /dev/null

apt update && apt install -y zeek
```

Zeek installs to `/opt/zeek`. Add it to the path:

```
echo 'export PATH=/opt/zeek/bin:$PATH' >> /etc/profile.d/zeek.sh
source /etc/profile.d/zeek.sh
```

## Configuration

Edit `/opt/zeek/etc/node.cfg` to define the monitoring node:

```
[zeek]
type=standalone
host=localhost
interface=eth1
```

Edit `/opt/zeek/etc/networks.cfg` to define the local network ranges. Zeek uses this to distinguish internal from external traffic:

```
10.0.0.0/8          Golem Trust private networks
195.201.0.0/16      Hetzner Helsinki public IP range (update if IPs change)
```

Edit `/opt/zeek/etc/zeekctl.cfg`:

```
LogDir = /opt/zeek/logs
SpoolDir = /opt/zeek/spool
MailTo = crucible@golemtrust.am
LogRotationInterval = 3600
LogExpireInterval = 0
```

Setting `LogExpireInterval = 0` disables Zeek's own log expiry; log rotation and retention are managed by the Graylog integration (see the log integration runbook). Zeek logs are retained in Graylog for 90 days.

## Enabling log formats

Zeek's default log format is TSV. Enable JSON output, which Graylog's Beats input handles more cleanly. Add to `/opt/zeek/share/zeek/site/local.zeek`:

```
@load policy/tuning/json-logs
redef LogAscii::use_json = T;
```

## Deploying and starting Zeek

Run the Zeek deployment check and start:

```
zeekctl deploy
```

This checks the configuration, installs scripts, and starts the Zeek process. On subsequent starts (after a configuration change), run `zeekctl deploy` again. To start without a full redeploy:

```
zeekctl start
```

Check status:

```
zeekctl status
```

The output should show `running` for the `zeek` node. If it shows `crashed`, check `/opt/zeek/spool/zeek/stderr.log` for the error.

## Log files

Zeek writes one log file per protocol per rotation interval. After the first hour of operation, `/opt/zeek/logs/current/` will contain files including:

- `conn.log`: all connection records (source, destination, ports, bytes, duration)
- `http.log`: HTTP transactions with method, URI, user agent, response code
- `dns.log`: all DNS queries and responses
- `ssl.log`: TLS session metadata, certificate details, cipher suites
- `ssh.log`: SSH connection metadata (not content; Zeek does not decrypt sessions)
- `smtp.log`: SMTP transaction metadata
- `notice.log`: Zeek-generated notices and anomalies
- `weird.log`: protocol anomalies and unexpected behaviour

The `weird.log` is worth reviewing manually during the first week. It surfaces legitimate quirks in your own traffic that would otherwise generate noise in alert rules.

## Zeekctl maintenance

Zeek should be restarted weekly to rotate internal state and prevent memory growth. Add to cron on the `nsm.golemtrust.am` instance:

```
0 4 * * 1 /opt/zeek/bin/zeekctl restart >> /var/log/zeek-restart.log 2>&1
```

Check for crashes daily:

```
0 8 * * * /opt/zeek/bin/zeekctl check >> /var/log/zeek-check.log 2>&1
```

If `zeekctl check` reports a problem, Zeek is likely not running and logs have a gap. Investigate before the daily stand-up.

## Verification

After Zeek has been running for 10 minutes with traffic flowing, inspect the connection log:

```
zeek-cut id.orig_h id.orig_p id.resp_h id.resp_p proto duration \
  < /opt/zeek/logs/current/conn.log | head -20
```

If the output is empty, either no traffic is reaching `eth1` or Zeek is not reading the interface. Check the port mirroring configuration (see the port mirroring runbook) and confirm that `eth1` is in promiscuous mode with `ip link show eth1`.

## The defender's view

A sensor is justified by what it lets you catch. The attacker behaviours these Zeek logs are built to surface, name-resolution poisoning, Kerberoasting, DNS tunnelling, host scanning, and lateral movement, are catalogued from the hunting side in [detecting network attacks](../../../counter/network/detection.md). Dr. Crucible wanted the catalogue; that page is what the catalogue gets read against.
