# Ukraine grid attacks

Sandworm, the Russian GRU unit responsible for NotPetya and several of the most consequential cyberattacks on
record, attacked the Ukrainian power grid three times in seven years. In December 2015, the operators' own
remote desktop sessions opened the breakers; the malware's job was access and clean-up. In December 2016,
Industroyer arrived with protocol-native modules that spoke directly to grid equipment and required no human
operator to issue commands. In April 2022, Industroyer2 appeared as a single executable hardcoded for one
specific substation: every IP address, every port, every information object address written into the binary.
Ukrainian defenders stopped it before execution. The arc from 2015 to 2022 is one of increasing technical
investment meeting improving defence.

## December 2015

On 23 December 2015, operators at three Ukrainian regional electricity distribution companies watched their
cursors move across the screen without their hands on the mouse. Attackers who had spent months inside the
networks, having entered through spear-phishing emails carrying BlackEnergy malware, had established remote
desktop sessions and were manually navigating the SCADA interfaces to open breakers at substations across
western and central Ukraine. Around 230,000 customers lost power for between one and six hours.

The technical sophistication of the attack was in the access and preparation, not the execution. The blackout
itself was caused by legitimate remote control commands issued through the utilities' own systems. The attackers
had learned the operators' procedures well enough to use them. After completing the blackout they deployed
KillDisk to overwrite the master boot records of operator workstations, delaying restoration, and launched a
telephone denial-of-service attack against customer service lines.

It remains the first confirmed cyberattack to have caused a civilian power outage, and the benchmark against
which subsequent grid attacks are measured.

## December 2016

On 17 December 2016, exactly one year after the first attack, the transmission substation at Pivnichna near
Kyiv lost power for approximately an hour. The cause was Industroyer, analysed publicly by ESET and Dragos in
2017 under the names Industroyer and CRASHOVERRIDE respectively.

Unlike 2015, which required the attackers to operate the SCADA system manually through a remote desktop
session, Industroyer contained dedicated modules that spoke industrial protocols directly: IEC 60870-5-101 for
serial connections, IEC 60870-5-104 for TCP connections, IEC 61850 MMS for substation automation, and OPC DA
for SCADA server communication. Each module could independently reach grid equipment and issue commands with
no further attacker interaction after launch.

```python
import struct

# What Industroyer's IEC 104 module automated across every targeted RTU simultaneously.
# Type 45 C_SC_NA_1: single command, Cause of Transmission = activation, targeting a breaker.
type_id = 45
vsq     = 0x01
cot     = struct.pack('<H', 0x0006)   # activation
ca      = struct.pack('<H', 1)        # Common Address of the RTU
ioa     = struct.pack('<I', 100)[:3]  # Information Object Address of the target breaker
cmd     = 0x01                        # EXECUTE + ON (0x00 for OFF/OPEN)

asdu = bytes([type_id, vsq]) + cot + ca + ioa + bytes([cmd])
# ASDU structure only; in use, wrapped in an APCI header and sent over an established IEC 104 session
```

The relay bypass component compounded the impact. Industroyer sent commands to open breakers and simultaneously
issued trip-prevention commands to protection relays, preventing automatic reclosure. Without that component,
the grid's reclosers would have restored supply within seconds or minutes. With it, restoration required manual
intervention at each affected substation.

Industroyer also included a configurable scheduling component that could be set to execute at a specified time
with no active attacker connection, a backdoor for persistent re-entry, and a self-overwrite component that
destroyed the malware after execution to impede forensic analysis. The 2016 attack is widely assessed as a
limited test rather than a maximum-impact operation: the affected substation was relatively small and power was
restored quickly.

## April 2022

In April 2022, two months into Russia's full-scale invasion of Ukraine, Sandworm deployed Industroyer2 against
a Ukrainian high-voltage transmission substation alongside CaddyWiper, a disk-wiping tool timed to execute
several hours after Industroyer2, intended to destroy forensic evidence and operator workstations after the
substation had been taken down.

Industroyer2 was a single executable rather than a modular framework, and it spoke only one protocol: IEC
60870-5-104. The IEC 104 configuration, every target IP address, every port number, every information object
address for every breaker and protection relay in scope, was written directly into the binary. There were no
configuration files to adjust, no target discovery phase, no modularity. The tool was built for this substation
and no other.

That specificity is the indicator of extensive prior reconnaissance. Industroyer in 2016 could be retargeted
by changing its configuration. Industroyer2 could not. An adversary who hardens a tool to a single target has
already mapped that target in detail.

Ukrainian CERT and security researchers identified the attack in the preparation phase before the payload
executed. The substation was not taken offline. It was the first major failure of the Sandworm grid attack
programme across seven years of operations.

## Related

- [IEC 60870-5-104](../protocols/iec60870-5-104.md): the protocol both Industroyer's TCP module and
  Industroyer2 used; the Type 45 ASDU command injection that opened the breakers
- [IEC 61850](../protocols/iec61850.md): Industroyer's second major protocol module; MMS for IED control
  and the relay bypass that prevented automatic reclosure
- [OPC DA](../protocols/opcda.md): Industroyer's fourth module; used to communicate with SCADA OPC servers
  at the boundary between the corporate and operational networks
- [SANS/E-ISAC 2015 analysis](https://nsarchive.gwu.edu/sites/default/files/documents/3891751/SANS-and-Electricity-Information-Sharing-and.pdf):
  definitive technical account of the December 2015 attack
- [ESET: Win32/Industroyer](https://web-assets.esetstatic.com/wls/2017/06/Win32_Industroyer.pdf):
  the original 2017 malware analysis covering the 2016 attack
- [Cisco: Industroyer2 and INCONTROLLER](https://blogs.cisco.com/industrial-iot/mitigating-new-industroyer2-and-incontroller-malware-targeting-industrial-control-systems):
  April 2022 technical analysis of Industroyer2 and the CaddyWiper pairing
- [Smart Grid SimLab](../labs/smart-grid-sim): nation-coordinated-blackout, nation-staged-industroyer, and
  nation-wiper scenarios model the 2015, 2016, and 2022 attack phases
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): multi-hop credential chains to the control
  layer; unauthenticated REST injection falsifying IEC-104 readings; relay IED writes in the control zone
- [OT Defence Workbench](../labs/workbench): brief 3 removes every direct path via DNAT proxy; brief 10
  applies network enforcement to IEC 104; brief 11 filters the trip command type at the boundary while
  leaving monitoring sessions intact; brief 12 moves the defence to the asset itself via IEC 62351-5
  authentication, the control the Sandworm sessions had no answer for
