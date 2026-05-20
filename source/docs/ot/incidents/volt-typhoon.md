# Volt Typhoon

Volt Typhoon's defining characteristic is what it did not use. No custom malware, no novel protocol exploit, no
zero-day. The group used the tools already installed on compromised hosts, the accounts already provisioned in
the target environments, and the administrative traffic patterns already normal on those networks. The result was
years of undetected access inside critical infrastructure organisations across the United States. Microsoft and
CISA disclosed the activity in May 2023. The disclosed assessment described it not as espionage but as
pre-positioning: access held in reserve for potential destructive action during a geopolitical crisis. The
technique that made it hard to find is the same technique that makes it a planning problem and not just a
detection one.

## May 2023, US critical infrastructure

Microsoft, CISA, the NSA, the FBI, and the Five Eyes intelligence alliance jointly disclosed in May 2023 that a
Chinese state-sponsored group had maintained persistent access inside critical infrastructure networks across the
United States and Guam, spanning electric utilities, water systems, communications networks, and transport
infrastructure. The group had been active in some of these networks for at least five years without being
identified.

Guam carries strategic significance as a major US military hub in the western Pacific. The disclosed assessment
was explicit that the targeting pattern was consistent with pre-positioning for a crisis scenario rather than
conventional intelligence collection. The concern was not what the group had already done. It was what the
access made possible.

## Living off the land

Volt Typhoon used Windows built-in utilities for virtually every phase of its operations after initial access:
`wmic` for process enumeration and remote execution across the network, `netsh` for port proxying and network
configuration, `ntdsutil` for credential material, `net` and `net group` for account and domain reconnaissance.
These tools are present on every Windows installation, run by administrators routinely, and unlikely to trigger
endpoint detection rules designed to identify known malicious software.

```
REM Representative Volt Typhoon reconnaissance on a compromised host.
REM All of these use tools present in every Windows installation.

net group "Domain Computers" /domain
wmic /node:"10.0.1.5" process list brief
netsh interface portproxy show all
```

The group also used a botnet of compromised SOHO routers as proxy infrastructure. Traffic from the attacker's
actual infrastructure reached targets appearing to originate from ordinary network addresses in the region,
complicating network-based attribution and blocking. In January 2024, the US Department of Justice disrupted
this router botnet, but the underlying technique of proxying through legitimate infrastructure remains viable
with any sufficiently large set of compromised devices.

## Pre-positioning, not espionage

The distinction matters operationally. An espionage campaign collects and exfiltrates; it has a continuous
signal of outbound data. Pre-positioning for disruption looks different: access is maintained, the environment
is understood, and nothing visibly happens until the moment of activation. An attacker who has had access to an
electric utility or water system network for five years has had time to understand operational procedures,
identify which systems control what, map the dependencies between devices, and prepare specific actions for a
chosen moment. The harm is not in the access period. The access is the preparation.

The sectors targeted, electric generation and distribution, water, communications, transport, correspond to the
infrastructure categories whose simultaneous disruption would have the largest civilian and military impact in
a conflict scenario. The Guam focus in particular aligns with denial-of-deployment rather than intelligence
value.

## The detection gap

Signature-based detection does not flag wmic or netsh as malicious, because they are not malicious tools.
Identifying Volt Typhoon activity required behavioural analysis: looking for unusual combinations of legitimate
tools, for account activity at unexpected times or from unexpected source addresses, or for administrative
actions taken from accounts with no history of performing them.

```powershell
# Hunt for wmic lateral movement: process creation with /node: arguments
# Requires process creation auditing enabled (not on by default)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} |
    Where-Object { $_.Message -match 'wmic' -and $_.Message -match '/node:' } |
    Select-Object TimeCreated, Message
```

Windows Event ID 4688 logs process creation with command-line arguments when process auditing is enabled, a
setting that is off by default. A network where it is not enabled has no log record of what processes ran, with
what arguments, or in response to what. Many OT-adjacent Windows environments in the affected sectors had not
enabled it. Volt Typhoon left minimal forensic trace in part because the forensic record had not been configured
to capture it.

## The IT/OT boundary

Volt Typhoon's disclosed initial access was into IT networks. The concern about OT impact was not that the group
had already reached control systems: it was that an attacker with years of IT access, thorough knowledge of an
organisation's network architecture, and a prepared operational objective could use that position to cross into
OT systems at the chosen moment.

The [IT/OT boundary](../architecture/boundary.md) is the architectural control that determines whether an IT
compromise can translate into OT access. A properly segmented environment, one where the OT network has no
routed path from the IT network, where jump hosts for OT access are controlled and logged, and where OT accounts
are distinct from IT accounts, limits what an attacker with an IT foothold can reach.

The advisory noted that some compromised organisations had direct connectivity between their IT and OT
environments, and that Volt Typhoon had in some cases already reached across. [Remote access
architecture](../architecture/remote-access.md) is the second control: if the IT/OT boundary is crossed through
a legitimate remote access path, the attacker inherits whatever the remote access account is permitted to reach.

## Related

- [IT/OT boundary](../architecture/boundary.md): the segmentation control that determines whether IT compromise
  reaches OT; the primary structural defence the Volt Typhoon access path tests
- [Remote access](../architecture/remote-access.md): the mechanisms through which OT pivot would occur; jump
  host and account controls are the relevant layer
- [CISA advisory AA23-144A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-144a): original
  joint advisory with indicators of compromise and detection guidance, May 2023
- [Microsoft disclosure](https://www.microsoft.com/en-us/security/blog/2023/05/24/volt-typhoon-targets-us-critical-infrastructure-with-living-off-the-land-techniques/):
  initial public disclosure with technical detail on TTPs and affected sectors
- [Smart Grid SimLab](../labs/smart-grid-sim): nation-volt-typhoon compresses maintained access into 120
  seconds of dwell; replay and spoofing before cascading failure and wiper attacks
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): persistent southbound channel to the turbine
  PLC; telemetry flowing without further attacker presence on the inner network
- [OT Defence Workbench](../labs/workbench): brief 7 restricts Modbus write function codes to a single
  authorised source; limits what pre-positioned OT segment access can accomplish
