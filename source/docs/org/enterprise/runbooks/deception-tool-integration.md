# Integration with security tools

Deception technology works best when it is not an island. An alert from a honeypot is most useful when it can be correlated with everything else that is happening: did the same IP appear in Zeek's connection logs five minutes before it hit the honeypot? Did the same internal host that accessed the honeypot also download an unusual binary via Wazuh's file integrity monitoring? The four integration points described here transform a simple "something touched the honeypot" alert into a rich, multi-source picture of attacker activity.

## Graylog integration

OpenCanary events are forwarded from all three honeypot VMs via syslog (UDP 514) to a dedicated Graylog syslog input, listening on `100.64.0.5:514`. The input is restricted to accept traffic only from the honeypot IP range (`100.64.20.0/24`).

Graylog extractors parse the OpenCanary JSON format into structured fields. The extractor configuration:

```
# Extractor: OpenCanary JSON parser
Type: JSON
Source field: message
Condition: message contains "opencanary"
Key prefix: oc_

# After extraction, these fields are available:
# oc_event_type (e.g. "ssh.login")
# oc_src_ip
# oc_dst_port
# oc_username
# oc_password
# oc_local_time
```

After extraction, a Graylog pipeline rule normalises the fields to the common schema used across all security events:

```
rule "Normalise OpenCanary fields"
when
  has_field("oc_event_type")
then
  set_field("src_ip", $message.oc_src_ip);
  set_field("event_type", concat("honeypot.", $message.oc_event_type));
  set_field("alert_category", "deception");
  set_field("alert_severity", "critical");
  route_to_stream("Deception Events");
end
```

## MISP integration

Every deception event triggers automatic MISP event creation via a Graylog alert webhook. The webhook calls a Python script on the security tooling server that creates or updates a MISP event for the attacker's IP address.

The integration uses MISP's correlation feature: when the attacker IP is added as a Network Activity attribute, MISP automatically correlates it with any other events that share the same attribute. This means that if the same IP has been seen in any threat intelligence feed already imported into MISP, Angua sees that context immediately.

The webhook configuration in Graylog:

```
Notification type: HTTP Notification
URL: http://security-tools.golemtrust.am:8080/webhooks/deception-to-misp
Method: POST
Content-Type: application/json
Body template:
{
  "stream_name": "${stream_name}",
  "alert_description": "${alert_description}",
  "src_ip": "${src_ip}",
  "event_type": "${event_type}",
  "timestamp": "${timestamp}",
  "token_type": "${token_type}",
  "token_location": "${token_location}"
}
```

## Firewall auto-block integration

Deception events get the highest confidence level in MISP indicator classification. This means they bypass the normal confidence threshold required for automatic firewall blocking.

The normal auto-block threshold for MISP indicators is confidence >= 80%. For deception indicators (tagged `golemtrust:honeypot`), the threshold is confidence >= 50%, and the block is applied within 15 minutes of the honeypot access.

The MISP-to-nftables pipeline runs on the firewall node. It polls MISP every five minutes for new indicators with the `golemtrust:honeypot` tag and applies nftables rules:

```
# /opt/security/misp-firewall-sync.sh (relevant deception section)
#!/bin/bash

MISP_URL="https://misp.golemtrust.am"
MISP_KEY="$MISP_API_KEY"

# Fetch honeypot IPs added in the last 15 minutes
RECENT_IPS=$(curl -s -X POST "$MISP_URL/attributes/restSearch" \
  -H "Authorization: $MISP_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "returnFormat": "json",
    "type": "ip-src",
    "tags": ["golemtrust:honeypot"],
    "last": "15m"
  }' | jq -r '.response.Attribute[].value')

for IP in $RECENT_IPS; do
  # Check if already blocked
  if ! nft list set inet filter honeypot_blocked | grep -q "$IP"; then
    nft add element inet filter honeypot_blocked { "$IP" }
    logger "DECEPTION: Auto-blocked $IP via MISP honeypot indicator"
  fi
done
```

The nftables set `honeypot_blocked` is referenced in the main firewall ruleset to drop all traffic from blocked IPs.

## Wazuh integration

Canary token access events are forwarded to Wazuh for correlation with host-level events. This answers the question: did the host that accessed the honeypot also do something suspicious on the internal network?

The Wazuh integration uses a custom decoder and rule. When Graylog receives a deception event, it forwards a copy to the Wazuh manager via the Graylog Wazuh output plugin:

```
# Wazuh decoder for deception events
<decoder name="golemtrust_deception">
  <prematch>{"alert_category":"deception"</prematch>
  <regex>\"src_ip\":\"(\.+?)\"</regex>
  <order>srcip</order>
</decoder>

# Wazuh rule to correlate deception source IP with other Wazuh events
<rule id="100500" level="15">
  <if_matched_sid>100499</if_matched_sid>
  <same_srcip />
  <description>Host that accessed honeypot also generated Wazuh alert</description>
  <group>deception,correlation</group>
</rule>
```

When a deception source IP is also seen in Wazuh alerts from an internal host scan or authentication attempt, Wazuh generates a correlation alert that appears in Graylog's Correlation stream with elevated severity.

## Deception dashboard

The Graylog deception dashboard provides four visualisations:

Geographic distribution: a world map showing the source countries for honeypot access attempts over the past 30 days. The majority of attempts originate from Tor exit nodes and anonymising VPN ranges; a small number originate from within the Headscale network, which are the most interesting.

Token access timeline: a bar chart showing deception events by hour of day over the past 7 days. This reveals whether attacks are automated (evenly distributed across all hours) or targeted (concentrated during business hours, suggesting an attacker in a specific time zone).

Attack pattern trends: a line chart showing the total number of deception events per week over the past 6 months. The trend line reveals whether external scanning activity is increasing or decreasing.

Top attacker IPs: a table of the source IPs responsible for the most deception events in the past 30 days, enriched with MISP context and geolocation. IPs that appear repeatedly without being blocked (because they are reaching the honeypot via Tor, which changes exit nodes) are tagged for manual review.

The dashboard URL: `https://graylog.golemtrust.am/dashboards/deception-overview`. Access requires the `security-analyst` role in Graylog.
