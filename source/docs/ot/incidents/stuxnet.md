# Stuxnet

Between 2007 and 2010, engineers at the Natanz uranium enrichment facility in Iran replaced damaged centrifuges
at a higher rate than expected and attributed the failures to materials and equipment quality problems. Stuxnet
was the explanation. Discovered in June 2010 by a Belarusian security researcher examining an apparently routine
Windows crash, the malware had been inside Natanz networks for years, cycling centrifuges to damaging speeds
while SCADA screens showed normal readings. It carried four zero-day Windows vulnerabilities, checked for an
exact PLC model and frequency drive configuration before executing any payload, and used stolen digital
signatures from semiconductor manufacturers to pass driver verification. Attributed to a joint US-Israeli
operation codenamed Olympic Games, it is the first known case of software causing sustained physical destruction
of industrial equipment. Nothing before it had done all of this at once.

## 2007 to 2010

The malware spread through USB drives and Windows network shares using four zero-day vulnerabilities, among
them the LNK shortcut exploit that executed code when a drive was browsed in Windows Explorer. Stolen
certificates from Realtek and JMicron signed its drivers; standard endpoint tools had no reason to flag them.
It passed through an estimated 100,000 Windows machines across multiple countries without producing any visible
effect. The payload only activated on systems running Siemens Step 7 software connected to the right hardware.

Symantec's subsequent analysis traced the infection chain and reconstructed the PLC payload. Ralph Langner's
independent analysis identified the centrifuge manipulation logic. The picture that emerged took months to
assemble; the full attribution to the US and Israel came through investigative reporting in 2012.

## The 33-machine check

Before altering anything, Stuxnet ran through a set of conditions. Was the PLC a Siemens S7-315 or S7-417?
Were the connected frequency converter drives manufactured by Fararo Paya in Iran or Vacon in Finland? Were
there exactly 33 drives? If any condition failed, the malware did nothing and moved on.

That specificity required prior knowledge of the exact equipment configuration at Natanz. It also meant the
payload was inert on any other industrial system running Siemens PLCs, regardless of how widely the infection
spread. Stuxnet infected systems across Iran, India, Indonesia, and elsewhere; only Natanz had the profile
that matched.

```bash
# S7comm runs over ISO-TSAP on port 102; Stuxnet required Step 7 and the specific S7-315/417 to trigger.
# Enumerating reachable Siemens PLCs shows which systems share the protocol surface that Stuxnet used.
nmap -p 102 --script s7-info --open 10.0.0.0/24
```

Where the checks passed, Stuxnet modified OB35, the cyclic interrupt handler in the PLC, inserting routines
that drove centrifuges to around 1,410 hertz for bursts of roughly 15 minutes, then dropped them to near
2 hertz. Normal operating frequency was 1,064 hertz. The centrifuges experienced mechanical stress that
produced no visible anomaly on any monitoring screen.

## The readings the operators saw

Stuxnet hooked into the Siemens Step 7 OPC DA library at the software layer, intercepting read operations
from the SCADA system and returning previously captured baseline values. Queries asking for centrifuge speed
received the normal operating figure. The gap between the data and the physical process was invisible to anyone
reading the dashboard.

```python
# The monitoring gap: OPC reads return what the PLC chooses to report.
# A PLC executing attacker-supplied code returns whatever value the attacker specifies.
from opcua import Client   # pip install opcua; deprecated in favour of asyncua but still functional
                           # OPC UA shown here; Stuxnet targeted the older COM-based OPC DA layer in Step 7

client = Client("opc.tcp://10.0.0.1:4840/")
client.connect()

node = client.get_node("ns=2;s=CentrifugeSpeed_Hz")
reported = node.get_value()   # 1064 Hz: normal, apparently stable
# physical centrifuge: cycling between 2 Hz and 1410 Hz, accumulating mechanical damage
```

The implication is architectural rather than procedural: SCADA telemetry is only as trustworthy as the
controller providing it. Physical instrumentation on an independent data path, one the PLC cannot intercept,
is the only layer that does not share this weakness.

## Related

- [OPC DA](../protocols/opcda.md): the COM-based OPC layer Stuxnet intercepted in Step 7 to return spoofed
  sensor readings; the monitoring bypass technique the payload relied on
- [TRITON](triton.md): the 2017 SIS targeting operation using the same verify-before-execute pattern and
  the same physical destruction objective through a different route
- [Ukraine grid attacks](ukraine-grid.md): Industroyer extended the Stuxnet-era methodology to grid
  infrastructure with protocol-native modules rather than PLC firmware manipulation
- [Kim Zetter: Countdown to Zero Day](https://www.wired.com/2014/11/countdown-to-zero-day-stuxnet/):
  Wired's account of the Stuxnet operation covering discovery, technical reconstruction, and attribution
- [Smart Grid SimLab](../labs/smart-grid-sim): nation-stuxnet scenarios model accumulated thermal stress on
  one or both substations while the monitoring layer reports normal readings
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): turbine PLC trip paired with historian
  ingest poisoning; the gap between physical state and displayed state
