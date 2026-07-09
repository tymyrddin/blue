# Log integration with Graylog

Runbook for shipping Zeek and Suricata logs to Graylog. Both tools produce JSON log files. Filebeat ships them to Graylog's Beats input. This makes NSM data searchable alongside application logs, authentication events, and system logs in the same interface. Dr. Crucible calls this "reading the book from chapter 1," which is what prompted the whole project.

## Filebeat installation

Install Filebeat on `nsm.golemtrust.am`:

```
curl -fsSL https://artifacts.elastic.co/GPG-KEY-elasticsearch | \
  gpg --dearmor -o /usr/share/keyrings/elastic-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/elastic-keyring.gpg] \
  https://artifacts.elastic.co/packages/8.x/apt stable main" \
  | tee /etc/apt/sources.list.d/elastic-8.x.list
apt update && apt install -y filebeat
```

## Filebeat configuration

Create `/etc/filebeat/filebeat.yml`:

```
filebeat.inputs:

  - type: log
    enabled: true
    paths:
      - /opt/zeek/logs/current/conn.log
    fields:
      source_system: zeek
      log_type: conn
    fields_under_root: true
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: uid

  - type: log
    enabled: true
    paths:
      - /opt/zeek/logs/current/http.log
    fields:
      source_system: zeek
      log_type: http
    fields_under_root: true
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: uid

  - type: log
    enabled: true
    paths:
      - /opt/zeek/logs/current/dns.log
    fields:
      source_system: zeek
      log_type: dns
    fields_under_root: true
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: uid

  - type: log
    enabled: true
    paths:
      - /opt/zeek/logs/current/ssl.log
    fields:
      source_system: zeek
      log_type: ssl
    fields_under_root: true
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: uid

  - type: log
    enabled: true
    paths:
      - /opt/zeek/logs/current/notice.log
    fields:
      source_system: zeek
      log_type: notice
    fields_under_root: true
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: uid

  - type: log
    enabled: true
    paths:
      - /var/log/suricata/eve.json
    fields:
      source_system: suricata
    fields_under_root: true
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: flow_id

output.logstash:
  hosts:
    - "10.0.2.1:5044"
    - "10.0.2.2:5044"
    - "10.0.2.3:5044"
  loadbalance: true
```

The `json.keys_under_root: true` setting causes Filebeat to promote all JSON fields to top-level Graylog fields. This makes Zeek fields such as `id.orig_h`, `id.resp_h`, and `proto` directly searchable in Graylog.

Note that Zeek writes to `current/` while it is running. When Zeek rotates logs, the current file is renamed and a new one is started. Filebeat tracks the file by inode, so it follows correctly across rotations. The rotated logs in `/opt/zeek/logs/<date>/` are not shipped again; only the `current/` files are monitored.

```
systemctl enable filebeat
systemctl start filebeat
```

## Graylog streams for NSM data

Create two new streams in Graylog (navigate to Streams, then Create Stream):

Stream: `Network connections`
Description: Zeek connection, HTTP, DNS, and SSL/TLS logs
Rules (match any):
- Field `source_system` matches exactly `zeek`

Stream: `Intrusion detection`
Description: Suricata alerts and Zeek notices
Rules (match all):
- Field `source_system` matches exactly `suricata` OR field `log_type` matches exactly `notice`

To express OR logic in a match-all stream, use two separate rules with match-any. For the `Intrusion detection` stream, use match-any and add:
- Field `source_system` matches exactly `suricata`
- Field `log_type` matches exactly `notice`

Assign the `Intrusion detection` stream to the same index set as the `Security events` stream, or create a dedicated index set with 90-day retention. NSM data has higher forensic value and warrants longer retention than general web access logs.

## Alert on Suricata alerts

Create a Graylog alert condition for Suricata events with high severity. Navigate to Alerts, then Event Definitions, then Create Event Definition:

- Title: `Suricata high-severity alert`
- Condition type: Filter and Count
- Stream: `Intrusion detection`
- Search query: `source_system:suricata AND alert.severity:[1 TO 2]`
- Count, greater than `0`
- Time range: 5 minutes
- Execute every: 1 minute
- Grace period: 5 minutes
- Notifications: Slack `#security-alerts`, Email

Suricata severity 1 is critical, severity 2 is major. Severity 3 and above are informational and do not need immediate alerting; they are reviewed in the daily log review.

## Alert on Zeek notices

Create a separate alert for Zeek notices, which include the custom beacon detection and unexpected database access scripts:

- Title: `Zeek security notice`
- Condition type: Filter and Count
- Stream: `Intrusion detection`
- Search query: `log_type:notice AND NOT note:CaptureLoss`
- Count, greater than `0`
- Time range: 5 minutes
- Execute every: 1 minute
- Grace period: 10 minutes
- Notifications: Slack `#security-alerts`, Email

The `NOT note:CaptureLoss` exclusion suppresses notices about packet loss on the monitoring interface, which can occur during high-traffic periods and are not security events.

## Verifying log arrival

In Graylog, navigate to Search and select the `Network connections` stream. Set the time range to the last 5 minutes. Within a few minutes of starting Filebeat, log messages should appear with `source_system: zeek` and fields such as `id.orig_h` and `proto`.

If no messages appear, check:

1. `systemctl status filebeat` on the NSM instance
2. `journalctl -u filebeat -n 50` for shipping errors
3. Whether the Graylog Beats input is running (System, then Inputs, then the Beats input's status indicator)
4. Whether the firewall permits TCP 5044 from `10.0.3.1` to the Graylog private IPs

If Filebeat is running but messages are not arriving, check that the Zeek log files in `/opt/zeek/logs/current/` are being written and are valid JSON:

```
tail -5 /opt/zeek/logs/current/conn.log | python3 -m json.tool
```

If the output shows a parse error, Zeek's JSON logging may not be enabled. Confirm that `local.zeek` contains `redef LogAscii::use_json = T;` and that `zeekctl deploy` was run after adding it.
Last updated: 10 July 2026
