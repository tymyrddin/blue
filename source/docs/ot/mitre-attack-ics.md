# MITRE ATT&CK for ICS

MITRE's ATT&CK for ICS framework adapts the enterprise adversary behaviour taxonomy for operational technology
environments, where the final objective is often physical rather than informational and where several tactics,
Inhibit Response Function in particular, have no enterprise equivalent. The framework names what the protocol
and incident pages describe: vocabulary for discussing technique across incidents without redescribing each one.

The tactics run roughly in kill-chain order from initial access to physical impact, though campaigns routinely
compress or skip phases. The incidents in this section touch most of them.

## Initial Access

Entry into the target environment. [FrostyGoop](incidents/frostygoop.md) used a directly internet-accessible
Modbus port; [Colonial Pipeline](incidents/colonial-pipeline.md) used a compromised VPN credential with no
MFA on a legacy account; [Ukraine grid 2015](incidents/ukraine-grid.md) used spear-phishing emails carrying
BlackEnergy. The access vector often predates the OT-specific payload by months.

## Execution

Running attacker-controlled code or commands against target devices. [Industroyer](incidents/ukraine-grid.md)
issued IEC 104 and IEC 61850 commands autonomously after deployment, with no further attacker interaction.
[TRITON](incidents/triton.md) executed TriStation commands to modify function blocks on Triconex controllers.
[FrostyGoop](incidents/frostygoop.md) issued Modbus write commands from a binary reading a configuration file.

## Persistence

Maintaining access across restarts, credential rotation, and defensive responses. [Volt Typhoon](incidents/volt-typhoon.md)
held access inside US critical infrastructure networks for at least five years. Industroyer included a
configurable backdoor for re-entry after the primary payload executed. [TRITON](incidents/triton.md) operators
spent around a year inside the target network before deploying their payload.

## Privilege Escalation

Acquiring permissions beyond those of the initial foothold. [Volt Typhoon](incidents/volt-typhoon.md) used
`ntdsutil` for credential material on domain controllers. [TRITON](incidents/triton.md) operators moved
laterally from corporate IT through the DCS network to reach the safety network, acquiring access to
progressively more sensitive systems at each stage.

## Evasion

Avoiding detection by security monitoring. [Volt Typhoon](incidents/volt-typhoon.md) used only Windows
built-in tools and SOHO router proxies to blend with normal administrative traffic. [Stuxnet](incidents/stuxnet.md)
used stolen digital signatures from Realtek and JMicron for its drivers and verified the exact target
configuration before executing any payload. Industroyer included a self-overwrite component to destroy
forensic evidence after execution.

## Discovery

Mapping the target environment. [Pipedream](incidents/pipedream.md) included a network enumeration component
that scanned for OT devices across Modbus, EtherNet/IP, OPC UA, MMS, and IEC 104 simultaneously.
[Stuxnet](incidents/stuxnet.md) checked for a specific PLC model, drive manufacturer, and exact drive count
before activating. [Volt Typhoon](incidents/volt-typhoon.md) used `net group` and `wmic` to enumerate domain
computers and remote processes.

## Lateral Movement

Moving from the initial foothold toward target systems. [TRITON](incidents/triton.md) traversed from corporate
IT through the DCS network to the isolated safety network. [Volt Typhoon](incidents/volt-typhoon.md) used
`wmic /node:` for remote execution across the network from a compromised host. [Ukraine grid 2015](incidents/ukraine-grid.md)
operators spent months inside the network learning the SCADA interfaces before executing the blackout.

## Collection

Gathering information about the environment and process state before acting. [Volt Typhoon](incidents/volt-typhoon.md)
accumulated detailed knowledge of network architecture, operational procedures, and system dependencies across
years of maintained access. [Pipedream](incidents/pipedream.md) used OPC UA namespace browsing to enumerate
process variables across any compliant device regardless of manufacturer.

## Command and Control

Communicating with compromised systems and maintaining operator control after deployment. Industroyer included
a scheduling component and backdoor, allowing execution without an active attacker connection and permitting
re-entry after the attack. [Volt Typhoon](incidents/volt-typhoon.md) routed command traffic through a botnet
of compromised SOHO routers to complicate attribution and blocking.

## Inhibit Response Function

Suppressing safety systems, protection relays, and automatic responses before or during an attack. The
distinction from Impair Process Control is the target: this tactic removes the mechanisms that would otherwise
interrupt the damage. [TRITON](incidents/triton.md) targeted Triconex SIS controllers to remove autonomous
plant shutdown capability. [Predatory Sparrow](incidents/predatory-sparrow.md) took safety systems offline
before triggering process faults at three Iranian steel mills. Industroyer's relay bypass sent trip-prevention
commands to protection relays, blocking automatic reclosure after breakers were opened.

## Impair Process Control

Interfering with the operation of physical processes by issuing unauthorised commands to field devices or
manipulating process data. [Stuxnet](incidents/stuxnet.md) modified centrifuge operating speeds while
returning normal readings to SCADA. [FrostyGoop](incidents/frostygoop.md) wrote directly to ENCO controller
registers to disable heating delivery. [Ukraine grid 2016](incidents/ukraine-grid.md) issued IEC 104 commands
to open substation breakers autonomously across multiple RTUs.

## Impact

The consequence for the physical process or the operations that depend on it. [Ukraine grid attacks](incidents/ukraine-grid.md)
caused civilian power outages across western Ukraine on two occasions. [Colonial Pipeline](incidents/colonial-pipeline.md)
shut down around 45 per cent of East Coast fuel supply for six days through IT-dependency effects rather than
direct OT compromise. [Predatory Sparrow](incidents/predatory-sparrow.md) caused industrial fires at Khuzestan
Steel. [Stuxnet](incidents/stuxnet.md) destroyed an estimated 1,000 centrifuges at Natanz over several years
without triggering a visible alert.

## Related

- [MITRE ATT&CK for ICS](https://attack.mitre.org/matrices/ics/): the full matrix with techniques and
  sub-techniques for each tactic
Last updated: 19 May 2026
