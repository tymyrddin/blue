# Modbus

![Modbus message exchange](/_static/images/protocol-modbus.png)

Modbus is the one with almost nothing in it, and that absence is the whole character of the protocol. Every exchange is
a request the client sends and a response the server returns: a function code, an address, a count. The server never
speaks first and keeps no session state between requests, so there is nothing to log in to and nothing to tear down. An
exception response is just the request's function code handed back with the error bit set. For a threat model this is
the blunt case, since the protocol carries no identity, no sequence number and no integrity check, so anyone who can
reach the port and form a valid PDU can read or write a register. The defence is entirely per the network around it, 
which is why a Modbus segment tends to be the first thing worth drawing a boundary around.

## One of the oldest

Modbus was published in 1979 by Modicon as a serial communication protocol for PLCs. It is one of the oldest industrial
protocols still in widespread use, and one of the most exposed: Modbus TCP runs over standard Ethernet on port 502,
requires no authentication, provides no message integrity, and offers no encryption. Anyone who can reach port 502 can
read any register and write to any coil or holding register the device supports.

That is not a design flaw in the sense of something that was overlooked. It reflects the assumption under which the
protocol was built: the network was the control room, access was physical, and strangers did not reach the wire.

## The protocol structure

A Modbus TCP frame consists of a six-byte MBAP header followed by a Protocol Data Unit. The MBAP header carries a
Transaction Identifier (two bytes), a Protocol Identifier fixed at 0x0000 (two bytes), a Length field counting the
remaining bytes (two bytes), and a Unit Identifier identifying the slave device (one byte). The PDU carries a Function
Code (one byte) and data.

The Function Code is the most security-relevant field. Function code 03 reads holding registers, 06 writes a single
register, 16 writes multiple registers, and 05/15 read and write coils. Function code 08 provides diagnostic functions
including device reset subcodes. There is no mechanism in the base specification for a device to reject a request based
on who sent it.

The Unit Identifier was designed for Modbus serial gateways where a single TCP connection reaches multiple serial
devices. On a directly connected TCP device, the Unit Identifier is typically ignored or expected to be a fixed value. A
device that accepts any Unit Identifier can be confused into misdirecting frames intended for a different device on a
gateway.

## What port 502 offers without credentials

Finding Modbus devices on a segment takes seconds:

```bash
nmap -p 502 -sV --open 10.0.0.0/24
```

Once found, the entire register space is readable and writable with no credential. The pymodbus library makes
this concrete:

```python
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('10.0.0.20')
client.connect()

# Read holding registers — no authentication
result = client.read_holding_registers(address=0, count=125, slave=1)
print(result.registers)   # full register map in one round trip

# Write a setpoint — same access, no confirmation required
client.write_register(address=40, value=1500, slave=1)
```

The absence of message integrity means a man-in-the-middle on the network path can modify commands in transit.
A read response carrying sensor values can be altered to show normal operation while the physical process
deviates. A write command carrying a setpoint can be modified to deliver a different value to the PLC.

Reconnaissance is equally direct: function code 43 (Read Device Identification) returns vendor name, product
code, and firmware revision on devices that support it, before any write is attempted.

## Restricting access without touching the device

The set of IP addresses legitimately permitted to send Modbus commands to a given PLC is small and known: the
SCADA master or masters, and occasionally an engineering workstation during maintenance. Enforcing that
constraint at the network removes the largest attack class with no changes to the PLC:

```bash
# Permit Modbus only from the SCADA master; block everything else on port 502
iptables -I INPUT -p tcp --dport 502 -s 10.0.10.5/32 -j ACCEPT
iptables -A INPUT -p tcp --dport 502 -j DROP
```

An application-layer firewall that inspects Modbus traffic adds the ability to enforce function code and
register address restrictions. A device that is only ever read by the SCADA master can have write function
codes (06, 16, 05, 15) blocked entirely at the firewall. A device whose SCADA polling covers registers 100
to 200 can have traffic referencing other address ranges flagged or dropped. Products such as Claroty, Nozomi,
and open-source options like Zeek with Modbus protocol dissectors can inspect and log Modbus traffic at
this level.

Firewall rules enforcing these restrictions are most effective when derived from a documented Modbus data model
for each device: which registers exist, which are read-only, and which addresses the SCADA master legitimately
accesses. That documentation is worth maintaining independently of security policy because it is also required
for engineering and maintenance.

## Modbus Security

The Modbus Organisation published a Modbus Security specification in 2018 that wraps Modbus TCP in TLS, using port 802.
The specification provides authentication via client certificates and message confidentiality and integrity via TLS.

Deployment is rare. The specification requires both the client (SCADA master) and the device to support TLS, which means
retrofitting to existing equipment is not practical. It is relevant for new deployments where the device vendor supports
it, but most Modbus TCP deployments in production will continue to rely on network-level compensating controls for the
foreseeable future.

## Related

- [DNP3](dnp3.md): the comparable SCADA protocol for electric utilities; same no-auth design, richer object model
- [IEC 60870-5-104](iec60870-5-104.md): the European and global equivalent of DNP3; shares the same network-level
  compensating control logic
- [EtherNet/IP](ethernetip.md): CIP over Ethernet; same no-auth baseline, overlapping compensating controls
- [The Modbus Organization](https://modbus.org): publishes the Modbus specification, including the Modbus Security
  (TLS) extension
- [Shodan: port 502](https://www.shodan.io/search?query=port%3A502): current count of internet-exposed Modbus
  devices
