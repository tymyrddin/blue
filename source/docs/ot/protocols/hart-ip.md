# HART-IP

![HART IP message exchange](/_static/images/protocol-hart.png)

HART began as a digital signal riding the 4 to 20 mA current loop, and HART-IP carries the same command set over TCP and
UDP, normally to a gateway that fronts a set of wired or wireless HART field devices. It is master and slave with
numbered commands: Command 0 returns the device's identity, Command 3 returns the dynamic variables, the primary value
and its companions. Burst mode is the device configured to push readings on a fixed period rather than wait to be
polled, the same poll-versus-push split seen across the set. HART-IP does open a session, and the more recent revisions
of the specification add stronger protection, but a good number of fielded gateways are reachable with little beyond
that session, so they tend to be treated as something to keep behind a boundary.

## HART is pervasive

HART (Highway Addressable Remote Transducer) was developed by Rosemount in the 1980s and became an open standard
maintained by the FieldComm Group. It runs over the same two-wire 4-20mA loops that carry analogue process
measurements: a frequency-shift keyed digital signal superimposed on the analogue current. The result is that a
pressure transmitter or temperature sensor connected by a standard instrument loop can also answer digital queries
about its configuration, calibration state, diagnostics, and secondary variables, without requiring separate wiring.

HART is pervasive in process industries: oil and gas, chemicals, pharmaceuticals, power generation. A large refinery
or chemical plant may have thousands of HART-capable field instruments. Most are accessed only occasionally, during
commissioning, calibration rounds, or fault investigations, using a handheld communicator or an asset management
workstation connected to the same loop.

HART-IP (Part 7 of the HART Communication Protocol specification) carries HART protocol packets over UDP or TCP on
port 5094. It was designed to allow asset management software to reach HART instruments through IO systems and
gateways without requiring a physical loop connection. A HART-IP gateway bridges between the IP network and the
HART instrument population it serves.

## Sessions and the command set

A HART-IP session opens with an InitiateSession exchange: client sends session type and inactivity timeout,
gateway confirms, commands flow. No credentials are required in the base specification. Finding gateways on a
plant LAN segment takes one line:

```bash
nmap -p 5094 -sV --open 10.0.0.0/24
```

Service version detection usually returns the gateway model and firmware revision alongside the open port.

HART commands divide into three categories. Universal commands run on every HART device: Command 0 returns the
manufacturer ID, device type, and unique identifier; Commands 1 to 3 return process variables and loop current;
Command 13 reads the tag, descriptor, and installation date. Common Practice commands reach further: Command 35
writes range values, Command 40 enters Fixed Current Mode, Command 42 issues a master reset, Commands 44 and 45
trim the sensor zero and span. Device-specific commands vary by manufacturer.

The read/write line is where the risk sits. Universal reads map the instrument population and current process
state. Common Practice writes change how instruments behave, and those changes persist.

## Command 40 and what it does to the loop

Command 0 reconnaissance across the gateway's instrument range returns vendor, model, tag, and firmware for
every instrument behind it. No prior knowledge of the installation is needed.

Command 40, Fixed Current Mode, is the one worth understanding in detail. It overrides the instrument's
measurement and forces the 4-20mA analogue output to a caller-supplied value expressed as an IEEE 754
single-precision float in milliamps:

```python
import struct

# Command 40 data payload: target current in mA, big-endian IEEE 754 float
# The PLC/DCS reads this value as if it were the real process measurement
fixed_4mA  = struct.pack('>f',  4.0)   # b'\x40\x80\x00\x00' — reads as 0% of range
fixed_12mA = struct.pack('>f', 12.0)   # b'\x41\x40\x00\x00' — reads as 50% of range
fixed_20mA = struct.pack('>f', 20.0)   # b'\x41\xa0\x00\x00' — reads as 100% of range
```

