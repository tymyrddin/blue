# Active response rules

Runbook for configuring Wazuh active response. Active response automatically executes commands on agents in reaction to alerts: blocking IP addresses, killing processes, disabling user accounts, or isolating hosts. Used carelessly, active response causes outages. Golem Trust learned this during a test that blocked the team's own access. The configuration in this runbook applies active response only to high-confidence, low-false-positive scenarios.

## How active response works

When a rule triggers with a level that meets the active response threshold, Wazuh runs a script on the agent. The script takes the alert data as input. Wazuh includes built-in scripts for common responses (firewall-drop, disable-account, restart-service). Custom scripts are placed in `/var/ossec/active-response/bin/` on the agent.

Active response is configured in `ossec.conf` on the manager. Each `<active-response>` block defines a command, a trigger condition, and an optional timeout after which the action is reversed.

## IP blocking

Block IPs that trigger brute force alerts. The built-in `firewall-drop` command adds a DROP rule for the source IP using iptables:

```
<command>
  <name>firewall-drop</name>
  <executable>firewall-drop</executable>
  <timeout_allowed>yes</timeout_allowed>
</command>

<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>5763</rules_id>
  <timeout>3600</timeout>
</active-response>
```

Rule 5763 fires when Wazuh detects SSH brute force (10 failed attempts within 2 minutes). The timeout of 3600 seconds (one hour) reverses the block automatically, preventing permanent lockout from transient scanners.

The `<location>local</location>` directive runs the response only on the agent that received the alert. This means an SSH brute force against `gitlab.golemtrust.am` only blocks the attacker on that host.

## Protecting Golem Trust IP ranges from auto-blocking

Add a whitelist of Golem Trust Headscale IP ranges and the Frankfurt monitor IP to prevent the active response from blocking legitimate internal traffic. This is the lesson learned from the incident where the team blocked themselves:

In `/var/ossec/etc/ossec.conf` on the manager:

```
<global>
  <white_list>100.64.0.0/10</white_list>
  <white_list>127.0.0.1</white_list>
  <white_list>95.216.0.0/16</white_list>
</global>
```

`100.64.0.0/10` covers all Headscale addresses. `95.216.0.0/16` covers the Helsinki Hetzner range. Add the Nuremberg range as well:

```
  <white_list>116.203.0.0/16</white_list>
```

Test white list entries by running a simulated brute force from a whitelisted IP and confirming no block is applied.

## Process termination

Kill processes that match known malicious patterns. This response is used sparingly; killing the wrong process causes application failures. Only apply it to patterns with extremely low false positive rates:

```
<command>
  <name>kill-malicious-process</name>
  <executable>kill-malicious-process.sh</executable>
  <timeout_allowed>no</timeout_allowed>
</command>

<active-response>
  <command>kill-malicious-process</command>
  <location>local</location>
  <rules_id>100050</rules_id>
</active-response>
```

Rule 100050 is a custom rule that fires when a process named `totally-not-malware` or matching a list of known cryptocurrency miners runs on any host. The script:

```
#!/bin/bash
ACTION=$1
USER=$2
IP=$3
ALERT_ID=$4
RULE_ID=$5
AGENT_NAME=$6
FILENAME=$7

# Read the process name from the alert
PROCESS=$(echo "$8" | jq -r '.data.process.name' 2>/dev/null)

if [ "$ACTION" == "add" ] && [ -n "$PROCESS" ]; then
  pkill -f "$PROCESS" 2>/dev/null || true
  logger "Wazuh active response: killed process $PROCESS (rule $RULE_ID)"
fi
```

The `|| true` ensures the script does not fail if the process has already exited.

## Host isolation

In a confirmed compromise, isolate the host by blocking all traffic except to the Wazuh manager (so the agent remains connected and monitoring continues) and to the Headscale control plane (so Angua can still access the host via Teleport).

This response is never automatic. It is triggered manually by Angua from the Wazuh dashboard when a compromise is confirmed:

```
/var/ossec/bin/agent_control -b <agent-ip> -u <agent-id>
```

Alternatively, trigger it via the API to all agents matching a specific alert:

```
curl -s -k -X PUT "https://wazuh.golemtrust.am:55000/active-response" \
  -H "Authorization: Bearer $WAZUH_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "!custom-isolate",
    "arguments": [],
    "alert": {"rule": {"id": "100099"}, "agent": {"id": "<agent-id>"}}
  }'
```

The `custom-isolate` script adds nftables rules that drop all traffic except from the Wazuh manager IP and the Headscale control plane IP.

## Active response log

All active response actions are logged on the agent at `/var/ossec/logs/active-responses.log`. They are also sent to the manager and indexed. Create a Wazuh dashboard saved search for active response events to give Angua a quick overview of what has been blocked or killed.

Anomalous active response activity (many blocks in a short time, or blocks on production service IPs) triggers a Graylog alert. A wave of SSH brute force attempts triggering hundreds of IP blocks is a signal to investigate; it may indicate a coordinated attack or a misconfigured service.
