# Information sharing procedures

Dr. Crucible had put it simply: "The Circle Sea ISAC works because everyone contributes. If we only consume intelligence and never share it, we are asking others to defend us without helping to defend them." Golem Trust's participation in the Circle Sea Information Sharing and Analysis Centre is therefore both a practical necessity and an obligation of membership. This runbook defines what Golem Trust shares, what it does not share, the workflow for reviewing and publishing intelligence, and how incoming intelligence from ISAC partners is handled.

## What is shared

Golem Trust contributes the following categories of intelligence to Circle Sea ISAC:

IP addresses of confirmed attackers (TLP:GREEN): After an incident is closed and attribution to a threat actor is confirmed, the source IP addresses used in the attack are published to the ISAC. These must be confirmed attacking IPs, not merely suspicious ones. Published after the incident is fully contained and remediated.

Malware hashes (TLP:WHITE): SHA-256 hashes of any malware samples observed in Golem Trust's environment. These carry no identifying information about Golem Trust's infrastructure and are the most freely shareable category. Published as soon as the hash is confirmed and analysed.

Attack TTPs without attributable detail (TLP:WHITE): Descriptions of techniques, tactics, and procedures observed in attacks, expressed in MITRE ATT&CK framework terms. For example: "Initial access via SSH brute force followed by persistence via cron job creation (T1053.003)." No Golem Trust-specific infrastructure details are included.

## What is not shared

The following categories must never be shared via MISP or any other channel with external parties:

- Customer data of any kind, including metadata, record counts, or any information that could identify which customers are affected by an incident
- Golem Trust internal IP address ranges, server hostnames, or architecture details
- Vulnerability findings about Golem Trust's own infrastructure that are not yet remediated
- Information that could reveal proprietary system architecture or supplier relationships
- Intelligence marked TLP:RED, which by definition is restricted to named recipients only

If there is any uncertainty about whether a piece of information falls into the shareable category, the default answer is no. Angua has authority to approve TLP:WHITE publications without further escalation. Any TLP:GREEN publication requires Adora Belle's written approval.

## Sharing workflow

Step 1: Create the MISP event. Angua or Dr. Crucible creates the event in MISP with the indicators, TLP tags, and PAP (Permissible Actions Protocol) tags. The PAP tag determines what recipients may do with the information:

```
PAP:WHITE - May be used in automated blocking and public disclosure
PAP:GREEN - May be used internally and shared within the ISAC
PAP:AMBER - Share with trusted partners only, no automated use
PAP:RED   - Not shared externally
```

Step 2: Set distribution. The event distribution level determines which MISP instances receive it via synchronisation:

```
Distribution: This Community Only
```

"This Community" for Golem Trust means Circle Sea ISAC members. Do not set distribution to "All Communities" or "Connected Communities" without Adora Belle's approval.

Step 3: Angua reviews the event before publication. The review checklist:

```
[ ] No customer data present (even in comment fields)
[ ] No internal IP ranges or hostnames
[ ] No unremediated vulnerability details
[ ] TLP tag is appropriate for the content
[ ] PAP tag is set and consistent with TLP
[ ] Event description uses generic language, not Golem Trust-specific terms
[ ] All attributes have been verified (no false positives)
[ ] Decay scores are set appropriately (high confidence only)
```

Step 4: If the TLP level is TLP:GREEN, Angua sends the event link to Adora Belle for approval. Adora Belle's approval must be recorded as a MISP discussion comment on the event with the text "Approved for TLP:GREEN publication - Adora Belle" before publication proceeds.

Step 5: Publish the event. In MISP, click `Publish Event` on the event page. Alternatively, via the API:

```
curl -X POST "https://misp.golemtrust.am/events/publish/${EVENT_ID}" \
  -H "Authorization: ${MISP_API_KEY}" \
  -H "Accept: application/json"
```

Publication triggers synchronisation with the Circle Sea ISAC MISP instance. The ISAC's synchronisation server pulls the event within its next scheduled sync cycle (every 15 minutes).

Step 6: Record the publication in the Golem Trust intelligence sharing log. The log is a Google Sheet maintained by Angua, with columns: date, event ID, MISP event title, TLP level, PAP level, approved by, number of attributes shared.

## Workflow for TLP:GREEN approval

The TLP:GREEN approval request to Adora Belle should include:

```
Subject: MISP TLP:GREEN publication approval request - [Event title]

Event: [MISP event URL]
Summary: [One paragraph description of the intelligence, in plain English]
Attributes to be shared: [Count and types, e.g. "3 IP addresses, 1 domain"]
Reason for TLP:GREEN (vs TLP:AMBER): [Explanation]
Risk assessment: [Why sharing this will not harm Golem Trust or its customers]

Requested by: Angua
```

Adora Belle responds within 4 business hours for normal requests. For urgent publications following an active incident, the response time is within 1 hour, or Carrot may stand in.

## Receiving shared intelligence

When Circle Sea ISAC publishes new intelligence from member organisations, MISP's synchronisation pulls the events automatically. Angua receives a Graylog alert when a new high-confidence indicator arrives from an ISAC partner.

Configure the Graylog alert for incoming high-confidence MISP events by using the MISP ZeroMQ feed in Graylog (the same ZeroMQ publisher used for Suricata, but consumed by Graylog as well):

```
rule "alert-on-high-confidence-misp-indicator"
when
  has_field("misp_event_source") AND
  to_string($message.misp_event_source) != "Golem Trust" AND
  to_long($message.misp_attribute_decay_score) > 70
then
  route_to_stream("MISP Incoming High Confidence");
end
```

The "MISP Incoming High Confidence" stream has an alert condition that emails Angua when the message count exceeds zero within a 15-minute window. The email includes the event title, source organisation (anonymised if the ISAC has marked it as such), and attribute types.

Angua reviews incoming events weekly, correlating them against Golem Trust's own logs. If an incoming indicator matches activity already seen in Golem Trust's environment, she creates a Golem Trust event linking the two and considers whether a notification to the affected customer is required under the incident response policy.

## Handling TLP:AMBER intelligence from partners

TLP:AMBER indicators received from ISAC partners are used internally for Graylog enrichment and investigation context, but are not pushed to Suricata as IDS rules (which would make them visible in packet capture metadata) and are not included in the nftables blocklist (which might be inferred from connection resets). They are used only by analysts with direct access to MISP.

If a TLP:AMBER indicator from a partner is later confirmed as a threat to Golem Trust, Angua may request the originating organisation's permission to downgrade the TLP to GREEN, allowing it to be shared more widely. This request goes through the Circle Sea ISAC coordination team, not directly to the originating organisation.
Last updated: 20 March 2026