With this payload sent over an open session, the PLC or DCS reading that analogue input sees a stable, plausible
value regardless of what the process is doing. The instrument reports no fault. Its diagnostic registers show
normal operation. The DCS alarm system sees a value within range. The deviation between measured and reported
state is invisible until a calibration check or physical inspection.

Commands 44 and 45 apply a subtler version of the same effect: a zero or span trim that shifts the measurement
by a configured offset. A 3% shift on a pressure transmitter feeding a level calculation or a flow controller
is within normal calibration scatter and unlikely to trigger an alarm. Command 42 reboots the device; on an
instrument tied to a safety interlock, the signal loss during restart triggers the interlock's configured
fail-safe action.

## WirelessHART at the edge

WirelessHART (IEC 62591) runs HART over an 802.15.4 mesh radio network. Field instruments with WirelessHART
adapters connect through the mesh to a gateway that bridges to the plant IP network and exposes a HART-IP
interface on the IP side. The gateway is often the sole IP-connected device in its instrument segment, positioned
at the network edge as the convergence point for the mesh.

Gateways installed with direct internet connectivity, or connected to corporate IT without adequate segmentation,
appear in Shodan results for port 5094. The combination of a compact device, remote installation location, and
the assumption that field instrumentation falls below the security attention threshold for PLCs and SCADA servers
has produced a category of internet-reachable HART-IP gateways serving live instruments in operating facilities.

Access through a WirelessHART gateway also reaches the wireless network manager, which governs mesh membership
and routing. Manipulation there can determine which instruments participate in the mesh and how their data flows.

## Closing the exposure

Port restriction is the most direct control. Most HART-IP gateways run embedded Linux; the rule is
straightforward to apply either on the gateway itself or on the upstream network firewall:

```bash
# Permit only the asset management server; block all other access to port 5094
iptables -I INPUT -p tcp --dport 5094 -s 10.0.50.10/32 -j ACCEPT
iptables -I INPUT -p udp --dport 5094 -s 10.0.50.10/32 -j ACCEPT
iptables -A INPUT -p tcp --dport 5094 -j DROP
iptables -A INPUT -p udp --dport 5094 -j DROP
```

HART-IP v2 adds optional session authentication with a pre-shared key. Where gateway firmware supports it,
enabling authenticated sessions closes the unauthenticated initiation path entirely. The key management overhead
is modest: one key per gateway, configured at commissioning and rotated on a defined schedule.

Monitoring for unexpected sessions and for write command types catches active exploitation without requiring
authentication to be in place first. Command 40 activity from any source outside the asset management server is
the alert worth raising immediately; Commands 44, 45, and 42 from unexpected sources are the next tier.
Forwarding gateway session logs to a security monitoring function provides the visibility; most asset management
platforms produce those logs and simply do not forward them anywhere.

Periodic calibration verification against documented as-commissioned values detects persistent configuration
changes that produce no runtime alarm. On instruments feeding safety interlocks or custody transfer
measurements, the case for a tighter audit interval is concrete: a silent trim that shifts a measurement
by 2-3% is exactly what the calibration check will catch and the DCS alarm will not.

## Related

- [Modbus](modbus.md): the comparable field-level read/write protocol for PLCs; similar compensating controls
- [BACnet](bacnet.md): building automation with the same internet exposure problem and the same absence of
  default authentication
- [IEC 62351](iec62351.md): the power system security standard series; HART-IP v2 key management follows
  a similar pre-shared key model to Parts 5 and 6, which authenticate IEC 60870-5 commands and IEC 61850
  GOOSE frames respectively using shared symmetric keys
- [FieldComm Group](https://fieldcommgroup.org): publishes the HART Communication Protocol specifications,
  including the HART-IP (Part 7) and WirelessHART (Part 8) specifications
- [Shodan: port 5094](https://www.shodan.io/search?query=port%3A5094): live count of internet-reachable
  HART-IP gateways; useful for scope-setting before an engagement or asset inventory exercise
