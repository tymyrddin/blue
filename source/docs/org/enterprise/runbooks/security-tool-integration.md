# Integration with security tools

Having threat intelligence in MISP is useful. Having it automatically enforced by every security tool in the stack, within minutes of a new indicator being published, is considerably more useful. Angua described the goal as "making the network aware of what we know, without anyone having to remember to update anything." This runbook covers the four integration points: Suricata IDS rule generation, Graylog lookup table enrichment, the nftables firewall blocklist, and DefectDojo CVE campaign correlation.

## Integration 1: Suricata IDS rules via ZeroMQ

MISP publishes new indicators to a ZeroMQ channel in real time. The `misp-to-ids.py` script on the Suricata host subscribes to this channel, converts new MISP attributes to Suricata rules, and writes them to the custom rules directory.

The script runs as a systemd service on the Suricata host:

```
[Unit]
Description=MISP to Suricata IDS rule feeder
After=network.target

[Service]
ExecStart=/opt/misp-tools/misp-to-ids.py
Restart=always
User=suricata-misp
Environment=MISP_URL=https://misp.golemtrust.am
Environment=MISP_API_KEY_FILE=/etc/suricata/misp-api-key
EnvironmentFile=/etc/suricata/misp-env

[Install]
WantedBy=multi-user.target
```

The core of `misp-to-ids.py`:

```
import zmq
import json
import os
import subprocess

MISP_ZMQ = "tcp://misp.golemtrust.am:50000"
RULES_FILE = "/etc/suricata/rules/misp-indicators.rules"
SURICATA_RELOAD_CMD = ["suricatasc", "-c", "reload-rules"]

context = zmq.Context()
socket = context.socket(zmq.SUB)
socket.connect(MISP_ZMQ)
socket.subscribe(b"misp_json_attribute")

sid_counter = 9000001

def attribute_to_suricata_rule(attr: dict, sid: int) -> str | None:
    attr_type = attr.get("type", "")
    value = attr.get("value", "")
    msg = f"MISP Indicator {attr.get('uuid', 'unknown')}"

    if attr_type in ("ip-src", "ip-dst"):
        direction = "any -> $HOME_NET any" if attr_type == "ip-dst" else "any $HOME_NET -> any any"
        return f'alert ip {direction} (msg:"{msg}"; content:"{value}"; sid:{sid}; rev:1;)'
    elif attr_type == "domain":
        return f'alert dns any any -> any 53 (msg:"{msg}"; dns.query; content:"{value}"; nocase; sid:{sid}; rev:1;)'
    elif attr_type == "url":
        return f'alert http any any -> any any (msg:"{msg}"; http.uri; content:"{value}"; nocase; sid:{sid}; rev:1;)'
    return None

while True:
    topic, message = socket.recv_multipart()
    event = json.loads(message)
    attribute = event.get("Attribute", {})

    if not attribute.get("to_ids"):
        continue
    if attribute.get("decay_score", [{}])[0].get("score", 100) < 50:
        continue

    rule = attribute_to_suricata_rule(attribute, sid_counter)
    if rule:
        with open(RULES_FILE, "a") as f:
            f.write(rule + "\n")
        sid_counter += 1
        subprocess.run(SURICATA_RELOAD_CMD, check=True)
```

Enable ZeroMQ in MISP's server settings:

```
Plugin.ZeroMQ_enable: true
Plugin.ZeroMQ_host: 0.0.0.0
Plugin.ZeroMQ_port: 50000
Plugin.ZeroMQ_attribute_notifications_enable: true
```

Suricata rules are updated within seconds of a new indicator being published in MISP. The reload command triggers a live rule reload without dropping connections.

## Integration 2: Graylog lookup table enrichment

Graylog's lookup table adapter queries the MISP API to enrich alert source IP addresses with threat actor context. When an IP address appears in a Graylog alert, the lookup table returns the MISP threat actor tag, the event description, and the TLP level, adding this context to the alert message.

Configure the MISP lookup adapter in Graylog, `System`, `Lookup Tables`, `Data Adapters`:

```
Type: HTTPJSONPath
Name: misp-ip-lookup
URL template: https://misp.golemtrust.am/attributes/restSearch?returnFormat=json&type=ip-src|ip-dst&value=${key}&to_ids=1
Headers:
  Authorization: ${MISP_API_KEY}
  Accept: application/json
JSON path for single value: $.response.Attribute[0].Event.info
JSON path for multi-value: $.response.Attribute[*].Event.info
Cache TTL: 300 seconds
```

Create a lookup table using this adapter, then add a pipeline rule that enriches all incoming alerts:

