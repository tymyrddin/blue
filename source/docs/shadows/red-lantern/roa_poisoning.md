# Wazuh lab: ROA poisoning/control-plane manipulation

## Purpose of this lab

This lab teaches three things:

1. What ROA poisoning actually looks like in logs
2. How control-plane abuse unfolds over time
3. How Wazuh correlates low-level signals into a meaningful incident

This is *not* about detecting a single bad packet. It is about detecting intent across layers.

## Scenario recap (human terms)

The attacker does not break BGP directly. They:

1. Gain access to routing management
2. Remove or alter RPKI authorisation
3. Change routing policy
4. Announce a prefix legitimately (from the protocol’s point of view)
5. Suppress the victim route
6. Add noise to delay detection
7. Clean up

Every step is technically valid. That is why this is interesting.

## What the simulator emits (ground truth)

When you run:

```bash
python -m simulator.cli simulator/scenarios/advanced/roa_poisoning/scenario.yaml
```

You get a timeline of JSON events that include:

* Access logs
* RPKI state changes
* Configuration changes
* BGP announcements
* Route rejections
* Blackhole indicators
* Flapping noise
* Cleanup actions

Each event includes something like:

```json
{
  "scenario": {
    "name": "roa-poisoning",
    "attack_step": "...",
    "incident_id": "..."
  }
}
```

This is deliberate. Wazuh is very good at connecting dots when the dots exist.

## Lab prerequisites

You need:

* A running Wazuh manager
* At least one Wazuh agent (can be on the same machine)
* Custom decoders and rules installed:

  * `wazuh/decoders/bgp_decoders.xml`
  * `wazuh/rules/signal_*.xml`

No OpenSearch dashboards required for the lab. Logs and alerts are enough.

## 1. Feed the simulator output to Wazuh

### Log file ingestion

Create a log file:

```bash
mkdir -p /var/log/red-lantern
python -m simulator.cli simulator/scenarios/advanced/roa_poisoning/scenario.yaml \
  > /var/log/red-lantern/roa_poisoning.log
```

Configure the Wazuh agent to monitor it as JSON:

```xml
<localfile>
  <log_format>json</log_format>
  <location>/var/log/red-lantern/roa_poisoning.log</location>
</localfile>
```

Restart the agent.

## 2. Observe baseline (nothing is wrong yet)

### Emitted event

```json
{
  "event_type": "rpki.validation",
  "attributes": {
    "prefix": "203.0.113.0/24",
    "origin_as": 65001,
    "validation_state": "valid"
  },
  "scenario": {
    "attack_step": "baseline"
  }
}
```

### Analyst interpretation

* Prefix has a valid ROA
* Origin AS matches expectation
* No alert should fire. If your rules alert here, your rules suck.

## 3. Initial access signal (weak on its own)

### Emitted event

```json
{
  "event_type": "access.login",
  "attributes": {
    "user": "admin_backup",
    "source_ip": "185.220.101.45",
    "location": "RU",
    "system": "routing_portal",
    "suspicious": true
  },
  "scenario": {
    "attack_step": "initial_access"
  }
}
```

### What Wazuh should do

* Decode access metadata
* Possibly raise a low-severity alert
* Do not escalate yet

This is important: Plenty of networks have weird logins. Context matters.

## 4. ROA manipulation (control plane tampering)

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "severity": "warning",
    "subsystem": "rpki",
    "message": "ROA for 203.0.113.0/24 removed by admin_backup"
  },
  "scenario": {
    "attack_step": "roa_manipulation"
  }
}
```

### What Wazuh should detect

This is not normal operational noise.

Expected behaviour:

* Alert on ROA deletion
* Link it to:

  * user
  * prefix
  * previous access anomaly

At this point, a medium-severity alert is justified.

## 5. RPKI state flip (impact confirmation)

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "severity": "notice",
    "message": "RPKI state for 203.0.113.0/24 flipped from valid to not_found"
  },
  "scenario": {
    "attack_step": "rpki_impact"
  }
}
```

### Why this matters

This is the *mechanical consequence* of the previous step.

Wazuh should now be able to correlate:

* ROA removal
* RPKI validation change
* Same prefix
* Same timeframe

This is escalation territory.

## 6. Policy change (making the attack stick)

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "subsystem": "config",
    "message": "Configuration change by admin_backup: Update peering policies"
  },
  "scenario": {
    "attack_step": "policy_change"
  }
}
```

### Detection logic

Policy changes during an RPKI incident are never innocent. Wazuh should:

* Flag unauthorised config change
* Correlate with:

  * earlier access
  * ROA manipulation
  * same user

This is where incident confidence increases sharply.

## 7. Malicious but valid BGP announcement

### Emitted event

```json
{
  "event_type": "bgp.update",
  "attributes": {
    "prefix": "203.0.113.0/24",
    "origin_as": 65004
  },
  "scenario": {
    "attack_step": "malicious_announce"
  }
}
```

### The trap

This announcement is:

* RPKI-valid
* Structurally correct
* Protocol-compliant

Pure BGP monitoring cannot tell this is malicious. Only earlier context makes it suspicious. This is why control-plane telemetry matters.

## 8. Victim route rejection

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "severity": "error",
    "message": "Route 203.0.113.0/24 from AS65001 rejected: rpki_invalid"
  },
  "scenario": {
    "attack_step": "route_rejection"
  }
}
```

### Analyst

This confirms:

* The attack succeeded
* Traffic is now diverted or blackholed
* Business impact is imminent or ongoing

At this point, Wazuh should be firing a high-severity alert.

## 9. Noise injection (covering tracks)

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "severity": "warning",
    "message": "Coordinated flapping on prefixes..."
  },
  "scenario": {
    "attack_step": "route_flapping"
  }
}
```

This is classic:

* Distract operators
* Flood alert channels
* Delay root-cause analysis

Good rules do not downgrade because of noise.

## 10. Cleanup (attacker exits)

ROA restored, logout event emitted.

This is not “all good”. It is post-incident. Wazuh should:

* Close the incident
* Preserve context
* Avoid auto-suppression

## What this lab teaches

* BGP attacks are often administrative, not technical
* Single events lie; timelines tell the truth
* RPKI can be weaponised
* Wazuh is strong when telemetry is structured
* Detection engineering beats signature chasing

