# IT/OT boundary and historian access hunting

Two hunts for the dominant IT-to-OT attack path: new sources reaching OT protocol
ports across the boundary, and unexpected behaviour on the historian server that
signals its use as a pivot point. Both represent the earliest detection opportunity
for an attacker who has crossed from the corporate network into the OT environment.

The historian is the natural pivot point. Its IT-facing side accepts connections from
reporting interfaces, web APIs, and business intelligence tools; its OT-facing side
maintains persistent collector sessions to field devices and SCADA servers. An attacker
who reaches the historian via any IT-side vulnerability inherits those connections.
Detecting the crossing is easier at the network layer, before the attacker has reached
an OT device.

Data sources: Zeek `conn.log` from a sensor at or behind the IT/OT boundary; Sysmon
Event 3 (NetworkConnect) on the historian server; Windows Security Event ID 4688
(process creation with command line) on historian servers and OT-adjacent engineering
workstations, with process creation auditing and command-line logging enabled.

## New sources accessing OT protocol ports at the boundary

Hypothesis: a host on the IT network that has not previously appeared in traffic to
OT protocol ports is attempting to reach the OT side. Legitimate sources for OT
protocol traffic are few and documented; everything else is worth investigating.

Data source: Zeek `conn.log` from a sensor positioned to see traffic crossing the
IT/OT boundary or passing through the DMZ.

```bash
# distinct source IPs reaching OT protocol ports across the boundary
OT_PORTS="502|20000|4840|2404|102|44818|1502|47808"
zeek-cut ts id.orig_h id.resp_h id.resp_p < conn.log | \
  awk -v re="$OT_PORTS" '!/^#/ && $4 ~ re {print $2, $3, $4}' | \
  sort | uniq -c | sort -rn | head -30

# new sources in the current window relative to a prior baseline
# (same pattern as the protocol hunt: comm -13 on sorted source lists)
KNOWN_SOURCES="10.0.10.5 10.0.10.6 192.168.1.20"  # SCADA masters, historian
zeek-cut id.orig_h id.resp_p < conn.log | \
  awk -v re="$OT_PORTS" -v known="$KNOWN_SOURCES" '
  BEGIN { n = split(known, k, " "); for (i = 1; i <= n; i++) ok[k[i]] = 1 }
  !/^#/ && $2 ~ re && !ok[$1] { print $1, $2 }
  ' | sort | uniq -c | sort -rn | head -20
```

The approved source list for each OT protocol port is typically two to five addresses:
the SCADA master or masters, the historian's collector interfaces, and an engineering
jump host. Access from a workstation IP, a server with no documented OT role, or any
address outside the OT management subnet warrants a same-day review.

## Unexpected processes on the historian with OT-segment connections

Hypothesis: an attacker who has obtained access to the historian via its IT-facing
interface is using it as a pivot. The historian's normal state is a small set of known
collector processes maintaining connections to OT devices; any other process
establishing OT-segment connections is anomalous.

Data source: Sysmon Event 3 (NetworkConnect) on the historian server.

```powershell
$startTime = (Get-Date).AddDays(-7)
# OT subnet prefixes: adjust for the environment
$otSubnets  = @('192.168.100.', '10.20.')

Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 3
    StartTime = $startTime
} | ForEach-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data

    $dest = ($data | Where-Object Name -eq 'DestinationIp').'#text'
    $proc = ($data | Where-Object Name -eq 'Image').'#text'
    $port = ($data | Where-Object Name -eq 'DestinationPort').'#text'

    $inOT = $otSubnets | Where-Object { $dest -like "$_*" }
    if ($inOT) {
        [PSCustomObject]@{
            Time     = $_.TimeCreated
            Process  = $proc
            DestIP   = $dest
            DestPort = $port
        }
    }
} |
    Where-Object {
        # known-good collector processes; extend with the installed product names
        # OSIsoft PI: piarchss.exe, pibufss.exe, piupdmgr.exe
        # AVEVA: match on 'aveva', 'wonderware'
        # GE Proficy: proficy
        $_.Process -notmatch 'piarchss|pibufss|piupdmgr|aveva|wonderware|proficy|honeywell'
    } | Sort-Object Time
```

The exclusion pattern covers common historian platforms. Any process not in the
known-good list making connections into the OT segment warrants investigation. A
general-purpose tool (cmd.exe, powershell.exe, python.exe) establishing connections
to OT protocol ports from the historian server is the pivot pattern. Volt Typhoon
used `wmic /node:` for remote execution from compromised IT hosts in OT-adjacent
networks; a similar pattern on the historian appears here as a non-collector process
opening new OT connections.

## Engineering software connections from unexpected hosts

Hypothesis: an attacker is using engineering software protocol ports to modify PLC or
SIS configuration, or is connecting from a host outside the approved engineering
workstation list. All three of the most common engineering protocols carry no
authentication at the network layer.

Engineering connections use specific ports: Siemens S7comm on port 102, Rockwell
EtherNet/IP on port 44818, and the Triconex TriStation protocol on port 1502. Any
source not in the approved engineering workstation list reaching these ports is
anomalous. TriStation is the most sensitive: the TRITON attack used a host that had
been compromised earlier in the kill chain to open TriStation sessions to Triconex SIS
controllers outside any documented change window.

Data source: Event ID 4688 on the historian server and OT jump host (requires process
creation auditing enabled and command-line auditing configured); Zeek `conn.log` for
network-layer confirmation.

```powershell
# enable process creation auditing and command-line logging if not already active:
# auditpol /set /subcategory:"Process Creation" /success:enable
# reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v ProcessCreationIncludeCmdLine_Enabled /t REG_DWORD /d 1

$startTime = (Get-Date).AddDays(-7)
# patterns matching known engineering software executables
$engPatterns = 'TIA Portal|Simatic|S7ProSim|Studio 5000|RSLogix|FactoryTalk|TriStation|Step7'

Get-WinEvent -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4688
    StartTime = $startTime
} | ForEach-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data

    $proc = ($data | Where-Object Name -eq 'NewProcessName').'#text'
    $cmdl = ($data | Where-Object Name -eq 'CommandLine').'#text'
    $user = ($data | Where-Object Name -eq 'SubjectUserName').'#text'

    if ($proc -imatch $engPatterns -or $cmdl -imatch $engPatterns) {
        [PSCustomObject]@{
            Time    = $_.TimeCreated
            Process = $proc
            CmdLine = $cmdl
            User    = $user
        }
    }
} | Sort-Object Time
```

```bash
# network-layer: connections to engineering ports from unexpected sources
ENGINEERING_PORTS="102|44818|1502"
APPROVED_ENG="10.0.50.10 10.0.50.11"  # approved engineering workstation IPs

zeek-cut ts id.orig_h id.resp_h id.resp_p < conn.log | \
  awk -v re="$ENGINEERING_PORTS" -v ok="$APPROVED_ENG" '
  BEGIN { n = split(ok, a, " "); for (i = 1; i <= n; i++) approved[a[i]] = 1 }
  !/^#/ && $4 ~ re && !approved[$2] { print $1, $2, $3, $4 }
  ' | sort | uniq -c | sort -rn | head -20
```

A TriStation session on port 1502 from any host other than the named engineering
workstations used for Triconex programming is high priority regardless of the time of
day. The TRITON operators spent around a year inside the target network before deploying
their payload; the TriStation sessions they opened from a compromised OT host would have
appeared exactly as this query describes.
Last updated: 27 May 2026
