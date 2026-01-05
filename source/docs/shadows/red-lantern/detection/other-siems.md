# Other SIEM platforms

## Translating detection patterns across platforms

The fundamental detection patterns for BGP attacks remain the same regardless of which SIEM you use. An anomalous 
prefix announcement is anomalous whether you detect it in Wazuh, Splunk, Elastic, Sentinel, or Chronicle. What 
changes is the syntax for expressing that detection logic.

This section provides starting points for implementing Red Lantern detection patterns in popular SIEM platforms. 
The Department cannot provide exhaustive coverage of every platform (budget reality meets best practice), but we 
offer enough to get you started. The patterns from the [generic detection section](generic.md) remain your foundation. 
These are implementation details.

If your platform is not covered here, use the generic patterns as a guide and consult your platform's documentation 
for syntax. The detection logic translates even if the query language looks completely different.

## Splunk detection rules

[Splunk](https://www.splunk.com/) uses SPL (Search Processing Language) for queries and detections. The simulator's 
JSON output works well with Splunk's JSON parsing capabilities.

### Ingesting simulator output

Configure Splunk to monitor simulator output files:

```
# inputs.conf
[monitor:///var/log/simulator/*.json]
sourcetype = red_lantern_json
index = security
```

Or forward via syslog to Splunk's syslog input (default port 514).

### Basic BGP hijack detection

Detect prefix announcements from unexpected origin ASNs:

```
index=security sourcetype=red_lantern_json event_type="bgp_announcement"
| where origin_asn != expected_origin
| eval severity="high"
| table _time, prefix, origin_asn, expected_origin, source_asn
| outputlookup bgp_hijack_detections
```

This searches the security index for BGP announcements where the origin ASN does not match expectations, tags them 
as high severity, and writes results to a lookup table for investigation.

### RPKI validation failure detection

```
index=security sourcetype=red_lantern_json event_type="rpki_validation" validation_state="invalid"
| eval severity=case(
    match(prefix, "203\.0\.113\."), "critical",
    1=1, "medium"
  )
| table _time, prefix, origin_asn, expected_origin, validation_state, severity
```

This detects RPKI validation failures and escalates severity for critical prefixes using pattern matching.

### Correlation for attack chains

Detect reconnaissance followed by hijack from the same source within one hour:

```
index=security sourcetype=red_lantern_json 
  (event_type="reconnaissance" OR (event_type="bgp_announcement" AND origin_asn!=expected_origin))
| transaction source_ip maxspan=1h
| where mvcount(event_type) > 1
| search event_type="reconnaissance" AND event_type="bgp_announcement"
| eval attack_chain="reconnaissance_to_hijack"
| table _time, source_ip, attack_chain, event_type
```

This uses Splunk's transaction command to correlate events from the same source IP within a one-hour window. If 
both reconnaissance and hijack events appear, it flags an attack chain.

### Scheduled alert

Save the hijack detection as a scheduled search in Splunk:

```xml
<!-- savedsearches.conf -->
[BGP Hijack Detection]
search = index=security sourcetype=red_lantern_json event_type="bgp_announcement" | where origin_asn != expected_origin
cron_schedule = */5 * * * *
alert.severity = 3
alert.suppress = 0
action.email = 1
action.email.to = security-team@department.local
```

This runs every 5 minutes and emails the security team when hijacks are detected.

### Splunk Enterprise Security correlation search

If you use Splunk ES, create a correlation search:

```
| tstats count where index=security sourcetype=red_lantern_json event_type="bgp_announcement" by _time, origin_asn, expected_origin, prefix
| where origin_asn != expected_origin
| `notable("BGP Hijack Detected", "high")`
```

This creates notable events in the Incident Review dashboard for analyst investigation.

### Dashboard for monitoring

Create a dashboard to visualise BGP events:

```xml
<dashboard>
  <label>BGP Security Monitoring</label>
  <row>
    <panel>
      <title>BGP Announcements Over Time</title>
      <chart>
        <search>
          <query>index=security sourcetype=red_lantern_json event_type="bgp_announcement" | timechart count by origin_asn</query>
        </search>
        <option name="charting.chart">line</option>
      </chart>
    </panel>
  </row>
  <row>
    <panel>
      <title>RPKI Validation Failures</title>
      <table>
        <search>
          <query>index=security sourcetype=red_lantern_json event_type="rpki_validation" validation_state="invalid" | stats count by prefix, origin_asn</query>
        </search>
      </table>
    </panel>
  </row>
</dashboard>
```

This provides real-time visibility into BGP security events.

## Elastic Security rules

[Elastic Security](https://www.elastic.co/security) uses the Elastic Common Schema (ECS) and KQL (Kibana Query 
Language) or EQL (Event Query Language) for detection rules.

### Ingesting simulator output

Use Filebeat to ship simulator output to Elasticsearch:

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/simulator/*.json
  json.keys_under_root: true
  json.add_error_key: true
  fields:
    event.module: red_lantern
    event.dataset: red_lantern.simulator

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "red-lantern-%{+yyyy.MM.dd}"
```

Or forward via syslog to Logstash, which parses JSON and sends to Elasticsearch.

### Basic BGP hijack detection rule

Create a detection rule in Kibana Security:

Rule type: Custom query  
Index patterns: `red-lantern-*`

KQL query:

```
event_type: "bgp_announcement" and origin_asn: * and expected_origin: * and not origin_asn: expected_origin
```

Rule settings:
- Severity: High
- Risk score: 75
- MITRE ATT&CK: T1557 (Adversary-in-the-Middle)
- Tags: bgp, hijack, network

This rule fires when a BGP announcement's origin ASN does not match the expected origin.

### RPKI validation failure rule

KQL query:

```
event_type: "rpki_validation" and validation_state: "invalid"
```

With threshold for escalation (multiple failures from same source):

Threshold rule:

```
event_type: "rpki_validation" and validation_state: "invalid"
```
Threshold: Count >= 5, Group by `source_ip`, Within 10 minutes

This escalates only when the same source generates multiple RPKI failures, reducing false positives.

### EQL for sequence detection

Elastic's EQL (Event Query Language) excels at sequence detection:

```
sequence by source_ip with maxspan=1h
  [any where event_type == "reconnaissance"]
  [any where event_type == "bgp_announcement" and origin_asn != expected_origin]
```

This detects reconnaissance followed by hijack from the same source IP within one hour. EQL sequences are more 
precise than KQL correlation for attack chains.

### Indicator match rule

If you maintain a list of malicious ASNs, use an indicator match rule:

Indicator index: `threat-intel-asns`  
Indicator mapping:
- `asn` (threat intel) maps to `origin_asn` (event data)

Query:
```
event_type: "bgp_announcement"
```

This automatically correlates BGP announcements against your threat intelligence feeds.

### Machine learning for anomaly detection

Elastic's ML can detect anomalous BGP behaviour:

```json
{
  "job_id": "bgp_anomaly_detection",
  "analysis_config": {
    "bucket_span": "15m",
    "detectors": [
      {
        "function": "rare",
        "by_field_name": "origin_asn"
      },
      {
        "function": "high_count",
        "partition_field_name": "source_ip"
      }
    ]
  },
  "data_description": {
    "time_field": "timestamp"
  },
  "datafeed_config": {
    "indices": ["red-lantern-*"]
  }
}
```

This ML job learns normal BGP behaviour and alerts on deviations like rare origin ASNs or unusually high announcement 
counts from specific sources.

## Microsoft Sentinel KQL queries

[Microsoft Sentinel](https://azure.microsoft.com/en-us/products/microsoft-sentinel/) uses KQL (Kusto Query Language) 
for detection rules. If you have Sentinel, you probably have Azure infrastructure, so integrating the simulator 
requires ingesting logs to Azure.

### Ingesting simulator output

Use the Azure Log Analytics agent or Azure Monitor to forward logs:

```bash
# Forward via syslog to Azure Log Analytics workspace
python -m simulator.cli scenario.yaml | logger -t RedLantern -n <workspace-id>.ods.opinsights.azure.com -P 514
```

Or use a custom log ingestion pipeline with the 
[Data Collector API](https://docs.microsoft.com/en-us/azure/azure-monitor/logs/data-collector-api).

### Basic BGP hijack detection

Create an analytics rule in Sentinel:

```
RedLanternLogs_CL
| where event_type_s == "bgp_announcement"
| where origin_asn_s != expected_origin_s
| extend Severity = "High"
| project TimeGenerated, prefix_s, origin_asn_s, expected_origin_s, source_asn_s
```

Rule settings:
- Rule type: Scheduled
- Run every: 5 minutes
- Lookup data from: Last 5 minutes
- Alert threshold: Greater than 0 results
- Tactics: Impact, Command and Control

### RPKI validation failure detection

```
RedLanternLogs_CL
| where event_type_s == "rpki_validation"
| where validation_state_s == "invalid"
| extend Severity = case(
    prefix_s startswith "203.0.113.", "Critical",
    "Medium"
  )
| summarize Count=count() by prefix_s, origin_asn_s, Severity
```

This detects RPKI failures and escalates based on prefix criticality.

### Multi-stage attack detection

Sentinel excels at cross-workspace queries and long-term correlation:

```text
let recon = RedLanternLogs_CL
| where event_type_s == "reconnaissance"
| project TimeGenerated, source_ip_s;let hijack = RedLanternLogs_CL
| where event_type_s == "bgp_announcement"
| where origin_asn_s != expected_origin_s
| project TimeGenerated, source_ip_s;recon
| join kind=inner (hijack) on source_ip_s
| where (hijack_TimeGenerated - TimeGenerated) between (0min .. 60min)
| project ReconTime=TimeGenerated, HijackTime=hijack_TimeGenerated, source_ip_s
```

This correlates reconnaissance with subsequent hijacks from the same source within one hour.

### Fusion detection for advanced threats

Sentinel's Fusion ML can correlate multiple low-confidence signals into high-confidence alerts. Enable Fusion for your workspace and tag BGP events appropriately:

```
RedLanternLogs_CL
| extend AlertType = case(
    event_type_s == "reconnaissance", "Reconnaissance",
    event_type_s == "bgp_announcement" and origin_asn_s != expected_origin_s, "Exploitation",
    "Informational"
  )
```

Fusion will automatically correlate these into multi-stage attack incidents.

### Workbook for visualisation

Create a Sentinel workbook for BGP monitoring:

```
// BGP Announcements Over Time
RedLanternLogs_CL
| where event_type_s == "bgp_announcement"
| summarize Count=count() by bin(TimeGenerated, 1h), origin_asn_s
| render timechart

// Top Origin ASNs
RedLanternLogs_CL
| where event_type_s == "bgp_announcement"
| summarize Count=count() by origin_asn_s
| top 10 by Count
| render barchart

// RPKI Validation State Distribution
RedLanternLogs_CL
| where event_type_s == "rpki_validation"
| summarize Count=count() by validation_state_s
| render piechart
```

This provides executive-friendly visualisations of BGP security posture.

## Google Chronicle YARA-L rules

[Chronicle](https://chronicle.security/) uses YARA-L (YARA Language) for detection rules. YARA-L is designed for 
high-scale event correlation and threat hunting.

### Ingesting simulator output

Chronicle ingests logs via multiple methods:
- Syslog forwarding
- API ingestion
- Cloud storage bucket monitoring

For testing, use the Chronicle API:

```python
import requests
import json

# Read simulator output
with open('simulator_output.json') as f:
    events = [json.loads(line) for line in f]

# Send to Chronicle
for event in events:
    requests.post(
        'https://chronicle.googleapis.com/v1/logs:import',
        headers={'Authorization': 'Bearer ' + token},
        json={'log_text': json.dumps(event)}
    )
```

Or forward via syslog to Chronicle's ingestion endpoint.

### Basic BGP hijack detection

YARA-L rule for anomalous announcements:

```
rule bgp_hijack_detection {
  meta:
    author = "Department of Silent Stability"
    description = "Detects BGP prefix announcements from unexpected origin ASNs"
    severity = "HIGH"
    mitre_attack_tactic = "Impact"
    mitre_attack_technique = "T1557"

  events:
    $announce.metadata.event_type = "bgp_announcement"
    $announce.principal.asn != $announce.target.asn

  condition:
    $announce
}
```

Chronicle's YARA-L uses structured event fields. The `principal.asn` represents the announcing AS, `target.asn` 
represents the expected owner.

### RPKI validation failure detection

```
rule rpki_validation_failure {
  meta:
    author = "Department of Silent Stability"
    description = "Detects RPKI validation failures"
    severity = "MEDIUM"

  events:
    $rpki.metadata.event_type = "rpki_validation"
    $rpki.security_result.summary = "invalid"

  condition:
    $rpki
}
```

### Multi-event correlation

YARA-L excels at correlating events across time windows:

```
rule bgp_attack_chain {
  meta:
    author = "Department of Silent Stability"
    description = "Detects reconnaissance followed by BGP hijack"
    severity = "CRITICAL"

  events:
    $recon.metadata.event_type = "reconnaissance"
    $hijack.metadata.event_type = "bgp_announcement"
    $hijack.principal.asn != $hijack.target.asn
    
    $recon.principal.ip = $hijack.principal.ip

  match:
    $recon followed by $hijack over 1h

  condition:
    $recon and $hijack
}
```

This detects reconnaissance followed by hijack from the same IP within one hour. The `followed by` operator ensures 
temporal ordering.

### Threshold-based detection

Detect multiple RPKI failures from the same source:

```
rule multiple_rpki_failures {
  meta:
    author = "Department of Silent Stability"
    description = "Multiple RPKI validation failures from single source"
    severity = "HIGH"

  events:
    $rpki.metadata.event_type = "rpki_validation"
    $rpki.security_result.summary = "invalid"

  match:
    $rpki over 10m

  outcome:
    $source_ip = $rpki.principal.ip
    $failure_count = count_distinct($rpki.target.resource.name)

  condition:
    #rpki >= 5
}
```

This triggers when a source generates 5 or more RPKI failures in 10 minutes.

### Reference list matching

Chronicle supports reference lists (threat intelligence feeds):

```
rule bgp_announcement_from_threat_asn {
  meta:
    author = "Department of Silent Stability"
    description = "BGP announcement from known malicious ASN"
    severity = "CRITICAL"

  events:
    $announce.metadata.event_type = "bgp_announcement"
    $announce.principal.asn in %malicious_asns

  condition:
    $announce
}
```

Upload your threat intelligence as a reference list named `malicious_asns`, and Chronicle automatically correlates 
events against it.

## Platform selection considerations

Choosing a SIEM platform involves more than detection syntax. The Department has operated multiple platforms and 
learnt that each has strengths and weaknesses.

### When to use Splunk

Strengths:
- Mature platform with extensive integrations
- Powerful search language (SPL)
- Strong enterprise support
- Excellent for complex investigations

Weaknesses:
- Expensive, particularly at scale
- Licensing based on data volume encourages log reduction
- Complexity requires dedicated expertise

Best for: Organisations with budget for commercial SIEM and need for mature tooling.

### When to use Elastic Security

Strengths:
- Open source with commercial support available
- Excellent visualisation with Kibana
- Strong machine learning capabilities
- Good community and ecosystem

Weaknesses:
- Requires infrastructure management
- Scaling can be complex
- Less mature than commercial alternatives

Best for: Organisations wanting open source with the option for commercial support, teams comfortable managing 
Elasticsearch clusters.

### When to use Microsoft Sentinel

Strengths:
- Native Azure integration
- No infrastructure to manage (SaaS)
- Good correlation with Microsoft security products
- Fusion ML for advanced threat detection

Weaknesses:
- Tightly coupled to Azure ecosystem
- KQL learning curve for non-Microsoft teams
- Costs can escalate with data volume

Best for: Organisations already using Azure, Microsoft-centric environments, teams wanting managed SIEM.

### When to use Chronicle

Strengths:
- Unlimited storage (flat pricing model)
- Built for scale (petabytes of logs)
- Fast search across long time periods
- Strong for threat hunting

Weaknesses:
- Less mature than alternatives
- Fewer integrations than established platforms
- YARA-L learning curve

Best for: Large organisations with massive log volumes, teams focused on threat hunting over real-time alerting.

### When to use Wazuh

Strengths:
- Free and open source
- Lightweight and efficient
- Good for host-based monitoring
- Active community

Weaknesses:
- Less feature-rich than commercial options
- Correlation capabilities more limited
- Smaller ecosystem of integrations

Best for: Budget-conscious organisations, teams wanting open source without commercial lock-in, host-centric security 
monitoring.

## Cross-platform detection strategy

The Department runs Wazuh for cost efficiency but acknowledges that larger organisations often operate multiple SIEM 
platforms. Some practical advice for multi-SIEM environments:

### Maintain platform-agnostic detection logic

[Write detection patterns in pseudocode](generic.md) or plain language first. Then implement in platform-specific 
syntax. This makes sure your detection logic is portable.

### Use common data models where possible

Map simulator output to common schemas (ECS for Elastic, CIM for Splunk, etc.). This makes rules more portable and 
reduces platform lock-in.

### Centralise rule development

Keep detection rules in Git regardless of platform. One repository for Wazuh rules, another for Splunk searches, 
another for Sentinel queries. Version control everything.

### Test across platforms when feasible

If budget allows, test critical detection rules on multiple platforms. Different SIEM engines sometimes catch 
different things. Redundancy in detection is not wasteful if it catches attacks that would otherwise succeed.

### Document platform differences

When a rule works differently on different platforms, document why. Future you will appreciate knowing that Splunk's 
transaction command behaves differently from Elastic's EQL sequences.

## Next steps

You have completed the detection engineering section. You now understand detection patterns, platform-specific 
implementation, testing methodology, and integration approaches. 

The next section covers [Event Correlation](../correlation/index.rst) for building multi-event detection logic that 
catches sophisticated attack chains. Or if correlation is not your immediate focus, skip ahead to 
[Incident Response Playbooks](../response/index.rst) to learn how to respond when your shiny new detection rules 
actually fire.

No SIEM platform is perfect. They all have strengths and weaknesses, frustrating quirks, and occasional inexplicable 
behaviour. The goal is not finding the perfect platform but getting good enough detection working on whatever platform 
you have. The Scarlet Semaphore does not wait for you to finish evaluating vendors.
