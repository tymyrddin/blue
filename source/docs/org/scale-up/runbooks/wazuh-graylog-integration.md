# Integration with Graylog

Runbook for forwarding Wazuh alerts to Graylog. The Wazuh indexer stores all events for the Wazuh dashboard. Graylog is the centralised log platform used by the operations and security teams for cross-system correlation. Forwarding Wazuh alerts to Graylog allows Angua to correlate FIM events with authentication logs, network traffic from Zeek, and pipeline events from GitLab, all in a single interface without switching between tools.

## Architecture

Wazuh events flow: agent to manager (port 1514), indexed by the Wazuh indexer (internal), then forwarded to Graylog via a Filebeat sidecar on the Wazuh manager.

Filebeat reads from the Wazuh alert log (`/var/ossec/logs/alerts/alerts.json`) and forwards to Graylog's Beats input. This approach is preferred over the Wazuh Graylog integration plugin because it uses a stable, well-documented protocol and does not require Graylog plugins.

## Configuring Graylog to receive Wazuh events

Create a Beats input in Graylog. Navigate to System, then Inputs, then Launch new input. Select Beats and configure:

- Title: `Wazuh Alerts`
- Port: 5044
- TLS: enabled (upload the Graylog server certificate)
- No authentication (Beats uses TLS mutual auth, not passwords)

Note the input ID for use in the stream configuration below.

## Installing Filebeat on the Wazuh manager

```
curl -s https://packages.elastic.co/GPG-KEY-elasticsearch | apt-key add -
echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" \
  > /etc/apt/sources.list.d/elastic-8.x.list
apt update && apt install -y filebeat
```

## Filebeat configuration

Create `/etc/filebeat/filebeat.yml`:

```
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/ossec/logs/alerts/alerts.json
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: full_log
    fields:
      source: wazuh
      environment: production
    fields_under_root: true
    multiline:
      pattern: '^\{'
      negate: true
      match: after

output.logstash:
  hosts: ["graylog.golemtrust.am:5044"]
  ssl.enabled: true
  ssl.certificate_authorities: ["/etc/filebeat/certs/graylog-ca.pem"]

processors:
  - decode_json_fields:
      fields: ["message"]
      target: ""
      overwrite_keys: true
```

The Graylog CA certificate is retrieved from Vault at `kv/golemtrust/graylog-ca-cert` and placed at `/etc/filebeat/certs/graylog-ca.pem`.

Enable and start Filebeat:

```
systemctl enable --now filebeat
```

Verify that Filebeat is shipping events:

```
filebeat test output
journalctl -fu filebeat | head -20
```

## Graylog streams for Wazuh

Create a dedicated Graylog stream for Wazuh events. Navigate to Streams, then Create Stream:

- Title: `Wazuh Security Events`
- Stream rule: `source` matches exactly `wazuh`

Create sub-streams within the Wazuh stream for operational efficiency:

`Wazuh FIM Alerts`: rule group contains `syscheck`. Feeds Angua's FIM dashboard.

`Wazuh Vulnerability Alerts`: rule group contains `vulnerability-detector`. Feeds the vulnerability register workflow.

`Wazuh Authentication Events`: rule group contains `authentication_success` or `authentication_failed`. Correlated with Teleport session logs.

`Wazuh Active Response`: rule group contains `active_response`. Feeds the active response log review.

## Extractors

Wazuh alerts arrive as JSON. Add extractors to promote the most useful fields to Graylog message fields for easy filtering and dashboarding. Navigate to the Wazuh Beats input, then Manage Extractors, then Add Extractor.

Add JSON extractors for:

- `rule.id` promoted to `wazuh_rule_id`
- `rule.level` promoted to `wazuh_level`
- `rule.description` promoted to `wazuh_description`
- `agent.name` promoted to `wazuh_agent`
- `data.vulnerability.cve` promoted to `cve_id` (present on vulnerability alerts)
- `data.vulnerability.severity` promoted to `cve_severity`
- `syscheck.path` promoted to `fim_path` (present on FIM alerts)
- `mitre.id` promoted to `mitre_technique`

These extracted fields enable Graylog searches and dashboards to filter by agent name, rule level, MITRE technique, or CVE ID without parsing raw JSON.

## Alert conditions

Create Graylog alert conditions on the Wazuh stream for events that require immediate notification:

High-severity FIM: rule level 12 or above from the `syscheck` group. Fires if more than 0 events occur in a 1-minute window. Notification: `#security-alerts` channel.

Critical vulnerability: `cve_severity` equals `Critical`. Fires immediately. Notification: PagerDuty plus `#security-alerts`.

Active response failure: any event from the `active_response` group with the text `Unable to run`. Fires if more than 0 events in 5 minutes. Notification: `#infra-alerts`.

Agent disconnected: Wazuh generates a rule 506 event when an agent stops checking in. Fires if more than 0 events in 10 minutes on any production server agent. Notification: `#infra-alerts`. Developer workstation disconnections do not trigger this alert.

## Graylog dashboard

Create a dashboard titled "Wazuh Security Overview" with panels for:

- FIM event count by agent (last 24 hours)
- Rule level distribution (bar chart, last 7 days)
- Top 10 triggered rules by count (last 7 days)
- MITRE ATT&CK technique heatmap (last 30 days)
- Active agents versus disconnected agents (gauge)
- Open Critical and High vulnerability count by host

Angua reviews this dashboard at the start of each working day. The MITRE ATT&CK heatmap in particular helps identify whether observed alerts cluster around specific attack patterns versus being random noise.
