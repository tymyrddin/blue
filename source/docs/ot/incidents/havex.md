# Havex

Dragonfly set out to understand what it was looking at. The Havex malware family's OPC DA component did not
send commands to field devices. It connected to OPC servers on the local network, enumerated all available
process tags, and sent the list home: a complete map of what industrial equipment was present, what variables
it exposed, and how they were addressed. No disruption occurred. The campaign ran for years before F-Secure
published their analysis in June 2014. The threat was the map, not the payload.

## 2011–2014, energy sector

Dragonfly, also known as Energetic Bear, is a Russian-linked APT group assessed to have targeted energy
companies and ICS vendors in the United States and Europe from roughly 2011. The campaign known as Havex,
named after the malware family F-Secure analysed, reached peak activity between 2013 and 2014. Symantec
counted over 2,000 victims across more than 80 countries, with the energy sector and ICS vendor supply
chains accounting for a significant proportion.

Three infection vectors delivered the backdoor. Spear phishing emails directed recipients to documents that
dropped the payload. Watering hole attacks placed malware on websites frequented by personnel at energy
companies, catching users who visited without any targeted email. The third vector was specific to ICS
environments: the attackers identified ICS software vendors with insecure distribution infrastructure,
compromised those vendors' download servers, and inserted the Havex dropper into legitimate software
installation packages. Users who downloaded vendor software to configure their equipment installed the
backdoor alongside it.

## The OPC DA component

[OPC DA](../protocols/opcda.md) (Data Access) is the original OPC specification for reading and writing
process variable values in real time. It uses Microsoft's DCOM protocol: TCP port 135 for the endpoint
mapper, followed by dynamically allocated high ports for the data channel. OPC DA servers run on Windows
and expose a tag hierarchy: named variables corresponding to physical measurements, setpoints, and device
states in the connected process.

The Havex OPC DA module enumerated every OPC server it could reach on the local network. For each server
it connected to, it retrieved the server's identity information, the complete tag hierarchy with all groups
and items, and the current value and quality of each tag. That inventory exfiltrated to Dragonfly's
command-and-control infrastructure hosted on compromised legitimate websites.

An OPC tag hierarchy from a working SCADA deployment is not abstract data. Each tag name carries
operational meaning: a flow rate for a specific line, a valve position for a specific actuator, a
temperature at a specific exchanger. Knowing the tag structure is knowing what the process does and how
it is controlled. The reconnaissance value is equivalent to a complete set of engineering drawings.

```python
# OPC DA enumeration at the library level
import win32com.client

# OPCEnum is the Windows-wide OPC server discovery service
opc_enum = win32com.client.Dispatch("OpcEnum.OPCEnum.1")
servers = opc_enum.GetOPCServers(host_name)

for prog_id in servers:
    server = win32com.client.Dispatch(prog_id)
    # AddGroup / GetItemProperties / Read: full tag walk from here
    # Havex automated this across every reachable host
```

The module read. It did not write values or issue commands. The danger was in what the collected information
enabled, not in what the module itself did.

## What the vectors shared

All three delivery mechanisms exploited a common condition: a host inside the ICS network running Windows
software that connected outward to the internet. Engineering workstations with unrestricted outbound access
are the normal case in many OT environments; the workstation needs to download software, check vendor
documentation, or access corporate resources.

Once established, the Havex backdoor communicated over HTTP/S to C2 infrastructure on compromised third-party
websites. The traffic pattern was indistinguishable from normal web browsing. In environments where
engineering workstations had unrestricted outbound access, no network control was positioned to intercept it.

## What would have changed the outcome

Restricting outbound internet access from engineering workstations is the control that interrupts C2
communication regardless of which delivery vector established the implant. A workstation that cannot
initiate connections to arbitrary internet addresses cannot exfiltrate to a command server on a compromised
third-party site.

OPC DA's DCOM traffic is identifiable on the network: TCP port 135 connections followed by high-port RPC
sessions to new hosts. A passive monitor baselining which hosts legitimately queried OPC servers would have
flagged novel connections from an engineering workstation shortly after a software update.

Software distribution integrity was the entry point for the trojanised installer vector. A cryptographic
hash or signature check on ICS vendor packages against a known-good baseline would have detected the
modification before installation. Software supply chain integrity verification is now a standard
recommendation in ICS security guidance; at the time of the Havex campaign it was not common practice.

## Related

- [OPC DA](../protocols/opcda.md): the protocol the Havex OPC component used for tag enumeration
- [OPC UA](../protocols/opcua.md): the successor specification with authentication built in; widespread OT
  adoption came after the Havex campaign
- [Zone architecture](../architecture/zones.md): engineering workstations with unrestricted internet access
  implicitly span zone boundaries
- [Defence in depth](../architecture/defence-in-depth.md): outbound access control as a layer independent
  of which delivery vector established the implant

