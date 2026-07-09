# Input setup

Runbook for configuring Graylog inputs and shipping logs from all production systems. An input is how Graylog receives logs; a shipper is what sends them. This runbook covers both sides. Angua wrote the initial shipping configurations; she found it satisfying to watch the logs arrive.

## Input types in use

| Input | Protocol | Port | Purpose |
|---|---|---|---|
| GELF UDP | UDP | 12201 | Application logs, structured |
| GELF TCP | TCP | 12201 | Application logs, when delivery guarantees matter |
| Syslog UDP | UDP | 5140 | System logs, firewalls, network devices |
| Beats | TCP | 5044 | Filebeat for flat log files |

## Creating inputs in Graylog

Log in to `https://graylog.golemtrust.am` and navigate to System, then Inputs.

Create the GELF UDP input:
- Select `GELF UDP` from the dropdown and click Launch new input
- Node: Global (runs on all nodes)
- Title: `GELF UDP`
- Port: `12201`
- Leave all other settings at defaults
- Save

Create the GELF TCP input with the same settings but select `GELF TCP` and title it `GELF TCP`.

Create the Syslog UDP input:
- Select `Syslog UDP`
- Title: `Syslog`
- Port: `5140`
- Save

Create the Beats input:
- Select `Beats`
- Title: `Filebeat`
- Port: `5044`
- Save

Inputs on port numbers below 1024 require additional capability grants. Ports 5140 and 5044 are above 1024 and do not require this. Port 12201 is above 1024. All inputs are on non-privileged ports.

## Firewall rules for inputs

The Hetzner firewall for the Graylog nodes should permit:

- UDP 12201 from all production server private IPs (GELF UDP)
- TCP 12201 from all production server private IPs (GELF TCP)
- UDP 5140 from all production server private IPs (Syslog)
- TCP 5044 from all production server private IPs (Beats)
- TCP 9000 from the load balancer only (Graylog web interface)

Do not open these ports to the public internet.

## Configuring log shipping

### Filebeat

Install Filebeat on each server that generates flat log files (Nginx access logs, system logs, PostgreSQL logs):

```
curl -fsSL https://artifacts.elastic.co/GPG-KEY-elasticsearch | \
  gpg --dearmor -o /usr/share/keyrings/elastic-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/elastic-keyring.gpg] \
  https://artifacts.elastic.co/packages/8.x/apt stable main" \
  | tee /etc/apt/sources.list.d/elastic-8.x.list
apt update && apt install -y filebeat
```

Create `/etc/filebeat/filebeat.yml`. The following ships Nginx access and error logs:

```
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/nginx/access.log
    fields:
      source_system: nginx
      log_type: access
    fields_under_root: true

  - type: log
    enabled: true
    paths:
      - /var/log/nginx/error.log
    fields:
      source_system: nginx
      log_type: error
    fields_under_root: true

output.logstash:
  hosts: ["10.0.2.1:5044", "10.0.2.2:5044", "10.0.2.3:5044"]
  loadbalance: true
```

Add additional input blocks for other log files on that server. Adjust `source_system` for each server type so logs can be distinguished in Graylog.

```
systemctl enable filebeat
systemctl start filebeat
```

### rsyslog forwarding

For system syslog events, configure rsyslog to forward to Graylog. Add to `/etc/rsyslog.conf` or create `/etc/rsyslog.d/50-graylog.conf`:

```
*.* @10.0.2.1:5140;RSYSLOG_SyslogProtocol23Format
```

The `@` prefix specifies UDP; use `@@` for TCP. `RSYSLOG_SyslogProtocol23Format` sends RFC 5424 formatted messages, which Graylog's Syslog input parses cleanly.

```
systemctl restart rsyslog
```

### Application GELF logging

Applications that support structured logging should send GELF directly. For Python applications using the standard library, add the `graypy` library:

```
pip install graypy
```

In application code:

```
import logging
import graypy

logger = logging.getLogger()
handler = graypy.GELFUDPHandler('10.0.2.1', 12201)
logger.addHandler(handler)
```

GELF messages include all structured fields automatically. This is preferred over flat log files because fields do not need to be extracted by Graylog extractors.

For the Keycloak event log, configure the Keycloak event listener to send to Graylog via GELF. This requires the Keycloak GELF logging provider; Ponder added this to the Keycloak deployment during the initial configuration.

### Verifying log arrival

In Graylog, navigate to Search and run a search for the last 5 minutes with no filter. If logs are arriving, messages will appear. Click on a message to inspect its fields and confirm that `source_system`, `host`, and other expected fields are present.

To check a specific input's throughput, navigate to System, then Inputs, and observe the message rate counter next to each input. A rate of zero on an input that should be receiving logs indicates a shipping or firewall problem.

## Extractors

Flat log files arrive as unstructured text in the `message` field. Graylog extractors parse these into individual fields. Navigate to System, then Inputs, then the Beats input, then Manage Extractors.

Create a Grok extractor for Nginx access logs with the pattern:

```
%{IPORHOST:client_ip} - %{USER:ident} \[%{HTTPDATE:timestamp}\] "%{WORD:http_method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}" %{NUMBER:response_code:int} %{NUMBER:bytes_sent:long} "%{DATA:referrer}" "%{DATA:user_agent}"
```

Title: `Nginx access log parser`. Condition: `message` contains `HTTP/`.

After creating extractors, verify that a sample Nginx log message is parsed correctly by clicking Try against a recent message from the Beats input.
Last updated: 20 March 2026
