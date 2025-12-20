# Wazuh lab: fat-finger hijack

## Purpose of this lab

This lab simulates a non-malicious but high-impact BGP incident caused by operator error:

* Incorrect origin AS
* Incorrect prefix announcement
* Legitimate peers accept the route
* Traffic is misdirected, then restored

This is not an attacker being clever.
This is a human being tired, rushed, or misled by tooling.

And the network does not care about intent.

## Scenario recap

An operator:

1. Intends to announce a route
2. Types the wrong AS number or prefix
3. Pushes the change
4. BGP does exactly what it is told
5. Traffic goes somewhere it should not
6. The mistake is corrected

Nothing breaks cryptographically. Nothing violates the protocol. Still an incident.

## What the simulator emits

Running:

```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml
```

emits a clean, structured stream of JSON events:

* Baseline announcements
* Anomalous origin AS
* Normal propagation
* Increased latency
* Operator correction
* Withdrawal

Each event is tagged with:

```json
{
  "scenario": {
    "name": "fat_finger-hijack",
    "attack_step": "...",
    "incident_id": "..."
  }
}
```

This allows Wazuh to correlate cause and effect, not just scream.

## Lab setup

* Wazuh manager running
* Agent configured for JSON ingestion
* Simulator output written to a monitored file

Example:

```bash
python -m simulator.cli simulator/scenarios/easy/fat_finger_hijack/scenario.yaml \
  > /var/log/red-lantern/fat_finger_hijack.log
```

Wazuh agent:

```xml
<localfile>
  <log_format>json</log_format>
  <location>/var/log/red-lantern/fat_finger_hijack.log</location>
</localfile>
```

## 1. Legitimate baseline

### Emitted event

```json
{
  "event_type": "bgp.update",
  "attributes": {
    "prefix": "198.51.100.0/24",
    "origin_as": 64500
  },
  "scenario": {
    "attack_step": "baseline"
  }
}
```

### Analyst expectation

* Known prefix
* Known origin
* Stable

Nothing to see here. That matters later.

## 2. Fat-finger announcement

### Emitted event

```json
{
  "event_type": "bgp.update",
  "attributes": {
    "prefix": "198.51.100.0/24",
    "origin_as": 64510
  },
  "scenario": {
    "attack_step": "mistyped_origin"
  }
}
```

### Why this is dangerous

* Same prefix
* Different origin
* No subprefix trickery
* Looks like a legitimate change

This is indistinguishable from:

* A migration
* A provider change
* A takeover

Context is everything.

## 3. Normal propagation

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "severity": "info",
    "message": "BGP UPDATE accepted for 198.51.100.0/24 from AS64510"
  },
  "scenario": {
    "attack_step": "propagation"
  }
}
```

### Detection insight

This is not noisy.

* No flapping
* No withdrawal
* No conflict

This is why fat-finger incidents spread globally.

## 4. Latency degradation

### Emitted event

```json
{
  "event_type": "network.latency",
  "attributes": {
    "prefix": "198.51.100.0/24",
    "latency_ms": 220,
    "baseline_ms": 35
  },
  "scenario": {
    "attack_step": "latency_shift"
  }
}
```

### Analyst

Traffic is still flowing.

Just:

* Slower
* Routed oddly
* Possibly hair-pinned

Users complain. Engineers blame “the internet”.

## 5. Operator realises the mistake

### Emitted event

```json
{
  "event_type": "router.syslog",
  "attributes": {
    "severity": "warning",
    "message": "Unexpected origin AS detected for 198.51.100.0/24"
  },
  "scenario": {
    "attack_step": "operator_notice"
  }
}
```

### This is the human moment

Most incidents end here, quietly. Wazuh should not.

## 6. Withdrawal and correction

### Emitted event

```json
{
  "event_type": "bgp.withdraw",
  "attributes": {
    "prefix": "198.51.100.0/24",
    "origin_as": 64510
  },
  "scenario": {
    "attack_step": "withdrawal"
  }
}
```

Followed by restoration of the legitimate origin.

## What this scenario is meant to exercise

### Detection signals

* Origin AS change without subprefix
* No corresponding change management record
* Latency shift correlated in time
* Clean withdrawal after anomaly

### Analyst judgement

* Distinguish accident from attack
* Escalate based on impact, not intent
* Recognise that “it fixed itself” is not closure

## Why this scenario matters

Fat-finger hijacks:

* Are responsible for some of the largest outages
* Often bypass security thinking
* Are perfect cover for deliberate abuse

If you can detect this well, you can detect worse.

## Common analyst failure modes

* “Looks like maintenance”
* “No policy violation”
* “It is gone now”
* “Probably just a typo”

All true. Still an incident.
