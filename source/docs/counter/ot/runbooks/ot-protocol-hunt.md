# OT protocol anomaly hunting

Two hunts for attacker activity in OT network traffic: unexpected sources issuing
write or control commands to field devices, and reconnaissance via device identification
queries. Both rely on passive monitoring. Active interrogation carries real risk of
disrupting control devices and is not used here.

Data source: Zeek running on a network tap or span port on the OT segment. The Modbus
dissector is included in standard Zeek and produces `modbus.log`. DNP3 requires the
ICSNPP package (`zkg install zeek/icsnpp-dnp3`). Commercial OT monitoring platforms
(Dragos, Claroty, Nozomi) provide equivalent visibility through their own query
interfaces.

A baseline is the precondition for both hunts. An OT segment without a prior inventory
of normal sources, function codes, and communication pairs cannot distinguish anomalous
commands from legitimate polling. Passive monitoring builds this baseline over time;
weeks of observation on a new segment is not unusual before alert thresholds become
reliable.

## Modbus write commands from unexpected sources

Hypothesis: a source that is not the legitimate SCADA master is issuing write commands
to Modbus field devices. The set of legitimate Modbus masters is small and fixed: SCADA
polling comes from known addresses on a predictable schedule. Any other source sending
write function codes is anomalous.

Data source: Zeek `modbus.log`.

```bash
# write function codes in modbus.log, grouped by source and destination
# write FCs: WRITE_SINGLE_COIL, WRITE_SINGLE_REGISTER,
#             WRITE_MULTIPLE_COILS, WRITE_MULTIPLE_REGISTERS
zeek-cut id.orig_h id.resp_h func < modbus.log | \
  awk '!/^#/ && $3 ~ /WRITE/' | \
  sort | uniq -c | sort -rn | head -30

# sources not in the known master list
# populate KNOWN_MASTERS with the SCADA master IP(s) for this segment
KNOWN_MASTERS="10.0.10.5 10.0.10.6"
zeek-cut id.orig_h id.resp_h func < modbus.log | \
  awk -v masters="$KNOWN_MASTERS" '
  BEGIN { n = split(masters, m, " "); for (i = 1; i <= n; i++) ok[m[i]] = 1 }
  !/^#/ && !ok[$1]
  ' | sort | uniq -c | sort -rn | head -20
```

In a stable OT environment, the set of Modbus sources does not change between
surveys. A write from a new source has no legitimate explanation outside a
documented change. Exception responses in the same modbus.log session, where the
device rejected the request, indicate the target responded but the source may have
already retrieved the register map through earlier reads.

## Modbus device identification and register reconnaissance

Hypothesis: an attacker is probing field devices to enumerate types and firmware
versions before targeting specific registers. Function code 43 (Read Device
Identification) returns vendor name, product code, and firmware revision without
touching any process value.

```bash
# FC 43 READ_DEVICE_IDENTIFICATION queries
zeek-cut ts id.orig_h id.resp_h func < modbus.log | \
  awk '!/^#/ && ($4 ~ /DEVICE_IDENTIFICATION/ || $4 == "43")' | \
  sort | uniq -c | sort -rn

# broad register read sweep from a single source
# legitimate SCADA polling reads a fixed set of addresses at regular intervals;
# a sweep across hundreds of distinct addresses is a different pattern
zeek-cut id.orig_h func < modbus.log | \
  awk '!/^#/ && $2 ~ /READ_HOLDING_REGISTERS/ {count[$1]++}
  END {for (src in count) if (count[src] > 200) print count[src], src}' | \
  sort -rn | head -20
```

Reconnaissance precedes exploitation. An engineering workstation or unrecognised IP
issuing many holding-register reads across a device, rather than the fixed addresses
the SCADA master polls, is mapping the address space to locate writable setpoints or
safety thresholds. The FrostyGoop attack against Ukrainian heating infrastructure
used Modbus writes to ENCO controller registers; reconnaissance of the same type
would have appeared as this pattern.

## DNP3 control commands from non-master sources

Hypothesis: a source other than the legitimate DNP3 master is issuing control commands
to outstations. DNP3 DIRECT OPERATE (function code 5) actuates physical outputs without
the two-step SELECT/OPERATE sequence on devices that permit it. Without DNP3 Secure
Authentication v5, the outstation cannot distinguish the legitimate master from any other
device that can form a valid DNP3 frame.

Data source: Zeek `dnp3.log` (requires `zkg install zeek/icsnpp-dnp3`).

```bash
# DIRECT_OPERATE requests: which sources are sending them?
zeek-cut id.orig_h id.resp_h fc_request < dnp3.log | \
  awk '!/^#/ && $3 ~ /DIRECT_OPERATE/' | \
  sort | uniq -c | sort -rn | head -20

# any DNP3 traffic from sources outside the known master list
KNOWN_MASTERS="10.0.10.5"
zeek-cut id.orig_h id.resp_h fc_request < dnp3.log | \
  awk -v masters="$KNOWN_MASTERS" '
  BEGIN { n = split(masters, m, " "); for (i = 1; i <= n; i++) ok[m[i]] = 1 }
  !/^#/ && !ok[$1] { print }
  ' | sort | uniq -c | sort -rn | head -20

# ENABLE_UNSOLICITED from an unexpected source redirects outstation telemetry
# to an attacker-controlled address; the SCADA master's display goes stale
# while the attacker receives live process data
zeek-cut ts id.orig_h id.resp_h fc_request < dnp3.log | \
  awk '!/^#/ && $4 ~ /ENABLE_UNSOLICITED/' | \
  sort | uniq -c
```

ENABLE UNSOLICITED RESPONSES from a new source is a reconnaissance and
situational-awareness step that often precedes a control action. The Sandworm IEC 104
sessions that preceded the 2015 and 2016 Ukrainian grid events involved months of
prior access to understand the target topology before commands were issued; the DNP3
equivalent produces the same pattern.

## New devices on OT protocol ports

Hypothesis: a device not previously present on the OT segment is communicating on OT
protocol ports. A new IP address in OT protocol traffic represents a change: either a
documented installation or an unauthorised device.

Data source: Zeek `conn.log`.

```bash
# distinct source IPs communicating on OT protocol ports
OT_PORTS="502|20000|4840|2404|102|44818|1502|47808"
zeek-cut id.orig_h id.resp_p < conn.log | \
  awk -v re="$OT_PORTS" '!/^#/ && $2 ~ re {print $1}' | \
  sort -u

# baseline comparison across collection periods:
# save the sorted source list from a prior window to baseline.txt
# comm -13 baseline.txt <(zeek-cut id.orig_h id.resp_p < conn.log | \
#   awk -v re="$OT_PORTS" '!/^#/ && $2 ~ re {print $1}' | sort -u)
# outputs sources present in the current window but absent from the baseline
```

A stable OT segment communicates the same devices to the same peers at the same
intervals. An IP address appearing for the first time in OT protocol traffic warrants
review of the corresponding ARP cache entries and physical access records for the
segment. The Pipedream toolkit (INCONTROLLER) included an OT device enumeration
component that scanned for Modbus, EtherNet/IP, OPC UA, MMS, and IEC 104 devices
simultaneously; its source IP would have appeared as a new entry in this query.
Last updated: 27 May 2026
