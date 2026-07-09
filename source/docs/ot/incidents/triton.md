# TRITON

In August 2017, an emergency shutdown at a Saudi petrochemical facility was initially investigated as an
equipment fault. It was not a fault. A bug in attack software designed to disable Safety Instrumented System
controllers caused two Triconex units to enter a fail-safe state rather than accept injected code. The shutdown
that followed exposed the malware. The framework, named TRITON by Mandiant and TRISIS by Dragos, was the first
publicly confirmed attempt to directly reprogram SIS controllers. Without the bug, the attack proceeds to its
next phase undetected. The shutdown, and the investigation it triggered, happened because the malware failed.

## August 2017, Saudi Arabia

The affected facility is widely reported as the Tasnee Advanced Petrochemical plant at Al-Jubail; the operator
has not been officially confirmed in any government disclosure. Attackers had maintained access inside the
network for around a year before deploying TRITON, moving laterally from corporate IT through the distributed
control system network to reach the isolated safety network. The safety system ran on Schneider Electric
Triconex controllers, a widely deployed SIS platform used across petrochemical, oil and gas, and power
generation facilities.

When the TRITON payload attempted to inject modified function blocks into the running SIS program, a CRC check
failed on two controllers simultaneously. Both entered a fail-safe state. The plant performed an emergency
shutdown. The shutdown appeared anomalous enough to prompt a forensic investigation rather than a simple restart,
and investigators found the TRITON framework on an engineering workstation.

Dragos tracks the responsible group as XENOTIME. Mandiant attributed the operation in 2019 to TsNIIKhM, the
Central Scientific Research Institute of Chemistry and Mechanics in Moscow, a Russian government research
institute.

## The SIS as the final barrier

A Safety Instrumented System is the independent protective layer designed to act autonomously when a process
exceeds safe operating limits. It runs on separate hardware from the distributed control system and is designed
to operate correctly even when the primary controller fails or issues dangerous commands. The assumption built
into its architecture is that it remains trustworthy regardless of the state of everything else.

That independence is what TRITON was built to remove. An attacker who disables the SIS before introducing a
process fault removes the last autonomous check on the outcome. The process continues past its safe envelope
with nothing to interrupt it. In a petrochemical facility handling flammable and toxic materials under pressure,
the likely outcome of an uncontrolled exceedance is a hazardous release or explosion. The TRITON kill chain
was designed to produce exactly that.

The SIS network at the target facility had a routable path reachable from the broader OT environment. That path
is what the attackers traversed. SIS networks isolated by physical separation or one-way data diodes rather
than by firewall rules are substantially harder to reach through this kind of lateral movement.

## TriStation: the proprietary channel

Triconex controllers are programmed and managed over TriStation, a Schneider Electric proprietary protocol
running on UDP and TCP port 1502. The protocol was not publicly documented at the time of the attack;
researchers subsequently reverse-engineered it from packet captures and firmware analysis.

TRITON included a full TriStation implementation. The framework could read program status from controllers,
enumerate memory tables, write modified function blocks, and trigger execution. The operators interacted with
target controllers programmatically through this implementation, giving them the same access as a legitimate
engineering workstation.

```bash
# Detecting unexpected TriStation connections: port 1502 traffic from non-engineering hosts
# Legitimate programming sessions originate from a small, known set of workstations;
# any other source, including a compromised workstation operating under attacker control,
# warrants investigation
tshark -i eth0 -f "tcp port 1502 or udp port 1502" \
    -T fields -e ip.src -e ip.dst -e frame.time
```

The traffic itself is not inherently distinguishable from a legitimate engineering session without behavioural
context. A connection from a host that has never previously appeared in TriStation traffic, or from an
engineering workstation at an unexpected time, is the signal worth acting on.

## The bug that revealed the attack

The injected code was designed to intercept the controller's execution cycle and accept further commands from
the attackers while reporting a normal operational status to any monitoring system. The CRC validation performed
by the Triconex firmware during function block loading detected the inconsistency and triggered the safe-state
transition before the injected code could execute.

Fail-safe behaviour is the designed response when a Triconex controller encounters an ambiguous state. The
attackers' payload triggered the exact defensive mechanism it was built to bypass. The plant shutdown. The
investigators found the framework. The attack was disclosed.

The inference is straightforward: the attackers would have remained undetected had the payload executed
correctly. Five years later, Predatory Sparrow completed the same kill chain at three Iranian steel mills
simultaneously, this time without the bug.

## Related

- [IEC 61850](../protocols/iec61850.md): substation protection standard; the relay bypass and SIS targeting
  techniques in TRITON and Industroyer target the same class of protective equipment
- [Modbus](../protocols/modbus.md): common field-level protocol in process industries; parameter register
  writes reach safety thresholds on SIS controllers that use Modbus as their field bus
- [Predatory Sparrow](predatory-sparrow.md): the June 2022 steel mill attacks that completed the TRITON kill
  chain; five years later, without the bug
- [CISA ICS-ALERT-17-352-01](https://www.cisa.gov/news-events/ics-advisories/ics-alert-17-352-01): original
  ICS-CERT alert from December 2017 with technical indicators and detection guidance
- [Smart Grid SimLab](../labs/smart-grid-sim): triton-full-kill-chain models the kill chain the 2017 malware
  was designed to complete; SIS offline on both substations then simultaneous cascading failure
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): multi-zone traversal from enterprise through
  operational into the control zone; relay IED threshold writes that disable protective limits
Last updated: 20 May 2026
