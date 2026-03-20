# Suricata configuration

Runbook for installing and configuring Suricata as an intrusion detection system alongside Zeek. Suricata runs on the same `nsm.golemtrust.am` instance as Zeek. It operates in IDS mode: it detects and alerts but does not block traffic inline. Adora Belle made this decision deliberately. "We watch first. We block when we are certain. Blocking on a false positive takes down a customer. Detection on a false positive is just noise."

## Installation

```
apt install -y suricata suricata-update
```

Confirm the version and that the service is not yet started:

```
suricata --build-info | head -5
systemctl stop suricata
systemctl disable suricata
```

Suricata will be managed by a custom service configuration rather than the default systemd unit, to ensure it reads from the correct interface.

## Interface configuration

Edit `/etc/suricata/suricata.yaml`. The key sections to configure are the network interfaces and the HOME_NET variable.

Set `HOME_NET` to match the Golem Trust private network ranges:

```
vars:
  address-groups:
    HOME_NET: "[10.0.0.0/8]"
    EXTERNAL_NET: "!$HOME_NET"
```

Configure the interface. Suricata reads from `eth1`, the same mirrored interface as Zeek:

```
af-packet:
  - interface: eth1
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
    use-mmap: yes
    tpacket-v3: yes
```

Configure the output. Set EVE JSON logging, which Filebeat will ship to Graylog:

```
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: /var/log/suricata/eve.json
      types:
        - alert:
            payload: no
            payload-printable: no
            packet: no
            metadata: yes
            http-body: no
            http-body-printable: no
            tagged-packets: no
        - http:
            extended: yes
        - dns:
            query: yes
            answer: yes
        - tls:
            extended: yes
        - ssh
        - stats:
            totals: yes
            threads: no
            deltas: no
        - flow
```

`payload: no` means Suricata does not log packet payloads. This is intentional. Payload logging produces large volumes of data and may capture sensitive content from legitimate traffic. Alerts contain sufficient context without payloads. If a specific alert requires payload analysis, use the PCAP analysis procedures.

## Rule management with suricata-update

Suricata-update manages rule sets. Configure it to use the Emerging Threats Open ruleset:

```
suricata-update update-sources
suricata-update enable-source et/open
suricata-update
```

This downloads and installs the ET Open rules to `/var/lib/suricata/rules/suricata.rules`. Schedule weekly updates:

```
0 2 * * 1 /usr/bin/suricata-update && systemctl reload suricata >> /var/log/suricata-update.log 2>&1
```

## Disabling noisy rules

The ET Open ruleset includes rules that generate a high false positive rate in most environments. Disable them before the first run to avoid alert fatigue. Create `/etc/suricata/disable.conf` with the SIDs of rules to suppress:

```
# DNS lookup for common CDN domains - high volume, low signal
re:ET DNS Query for .cloudfront.net
re:ET DNS Query for .fastly.net
re:ET DNS Query for .akamaiedge.net

# TLS version alerts - legitimate legacy clients exist
re:ET SSL Outdated TLS Version
```

Identify additional rules to disable after the first 48 hours of operation by reviewing `fast.log` for repeated low-confidence alerts. See the rule tuning runbook for the process.

Apply disabled rules:

```
suricata-update --disable-conf /etc/suricata/disable.conf
```

## Systemd unit

Create a custom systemd unit at `/etc/systemd/system/suricata-nsm.service` to ensure correct interface and configuration:

```
[Unit]
Description=Suricata IDS
After=network-online.target
Wants=network-online.target

[Service]
ExecStartPre=/usr/bin/suricata -T -c /etc/suricata/suricata.yaml
ExecStart=/usr/bin/suricata -c /etc/suricata/suricata.yaml --af-packet=eth1 -D --pidfile /run/suricata.pid
ExecReload=/bin/kill -USR2 $MAINPID
KillMode=mixed
Restart=on-failure
RestartSec=10
LimitNOFILE=262144

[Install]
WantedBy=multi-user.target
```

The `ExecStartPre` line runs a configuration test before starting. If the configuration is invalid, Suricata will not start and the error appears in `journalctl`. This prevents a bad configuration update from silently stopping detection.

```
systemctl daemon-reload
systemctl enable suricata-nsm
systemctl start suricata-nsm
```

## Verification

Check that Suricata is running and reading from the interface:

```
systemctl status suricata-nsm
tail -f /var/log/suricata/suricata.log
```

The log should show the interface being opened and rule sets loaded. After a few minutes with traffic flowing, check the stats:

```
tail -f /var/log/suricata/eve.json | python3 -m json.tool | grep '"event_type"' | head -20
```

You should see `alert`, `http`, `dns`, `tls`, and `stats` event types appearing. If only `stats` events appear and no `http` or `dns` events are visible after several minutes of normal traffic, the interface is not receiving mirrored traffic.

To confirm Suricata is processing rules, send a test request that matches a known rule. The EICAR test string triggers ET rules designed for testing. Angua keeps a test script in `src/nsm-tests/` for this purpose; run it from a non-production system.

## Custom rules

Custom rules for the Golem Trust context are maintained separately. See the custom rule development runbook for how they are written and loaded. Custom rules live in `/etc/suricata/rules/golemtrust.rules` and are loaded alongside the ET Open rules via the `suricata-update` local rules configuration.
