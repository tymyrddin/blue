# Alert configuration

The fundamental property of a deception alert is that it should be impossible to trigger accidentally under normal circumstances. There is no legitimate reason for any production system, any automated process, or any staff member going about their ordinary work to authenticate to a honeypot service, open a honeydoc file, or use a fake AWS credential. This is what makes deception alerts different from every other alert in the Graylog stack: the false positive rate is theoretically zero. In practice it is near zero. There has been one exception, documented at the end of this runbook, which was caused by an Ansible playbook that should have known better.

## Graylog stream configuration

Deception events are routed to the "Deception Events" stream in Graylog. Stream rules:

```
Stream: Deception Events
Rules (match ALL):
  - Field: gl2_source_input, value: opencanary-syslog OR canarytoken-webhook
    (i.e. source must be one of the deception inputs)

  OR

  Field: event_type, operator: contains, value: honeypot_
```

The stream is configured with the highest priority in Graylog's stream routing. Events that match the deception stream rules are routed there before any other stream rules are evaluated.

## Alert condition

The alert condition for deception events is deliberately simple: any single event in the Deception Events stream triggers an alert immediately. There is no threshold, no aggregation window, no "fire only if 5 events in 10 minutes." One event is enough.

```
Alert condition: Deception Event
Type: Message count
Stream: Deception Events
Condition: count > 0
Time range: 1 minute
Grace period: 0 minutes (no grace; every event alerts)
Backlog: 1 (include the triggering event in the alert)
```

The grace period is zero. If three honeypot accesses occur within five minutes from the same source, three separate PagerDuty alerts are created. This is intentional: each access may represent a different technique or a different stage of an attack, and Angua wants to see them separately.

## PagerDuty integration

Deception events page Angua regardless of time of day. PagerDuty escalation policy for deception alerts:

```
Escalation policy: Deception High Priority
Level 1: Angua von Überwald (immediate)
  - Mobile push: immediate
  - Phone call: if not acknowledged in 5 minutes
Level 2: Carrot Ironfoundersson (if not acknowledged in 15 minutes)
Level 3: Security on-call rotation (if not acknowledged in 30 minutes)
```

The service account used for Graylog-to-PagerDuty integration is `graylog-alerts@golemtrust.pagerduty`. The integration key is stored in Vaultwarden under `infrastructure/pagerduty/graylog-deception-integration-key`.

## Alert enrichment

When a deception event fires, the Graylog pipeline enriches it before the alert is sent. The enrichment pipeline adds four fields.

MISP threat intelligence context: the source IP is looked up in the MISP lookup table. If the IP is a known threat actor, the alert includes the MISP event reference and any associated threat group attribution.

```
rule "Enrich deception event with MISP intel"
when
  has_field("src_ip") AND
  to_string($message.gl2_stream_id) == "deception-events-stream-id"
then
  let misp_lookup = lookup("misp-ip-lookup", $message.src_ip);
  set_field("misp_event_id", misp_lookup["event_id"]);
  set_field("misp_threat_actor", misp_lookup["threat_actor"]);
  set_field("misp_confidence", misp_lookup["confidence"]);
end
```

GeoIP context: source IP geolocation, added by the standard GeoIP enrichment pipeline that runs on all events. The deception alert format includes the country and city.

Token registry context: the specific token or service accessed is looked up in the canary registry lookup table. The alert includes the token type, its deployment location, and when it was placed.

```
rule "Enrich deception event with token registry"
when
  has_field("canary_token_id")
then
  let token_info = lookup("canary-registry", $message.canary_token_id);
  set_field("token_type", token_info["token_type"]);
  set_field("token_location", token_info["location"]);
  set_field("token_deployed_date", token_info["deploy_date"]);
end
```

## Alert format

The PagerDuty alert body format, rendered as JSON for the API:

```
{
  "routing_key": "PAGERDUTY_INTEGRATION_KEY",
  "event_action": "trigger",
  "payload": {
    "summary": "DECEPTION: ${token_type} accessed from ${src_ip} (${geoip_country})",
    "severity": "critical",
    "source": "graylog-deception",
    "timestamp": "${timestamp}",
    "custom_details": {
      "token_or_service": "${token_type}: ${token_location}",
      "source_ip": "${src_ip}",
      "geolocation": "${geoip_city}, ${geoip_country}",
      "user_agent": "${http_user_agent}",
      "auth_attempted": "${auth_username}",
      "misp_context": "${misp_threat_actor} (confidence: ${misp_confidence})",
      "timestamp_utc": "${timestamp}"
    }
  }
}
```

The summary line is designed to be readable as a phone notification: "DECEPTION: aws_credential accessed from 185.220.101.55 (Netherlands)" is enough context for Angua to understand immediately what happened, even before she opens the full alert.

## False positive procedure

Angua owns all deception alerts. The procedure for evaluating a potential false positive:

1. Check the source IP. Is it an internal Headscale IP or an external IP?
2. For internal IPs: check Teleport session logs to determine which user was on that host at the time.
3. Check the token location. Is there any legitimate operational reason for a process to access that location?
4. If no legitimate reason can be identified: treat as real incident.
5. If a legitimate reason is identified: document in `security/deception/false-positives.md` and consider whether the token placement should be changed.

## The Ansible playbook incident

The one documented false positive occurred in November 2025. An Ansible playbook for database connection testing included `honeypot-db.internal` in its inventory file, apparently copied from an old host list by a new team member who did not know what the hostname represented. The playbook ran and attempted a PostgreSQL connection, which triggered a high-priority deception alert at 02:30.

Angua investigated, identified the cause within 12 minutes, and called Ponder, who had written the playbook. The false positive was resolved by removing `honeypot-db.internal` from the inventory file and adding a comment explaining why it should never appear in any inventory. The incident was documented. The canary registry now includes a field, `known_false_positive_sources`, which lists any known systems that might legitimately trigger the token (for these eight accounts, the field is empty for all tokens except `honeypot-db.internal`, which now lists `ansible-runner-01` as a known false positive source with a note that it is a misconfiguration, not a legitimate access pattern).

The team discussed whether to add a suppression rule for the Ansible runner. The conclusion was no: the correct fix was ensuring the inventory was correct, not teaching Graylog to ignore the honeypot being accessed by a production system.
