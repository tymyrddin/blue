# Colonial Pipeline

Colonial Pipeline's May 2021 shutdown was not a cyberattack on a pipeline. It was an IT ransomware infection that
prompted a voluntary OT shutdown, the company halting physical operations as a precaution rather than because
attackers had reached the control systems. The physical infrastructure was intact. The pipeline stopped because
Colonial could not confirm the spread had been contained and billing systems were offline. DarkSide, the
ransomware-as-a-service operation behind the attack, encrypted roughly 100 gigabytes of corporate data and
threatened to publish it. The six-day shutdown of a system supplying around 45 per cent of fuel to the US East
Coast produced fuel shortages, panic buying, and a presidential emergency declaration. The incident does not
document what the attackers reached. It documents what the boundary between IT and OT does when an IT system is
unavailable and the operator can no longer confirm the scope of the compromise.

## 7 May 2021

On 7 May 2021, Colonial Pipeline discovered DarkSide ransomware on its IT network and took its pipeline systems
offline as a precaution. The shutdown lasted six days. Colonial Pipeline serves roughly 5,500 miles of pipeline
carrying petrol, diesel, and jet fuel from Texas to New York. The decision to halt operations was made before
attackers were confirmed to have reached any operational technology system; it was a response to uncertainty about
the scope of the IT infection and concern the ransomware might spread further.

Colonial paid approximately 4.4 million USD in Bitcoin. The US Department of Justice later recovered 2.3 million
USD of that payment. DarkSide issued a statement distancing itself from the geopolitical consequences, asserting
it had not intended to target critical infrastructure. The group went offline shortly after.

## One legacy account, no MFA

The DarkSide operators gained initial access through a single VPN account. The password for that account appeared
in a dataset of leaked credentials from an earlier, unrelated breach available on criminal forums. The account
was a legacy profile, not in active use but still enabled. There was no multifactor authentication on the VPN.

A stolen password, a VPN without MFA, and a legacy account never disabled. None of the three requires
sophisticated technique.

```powershell
# Hunting for stale VPN accounts: large gaps between last authentication and current date
# suggest accounts that were provisioned and forgotten rather than deprovisioned
# Event ID 4648 = explicit credential logon; adapt 'VPN' to match your account naming convention
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4648} |
    Where-Object { $_.Message -match 'VPN' } |
    Select-Object TimeCreated, @{n='User';e={$_.Properties[5].Value}} |
    Sort-Object TimeCreated
```

Credential monitoring against breach datasets and MFA enforcement on remote access paths are what would have
interrupted this chain at the first step. Neither requires knowledge of what an adversary plans to do next.

## Ransomware before the pipeline

DarkSide operated on a ransomware-as-a-service model: a core team maintained the malware and infrastructure
while affiliates conducted intrusions and split the ransom. The payload combined file encryption with prior
exfiltration, giving the operators a second lever if the victim had recoverable backups.

Before encrypting, DarkSide removed Windows Volume Shadow Copy snapshots and disabled recovery options to close
the recovery path:

```
REM DarkSide pre-encryption sequence: removes recovery points before the payload runs
vssadmin delete shadows /all /quiet
wbadmin delete catalog -quiet
bcdedit /set {default} bootstatuspolicy ignoreallfailures
bcdedit /set {default} recoveryenabled no
```

Detecting these commands before the encryption phase is possible if process creation auditing is enabled.
Event ID 4688 captures `vssadmin` and `bcdedit` with command-line arguments; both appearing within a short
window on a file server is a reliable signal of pre-ransomware activity.

## The boundary held, and it was not enough

Forensic assessment after the incident found no evidence that DarkSide had reached the operational technology
network or the pipeline control systems directly. The IT/OT boundary appears to have functioned as designed.
The shutdown was a business decision, not a forced outage.

That distinction does not reduce the impact. An operator that cannot confirm the scope of an IT infection
adjacent to OT systems, and whose billing and management systems are offline, has reasonable grounds to halt
physical operations regardless of what the control systems themselves indicate. The IT/OT boundary stopped the
ransomware. The loss of IT visibility and IT-dependent operational processes stopped the pipeline.

Segmentation is necessary but not sufficient on its own. A properly isolated OT environment reduces the blast
radius of an IT compromise and protects the control systems directly. It does not protect against the downstream
effects of IT system loss on operations that depend on those IT systems for billing, scheduling, or situational
awareness. Colonial Pipeline's experience gives that argument a specific and measurable form: six days, 45
per cent of East Coast fuel supply, and a ransom paid before the scope was fully understood.

## Related

- [IT/OT boundary](../architecture/boundary.md): the segmentation layer that held during Colonial Pipeline and
  also the layer that does not protect against IT-dependency effects when IT systems go offline
- [Remote access](../architecture/remote-access.md): VPN credential reuse and absent MFA are the access controls
  the incident tested at the entry point
- [CISA advisory AA21-131A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-131a): joint advisory
  on DarkSide ransomware with indicators of compromise and mitigations, May 2021
- [Smart Grid SimLab](../labs/smart-grid-sim): nation-colonial-pipeline models IT disruption that stops
  operations through loss of visibility rather than direct OT damage
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): SCADA default credentials, historian SQL
  injection and path traversal, and historian ingest poisoning; the access and monitoring chain through which
  operators lose situational awareness
