# Wazuh lab: subprefix interception

## Purpose of this lab

This lab focuses on a classic but still depressingly effective BGP attack:

* Traffic interception via more-specific prefix announcements
* No ROA manipulation required
* No protocol violation
* Everything looks “fine” unless you look across time and scope

You can learn how Wazuh detects:

* Gradual trust erosion
* Policy abuse
* Partial propagation
* Silent interception rather than outright hijack

## Scenario recap

The attacker does not try to steal the whole prefix. They:

1. Announce a more-specific subprefix
2. Let longest-prefix match do the work
3. Capture or redirect part of the traffic
4. Avoid breaking anything loudly
5. Withdraw quietly later

Nothing explodes. That is the point.

## What the simulator emits

Running:

```bash
python -m simulator.cli simulator/scenarios/medium/subprefix_intercept/scenario.yaml
```

produces a time-ordered stream of JSON events representing:

* Legitimate baseline announcements
* Subprefix announcements
* Partial peer propagation
* Latency shifts
* Asymmetric visibility
* Eventual withdrawal

Every event contains:

```json
{
  "scenario": {
    "name": "subprefix-intercept",
    "attack_step": "...",
    "incident_id": "..."
  }
}
```

This allows Wazuh to correlate across generators and time.

## Lab setup

* Wazuh manager running
* Agent configured for JSON ingestion
* Simulator output written to a monitored file

Example:

```bash
python -m simulator.cli simulator/scenarios/medium/subprefix_intercept/scenario.yaml \
  > /var/log/red-lantern/subprefix_intercept.log
```

Agent config:

```xml
<localfile>
  <log_format>json</log_format>
  <location>/var/log/red-lantern/subprefix_intercept.log</location>
</localfile>
```

## 1. Baseline route announcement

### Emitted event

```json
{
  "event_type": "bgp.update",
  "attributes": {
    "prefix": "203.0.113.0/24",
    "origin_as": 65001
  },
  "scenario": {
    "attack_step": "baseline"
  }
}
```

### Analyst expectation

* Normal
* Stable
* No alert. If this alerts, your SOC is already on fire.

## 2. Subprefix announcement appears

### Emitted event

```json
{
  "event_type": "bgp.update",
  "attributes": {
    "prefix": "203.0.113.128/25",
    "origin_as": 65004
  },
  "scenario": {
    "attack_step": "subprefix_announce"
  }
}
```

### Why this matters

* /25 beats /24
* This is legal BGP
* No RPKI violation if ROAs allow it or are absent

On its own, this is suspicious but not proof.

## 3. Partial propagation (not everyone sees it)

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "severity": "notice",
    "message": "BGP update for 203.0.113.128/25 received from peer AS64520"
  },
  "scenario": {
    "attack_step": "partial_propagation"
  }
}
```

### Detection insight

This is subtle and critical:

* Only some peers see the route
* Others continue using the legitimate /24
* Classic interception pattern

Wazuh should:

* Track prefix visibility changes
* Notice asymmetric propagation

## 4. Latency anomalies (traffic path distortion)

### Emitted event

```json
{
  "event_type": "network.latency",
  "attributes": {
    "prefix": "203.0.113.128/25",
    "latency_ms": 180,
    "baseline_ms": 40
  },
  "scenario": {
    "attack_step": "latency_shift"
  }
}
```

### Analyst

Traffic is still flowing, but:

* Paths are longer
* Inspection or tunnelling is likely
* Users complain vaguely, not loudly

This is where most SOCs shrug and move on. They should not.

## 5. No corresponding withdrawal of the /24

### Emitted event

```json
{
  "event_type": "bgp.update",
  "attributes": {
    "prefix": "203.0.113.0/24",
    "origin_as": 65001
  },
  "scenario": {
    "attack_step": "victim_still_present"
  }
}
```

### Why this is important

This confirms:

* This is not a migration
* Not traffic engineering
* Not maintenance

Both routes coexist. Only one should.

## 6. Sustained interception window

The simulator emits:

* Periodic latency metrics
* Occasional peer visibility logs
* No dramatic errors

This is intentional. Subprefix interception succeeds because it is boring.

Wazuh correlation should now show:

* Prefix containment relationship (/25 inside /24)
* Different origin ASNs
* Time overlap
* Performance degradation

This is where a medium-to-high severity alert is justified.

## 7. Quiet withdrawal

### Emitted event

```json
{
  "event_type": "bgp.withdraw",
  "attributes": {
    "prefix": "203.0.113.128/25",
    "origin_as": 65004
  },
  "scenario": {
    "attack_step": "withdrawal"
  }
}
```

### The trap

The network “fixes itself”. Do not close the incident automatically. This was:

* Temporary
* Targeted
* Successful

## What this scenario is meant to exercise

### Detection signals

* More-specific prefix announcements
* Competing origins
* Partial peer propagation
* Latency anomalies without outages
* Silent withdrawals

### Analyst skills

* Thinking in timelines, not alerts
* Understanding BGP mechanics
* Recognising interception vs hijack
* Resisting alert fatigue

## Differences ROA poisoning

| ROA poisoning             | Subprefix intercept      |
|---------------------------|--------------------------|
| Administrative compromise | Routing abuse            |
| RPKI involved             | Often no RPKI            |
| Loud policy changes       | Quiet protocol behaviour |
| Breaks validation         | Exploits longest-match   |

Both are control-plane attacks. Only one leaves paperwork.