```
rule "enrich-source-ip-with-misp"
when
  has_field("src_ip")
then
  let misp_context = lookup("misp-ip-lookup", to_string($message.src_ip));
  set_field("misp_threat_context", misp_context);
end
```

When this context is present on an alert, Graylog's alert formatter includes the MISP threat actor name in the notification message. Angua can see immediately whether a suspicious IP is a known Tsort APT address or an unknown source.

## Integration 3: Firewall nftables blocklist

A script on the Hetzner firewall host polls MISP every hour for high-confidence malicious IPs and updates an nftables set. Only IPs with a decay score above 80 and TLP:AMBER or lower are included.

The polling script at `/opt/misp-tools/update-blocklist.sh`:

```
#!/bin/bash
set -euo pipefail

MISP_URL="https://misp.golemtrust.am"
MISP_API_KEY=$(cat /etc/firewall/misp-api-key)
SET_NAME="misp-blocklist"
TEMP_FILE=$(mktemp)

# Fetch high-confidence malicious IPs from MISP
curl -s "${MISP_URL}/attributes/restSearch" \
  -H "Authorization: ${MISP_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "returnFormat": "json",
    "type": ["ip-src", "ip-dst"],
    "to_ids": 1,
    "enforceWarninglist": true,
    "decayScore": {"score": 80},
    "tags": ["tlp:white", "tlp:green", "tlp:amber"]
  }' \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for attr in data.get('response', {}).get('Attribute', []):
    print(attr['value'])
" > "${TEMP_FILE}"

# Flush the existing set and repopulate
nft flush set inet filter "${SET_NAME}"

while IFS= read -r ip; do
  nft add element inet filter "${SET_NAME}" "{ ${ip} }"
done < "${TEMP_FILE}"

rm "${TEMP_FILE}"
echo "Blocklist updated: $(nft list set inet filter ${SET_NAME} | grep -c elements) IPs"
```

The nftables set is defined in the base firewall ruleset:

```
set misp-blocklist {
  type ipv4_addr
  flags interval
  auto-merge
}

chain input {
  type filter hook input priority 0; policy drop;
  ip saddr @misp-blocklist drop comment "MISP threat intel blocklist"
  ...
}
```

The script runs as a cron job every hour. A Graylog alert fires if the cron job does not complete successfully within a 70-minute window.

## Integration 4: DefectDojo CVE campaign correlation

When DefectDojo contains an active Critical or High finding with a CVE number, MISP is queried to determine whether that CVE is being actively exploited in a current campaign tracked by Golem Trust or Circle Sea ISAC. If a match is found, the DefectDojo finding is tagged with the MISP event reference, raising its effective priority.

The correlation script runs every 6 hours as a cron job:

```
#!/usr/bin/env python3
import requests

DEFECTDOJO_URL = "https://defectdojo.golemtrust.am"
MISP_URL = "https://misp.golemtrust.am"
DD_TOKEN = open("/etc/integrations/dd-token").read().strip()
MISP_KEY = open("/etc/integrations/misp-key").read().strip()

dd_headers = {"Authorization": f"Token {DD_TOKEN}"}
misp_headers = {"Authorization": MISP_KEY, "Accept": "application/json"}

# Fetch active High and Critical findings with CVE IDs
findings = requests.get(
    f"{DEFECTDOJO_URL}/api/v2/findings/",
    headers=dd_headers,
    params={"active": True, "severity__in": "Critical,High", "limit": 1000},
).json()["results"]

for finding in findings:
    cve = finding.get("cve")
    if not cve:
        continue

    # Search MISP for attributes referencing this CVE
    misp_response = requests.post(
        f"{MISP_URL}/attributes/restSearch",
        headers=misp_headers,
        json={"returnFormat": "json", "type": "vulnerability", "value": cve},
    ).json()

    matches = misp_response.get("response", {}).get("Attribute", [])
    if matches:
        event_info = matches[0]["Event"]["info"]
        note = f"MISP: Active exploitation campaign linked to this CVE: {event_info}"
        requests.post(
            f"{DEFECTDOJO_URL}/api/v2/notes/",
            headers=dd_headers,
            json={"entry": note, "finding": finding["id"]},
        )
        print(f"Tagged finding {finding['id']} ({cve}) with MISP campaign: {event_info}")
```

When a DefectDojo finding is tagged with an active MISP campaign reference, Cheery is notified via the existing DefectDojo webhook (see the workflow automation runbook). The presence of active exploitation evidence is a factor in prioritising remediation above other High findings with the same CVSS score.
Last updated: 20 March 2026
