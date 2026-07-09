# Indicator import and export

Angua's investigation had produced a list: three IP addresses, two domain names, a file hash, and a pattern of behaviour she recognised from the Tsort APT's previous operations. Getting that information into MISP in a structured, shareable form, and getting it out again in the formats that Suricata and the firewall required, is what this runbook covers. It also addresses the ongoing management of indicators over time: adding context, marking false positives, expiring stale data, and filtering which indicators go to which downstream tools.

## MISP event structure

The fundamental unit in MISP is the Event. An Event represents a campaign, an incident, or a coherent intelligence report. Events contain Attributes (individual indicators such as IP addresses, domain names, file hashes, and URLs) and Objects (structured groups of related attributes, such as a network connection object containing an IP, port, and protocol).

Every event has:

- An organisation (the creator; defaults to "Golem Trust" for internally created events)
- A distribution level: This Organisation Only, This Community Only (Circle Sea ISAC members), Connected Communities, or All Communities
- A threat level: High, Medium, Low, or Undefined
- An analysis status: Initial, Ongoing, or Completed
- TLP tag: one of `tlp:white`, `tlp:green`, `tlp:amber`, or `tlp:red`

## Creating events for observed attacks

When Angua observes an attack, she creates a MISP event to record the indicators. The procedure:

1. Navigate to `Event Actions`, `Add Event`
2. Set the event date, distribution, and threat level
3. Add the initial TLP tag before adding any attributes
4. Use `Add Attribute` to enter each indicator individually, or use `Freetext Import` to paste a bulk list of indicators for automatic parsing

For bulk import via the API:

```
curl -X POST https://misp.golemtrust.am/events \
  -H "Authorization: ${MISP_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "Event": {
      "info": "Tsort APT - SSH brute force campaign 2026-03",
      "threat_level_id": 2,
      "distribution": 1,
      "analysis": 1,
      "Attribute": [
        {"type": "ip-src", "value": "195.87.44.12", "to_ids": true, "comment": "Source of SSH brute force attempts"},
        {"type": "ip-src", "value": "185.220.101.55", "to_ids": true, "comment": "Tor exit node observed in campaign"},
        {"type": "domain", "value": "tsort-c2.example.am", "to_ids": true, "comment": "Suspected C2 domain"}
      ]
    }
  }'
```

The `to_ids` field marks an attribute as suitable for use in IDS/IPS rules. Set this to `true` for high-confidence actionable indicators and `false` for contextual information that should not generate alerts.

## Threat actor galaxy tagging

Tag events with the appropriate threat actor galaxy entry to enable correlation across incidents. MISP's Galaxy system includes pre-built clusters; Golem Trust maintains custom entries for the three principal threat actors in its threat model.

To tag an event with the Tsort APT entry:

1. Open the event
2. Click `Add Tag`
3. Select the Galaxy `misp-galaxy:threat-actor="Tsort Advanced Persistent Thieves"`

Custom threat actor galaxy entries for Golem Trust's threat model:

```
Tsort Advanced Persistent Thieves
  Motivation: Financial, espionage
  Sector targets: Banking, government, data storage
  Known TTPs: SSH brute force, spear-phishing, supply chain compromise
  First observed: 2024-06

Klatch Cryptographic Gang
  Motivation: Financial (ransomware, cryptomining)
  Sector targets: Any internet-exposed infrastructure
  Known TTPs: Exposed API exploitation, container escape, cryptominer deployment
  First observed: 2023-11

Pseudopolis Ransomware Collective
  Motivation: Financial (ransom payment)
  Sector targets: Healthcare, finance, critical infrastructure
  Known TTPs: Initial access brokers, double extortion, data exfiltration before encryption
  First observed: 2025-01
```

Create or update these entries in `Galaxies`, `Golem Trust Custom`, via the Galaxy management interface.

## STIX 2.1 export for sharing

When sharing intelligence with Circle Sea ISAC or other partners, export events in STIX 2.1 format. MISP generates STIX 2.1 automatically from its event structure.

Export a single event via the API:

```
curl "https://misp.golemtrust.am/events/restSearch" \
  -H "Authorization: ${MISP_API_KEY}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"returnFormat": "stix2", "eventid": 42}' \
  > event-42-stix2.json
```

Review the exported STIX before sending: confirm TLP markings are correct, no internal Golem Trust infrastructure details are present in the description fields, and the distribution level is appropriate for the intended recipient.

## Importing STIX from external partners

MISP can import STIX 2.1 bundles received from partners. Use the import module:

```
curl -X POST https://misp.golemtrust.am/events/upload_stix \
  -H "Authorization: ${MISP_API_KEY}" \
  -F "file=@partner-stix-bundle.json" \
  -F "stix_version=2"
```

After import, review the created event to confirm attributes have been parsed correctly and TLP tags have been applied. Angua reviews all imported events from external partners before marking them as `analysis: Completed`.

## Attribute lifecycle management

Indicators have a useful lifetime. An IP address used by a threat actor may be reassigned to a legitimate business within weeks. MISP's Decay models manage indicator ageing automatically.

Enable the default decay model for all new attributes in `Administration`, `Server Settings`, `Plugin`:

```
Plugin.Sightings_enable: true
Plugin.DecayingModels_enable: true
```

The default polynomial decay model reduces an attribute's score over time. When the score falls below the threshold (default 30 out of 100), the attribute is no longer published to IDS and is filtered from the Suricata and firewall exports.

To manually mark an attribute as a false positive:

1. Open the event containing the attribute
2. Click the attribute's edit icon
3. Set `to_ids` to false
4. Add a comment explaining the false positive determination
5. Tag with `workflow:state="false-positive"`

## Filtering: which indicators reach which tools

Not all indicators are appropriate for all downstream tools. The filtering logic:

Suricata (IDS rules): receives all attributes with `to_ids=true` and type in (`ip-src`, `ip-dst`, `domain`, `url`, `hostname`). Confidence threshold: attribute score above 50 on the decay model. TLP filter: TLP:WHITE and TLP:GREEN only (Suricata rules may be visible in packet capture, so TLP:AMBER indicators are handled separately via the firewall blocklist).

Graylog (lookup table enrichment): receives all attributes with types (`ip-src`, `ip-dst`, `ip`) regardless of `to_ids`, for context enrichment only. The Graylog lookup is read-only and does not generate alerts directly. TLP filter: all TLP levels (Graylog enrichment is internal).

Firewall nftables blocklist: receives attributes with type `ip-src` or `ip-dst`, `to_ids=true`, confidence above 80, and TLP:AMBER or lower. High-confidence IPs only; do not blocklist IPs from feeds unless the decay score confirms they remain active.

DefectDojo CVE matching: receives attributes with type `vulnerability-type` (CVE numbers), used to correlate vulnerability management findings with active exploitation campaigns. No TLP filter applied, as CVE numbers are public.

Configure these filter rules in the MISP event export settings for each integration (see the security tools integration runbook for the integration-side configuration).
Last updated: 20 March 2026
