# Custom rule development

The default Falco ruleset catches a wide range of suspicious behaviour, but Golem Trust's environment has specific requirements that the defaults do not cover. Dr. Crucible and Cheery maintain a set of custom rules in the `golem-trust/falco-rules` GitLab repository. These rules encode the operational policies that Ludmilla documented in the threat model: production database containers must not spawn shells, application containers must not reach the Kubernetes API server, and any process resembling a crypto miner must be caught within seconds. This runbook covers the Falco rule syntax and the process for writing, testing, and deploying new rules.

## Rule syntax fundamentals

A Falco rule file uses three constructs: `list`, `macro`, and `rule`.

A `list` is a named sequence of values used in conditions:

```
- list: golem_trust_db_images
  items:
    - postgres
    - redis
    - mongodb

- list: golem_trust_allowed_shells
  items:
    - /bin/sh
    - /bin/bash
    - /usr/bin/sh
    - /usr/bin/bash
```

A `macro` is a named boolean expression, used to compose larger conditions without repetition:

```
- macro: is_database_container
  condition: >
    container.image.repository in (golem_trust_db_images)

- macro: spawned_process
  condition: evt.type = execve and evt.dir = <
```

A `rule` combines macros and conditions with a priority level and output format:

```
- rule: Shell spawned in database container
  desc: A shell was spawned inside a database container, which should never occur in production
  condition: >
    spawned_process and
    is_database_container and
    proc.name in (golem_trust_allowed_shells)
  output: >
    Shell spawned in database container
    (user=%user.name container=%container.name image=%container.image.repository
    shell=%proc.name parent=%proc.pname cmdline=%proc.cmdline)
  priority: CRITICAL
  tags: [golem_trust, database, shell]
```

## Priority levels

Falco supports five priority levels: `CRITICAL`, `ERROR`, `WARNING`, `NOTICE`, and `DEBUG`. At Golem Trust these map to the following response expectations:

- `CRITICAL`: PagerDuty page, automated response may be triggered, review within 15 minutes
- `ERROR`: Graylog alert, Slack notification, review within 2 hours
- `WARNING`: Graylog alert, Slack notification, review next business day
- `NOTICE`: Logged to Graylog only, reviewed in weekly triage
- `DEBUG`: Logged locally only, used during rule development

## Golem Trust custom rules

The full ruleset is in `golem-trust/falco-rules`. The key rules are summarised below.

Production database containers must not spawn shells:

```
- rule: Shell spawned in production database container
  desc: A shell process was started inside a database container
  condition: >
    spawned_process and
    is_database_container and
    proc.name in (golem_trust_allowed_shells) and
    k8s.ns.name in (production, prod)
  output: >
    Shell in production DB container
    (ns=%k8s.ns.name pod=%k8s.pod.name image=%container.image.repository
    cmd=%proc.cmdline user=%user.name)
  priority: CRITICAL
  tags: [golem_trust, database, prod]
```

Application containers must not contact the Kubernetes API server:

```
- macro: k8s_api_server
  condition: >
    fd.sip = "10.96.0.1" or
    fd.sport = 6443

- rule: Application container connecting to Kubernetes API
  desc: An application container opened a connection to the Kubernetes API server
  condition: >
    evt.type in (connect, sendto) and
    k8s_api_server and
    not k8s.ns.name in (kube-system, falco, monitoring) and
    container
  output: >
    Application container connecting to Kubernetes API
    (ns=%k8s.ns.name pod=%k8s.pod.name image=%container.image.repository
    dest=%fd.sip:%fd.sport)
  priority: ERROR
  tags: [golem_trust, k8s_api, lateral_movement]
```

Crypto mining detection (covering the compromised developer workstation scenario):

```
- list: crypto_mining_domains
  items:
    - pool.minexmr.com
    - xmrpool.eu
    - moneropool.com
    - nanopool.org
    - supportxmr.com

- list: crypto_mining_processes
  items:
    - xmrig
    - minerd
    - cpuminer
    - cgminer
    - bfgminer

- rule: Crypto mining process detected
  desc: A process associated with cryptocurrency mining was executed in a container
  condition: >
    spawned_process and
    proc.name in (crypto_mining_processes)
  output: >
    Crypto miner process started
    (ns=%k8s.ns.name pod=%k8s.pod.name image=%container.image.repository
    proc=%proc.name parent=%proc.pname cmdline=%proc.cmdline user=%user.name)
  priority: CRITICAL
  tags: [golem_trust, crypto_mining, malware]

- rule: Network connection to known mining pool
  desc: A container made a DNS or TCP connection to a known crypto mining pool
  condition: >
    (evt.type in (connect, sendto)) and
    fd.l4proto = tcp and
    fd.sport in (3333, 4444, 5555, 7777, 8333, 9999, 14444, 45700) and
    container
  output: >
    Connection to probable mining pool port
    (ns=%k8s.ns.name pod=%k8s.pod.name image=%container.image.repository
    dest=%fd.sip:%fd.sport)
  priority: CRITICAL
  tags: [golem_trust, crypto_mining, network]
```

## Overriding default rules

To tune a default rule without replacing it entirely, use `override: append` to extend the condition with additional exceptions:

```
- rule: Write below etc
  override:
    condition: append
  condition: and not proc.name = vault-agent
```

This appends the exception to the original condition. It is the preferred pattern for reducing false positives because it survives Falco upgrades: the base rule is still updated by the upstream chart, and the override is applied on top.

## Testing rules with dry-run

Before deploying a new rule to production, test it against a sample event stream using `--dry-run`. On a worker node with access to the rule file:

```
falco --dry-run -r /etc/falco/golem_trust_rules.yaml
```

Falco will parse and validate all rules without actually starting the sensor. Syntax errors and undefined macro references are reported. For functional testing, use a test container to generate the specific system call pattern the rule targets. The testing procedure is covered in the troubleshooting runbook.
Last updated: 10 July 2026
