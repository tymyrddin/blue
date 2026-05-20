# FrostyGoop

The simplest thing that could work was sufficient. FrostyGoop read a JSON configuration file, opened Modbus TCP
connections to the listed IP addresses, and sent write commands to the specified registers. No exploit, no
vulnerability in the conventional sense, no lateral movement through an enterprise network. Port 502 was reachable,
no authentication was required, and the ENCO heating controllers responded correctly to every command they received.
The commands were wrong. Around 600 flat buildings in Lviv lost heating and hot water for approximately 48 hours
in January 2024, at outdoor temperatures around minus ten degrees Celsius. Dragos published their analysis in July 2024.

## January 2024, Lviv

Lvivteploenergo operates the district heating network serving residential buildings in Lviv, circulating hot water
through a network of substations to delivery points across the city. In January 2024 the network's ENCO controllers,
the devices that regulate flow and temperature at distribution substations, began behaving incorrectly. The malfunction
persisted long enough to leave around 600 flat buildings without heating and hot water for roughly two days.

The initial access vector into the operational network was not definitively established during the investigation.
Dragos noted that ENCO devices were directly accessible from the internet, which is the most straightforward
explanation for how the attacker reached them without first compromising a jump host or engineering workstation.

## The binary

FrostyGoop was a Golang binary. It parsed a JSON configuration file listing target IP addresses, port numbers, and
Modbus operations to perform, established TCP connections to each target, and issued the specified write commands.
The binary had no network propagation capability, no mechanism to establish persistence on the target device, and no
exploitation of any software vulnerability in the Modbus stack. It was a wrapper around standard Modbus TCP write
operations with a configurable target list.

Golang produces statically compiled binaries with no external runtime dependencies. That property simplifies
deployment on a target host where the software environment is unknown and may differ from the attacker's build
machine. The same characteristic has made Go popular for offensive tooling in other contexts.

Knowing the register addresses and expected values required prior knowledge of the ENCO device's register map:
either from public documentation, from earlier reconnaissance reads against the live devices, or from a test
environment running the same hardware.

```python
# FrostyGoop's operation stripped to its core
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('10.0.0.20')
client.connect()

# Write to the operational parameter register: no authentication, no confirmation required
client.write_register(address=0, value=0, slave=1)  # slave= is pymodbus v3; v2 used unit=

client.close()
```

The register address, value, and slave ID all come from the configuration file. Modbus TCP provides nothing else
to negotiate.

## What port 502 provided

The [Modbus](../protocols/modbus.md) protocol was designed in 1979 for isolated serial networks where physical
access controlled who could reach the wire. When it was adapted for TCP/IP in 1999, the access model carried
forward unchanged: no authentication, no integrity protection, no mechanism to verify that a write command came
from an authorised source. A device on port 502 treats a command from the legitimate SCADA master and a command
from an attacker with equal and uncritical compliance.

The ENCO controllers in Lviv were not misconfigured. They were operating as the specification provides for.
The specification offers no defence.

Shodan indexes tens of thousands of Modbus-enabled devices accessible from the public internet without a
firewall. The Lvivteploenergo devices were among them. That is not an unusual situation.

## What would have changed the outcome

A firewall rule restricting port 502 to the IP addresses of the legitimate SCADA master is the specific control
that would have blocked FrostyGoop's connections before they reached the controllers:

```bash
iptables -I INPUT -p tcp --dport 502 -s 10.0.10.5/32 -j ACCEPT
iptables -A INPUT -p tcp --dport 502 -j DROP
```

No modification to the controllers, no firmware update, no new hardware. The rule sits on the network, not on
the device.

Passive monitoring that baselined the normal write patterns to each controller, including which registers the SCADA
system legitimately wrote and their expected value ranges, would have flagged the FrostyGoop writes as anomalous
before the heating failed. The controllers were not silent throughout the attack. They responded to queries. A
passive decoder on the segment would have seen the writes as they arrived.

## Related

- [Modbus](../protocols/modbus.md): the protocol FrostyGoop used; port 502, no authentication, write access to any
  exposed register
- [Dragos: FrostyGoop](https://www.dragos.com/blog/protect-against-frostygoop-ics-malware-targeting-operational-technology):
  original public disclosure and technical analysis, July 2024
- [Shodan: port 502](https://www.shodan.io/search?query=port%3A502): current count of internet-exposed Modbus devices
- [Smart Grid SimLab](../labs/smart-grid-sim): the nation-frostygoop scenario models the Lviv heating network
  pattern; simultaneous Modbus register writes against both substations alongside a demand spike
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): unauthenticated Modbus control layer on the
  turbine PLC and relay IEDs; the same condition Lvivteploenergo exposed
- [OT Defence Workbench](../labs/workbench): briefs 1 and 6 built around FrostyGoop; transparent bridge
  baseline through to a function code filter that drops write commands regardless of source address
