# OT Defence Workbench

![OT Defence Workbench screenshot](/_static/images/workbench.png)

The incidents are instructive not because the protocols were exploited, but because they were reached.
Modbus, MQTT, IEC 60870-5-104: none carries authentication in its base specification. Any host that gets
to port 502, 1883, or 2404 is treated as authorised. The network boundary is the only enforcement point
any of them will ever have.

The [OT Defence Workbench](https://github.com/tymyrddin/ot-defence-workbench) was built from that
observation. This lab starts with no boundary at all and builds one brief at a time, with a probe that
tests both sides: whether the attack got through, and whether legitimate traffic kept flowing.

## The topology

Two segments. One boundary. Nothing reaches the south without crossing it.

The north segment (10.0.1.0/24) holds a client and a probe. The south segment (10.0.2.0/24) holds a 
[Modbus/TCP](../protocols/modbus.md) asset server. The boundary node sits between them, starting as a transparent bridge. 
Building it up from there is the work.

The probe generates attack traffic and reports what got through. The web interface at `http://localhost:5000`
shows either HELD (all known checks passed) or OPEN (something got through). HELD is not the same as secure.
The probe's battery is finite; the asset is simulated. The scoreboard reports what the probe knows, no more.

## The brief ladder

Ten briefs, each one introducing something the previous defence did not anticipate.

### 1 · block-probe

Modbus carries no authentication. Anyone who reaches port 502 can read or write any register. The boundary
starts as a transparent bridge. Setting FORWARD DROP and adding a single permit rule for the client is enough
to separate the probe from the asset. Several architectures satisfy the brief; only the outcome is tested.

### 2 · write-one-setpoint

The client needs to write a setpoint; the probe still needs to be blocked. The only distinction available at
L3/L4 is source address. A permit rule scoped to 10.0.1.10 works, and introduces the assumption that brief 4
will break.

### 3 · jump-host

Brief 2 permitted the client to reach the asset directly. Brief 3 closes that path for everyone. The boundary
DNAT-proxies all port 502 connections: no packet travels directly between north and south. Lateral movement
to the asset requires going through the single visible gate.

### 4 · spoof-proof

The probe adopts the client's address (10.0.1.10) and attempts a direct connection. The jump-host FORWARD DROP
blocks it regardless, because the rule is topological rather than address-based. A source-allowlist defence
fails this check. The jump-host holds.

### 5 · source-restricted-proxy

The jump-host DNAT rule in brief 3 had no source restriction: any host on the north segment could use it.
Adding a source qualifier to the PREROUTING rule means only the client's connections are forwarded. The probe's
connections find no matching DNAT entry and hit the DROP policy.

### 6 · modbus-write-filter

The iptables u32 module navigates IP and TCP headers and reads the Modbus function code byte. Write function
codes (05, 06, 15, 16) are dropped before any ACCEPT rule sees them, regardless of source. The client's writes
are also blocked; the asset becomes read-only. Source address is irrelevant to this control.

### 7 · graduated-access

Brief 6's read-only posture is too strict when the client needs to write setpoints. Adding a source exception
to the function code filter restores that: write function codes are dropped for all sources except the
authorised address. The probe can read but cannot write.

### 8 · layered-defence

The DNAT source restriction from brief 5 and the function code filter from brief 6 are combined. Each control
independently denies a different attack surface. Bypassing the source restriction still leaves the function
code filter; bypassing the function code filter still leaves the source restriction. The probe can neither
read nor write. The client retains full access. Two independent controls, both of which the probe would need
to beat simultaneously.

### 9 · mqtt-block-probe

MQTT starts with anonymous access and no TLS. Any host that reaches port 1883 can subscribe to the full
topic tree and receive all process telemetry, or publish to command topics and affect physical state: no
credentials, no exploit, just a CONNECT packet. Researchers scanning Shodan in 2023 found over 50,000
publicly reachable MQTT brokers with anonymous access; several served live industrial process data. On a flat
OT network the reach requirement drops to the same subnet.

Brief 9 applies segmentation. The requirement is the same as brief 1, for a different protocol on a different
port: the probe cannot reach the broker, the client's connection still succeeds.

### 10 · iec104-block-probe

[IEC 60870-5-104](../protocols/iec60870-5-104.md) carries no authentication in its base specification. Any
host that completes the STARTDT handshake is treated as an authorised master station and may send control
commands to field devices, including C_SC_NA_1, a single command that opens or closes a circuit breaker. In
December 2015, Sandworm used plain IEC 104 sessions to open breakers at substations across three Ukrainian
oblasts and cut power to around 230,000 customers. In December 2016, Industroyer automated the same attack:
a dedicated payload that enumerated information object addresses and issued trip commands without any
credential exchange. No exploit. No credential. The protocol accepted the commands because the station
answered the phone.

Brief 10 applies the same network control as brief 1: the probe cannot reach the substation controller,
the client's monitoring connection still succeeds.

## Both directions

Attack labs check whether an attack got through. This one checks both sides: whether the attack got through
and whether legitimate traffic kept flowing. Blocking Modbus writes from the probe while also dropping the
client's reads is a fail. The requirement is a boundary that distinguishes, not one that refuses everything.

That constraint makes the briefs harder. It also makes them closer to what defensive decisions in real OT
environments actually involve.

Custom probes are possible too: attack scripts written directly in the browser interface, saved and run
independently without affecting the HELD/OPEN verdict. Custom filters work the same way, so an existing setup 
can be tested against a new probe independently.

New briefs arrive when existing defences prove insufficient against a technique that emerged after them. The
brief ladder is not finished. The attack surfaces it exercises have not changed: the protocols are the same
as when they were specified. That is a different kind of stability.

## Setup

Requires Docker, containerlab, and Python 3.11+.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
./lab up
python web/app.py
```

The web interface comes up at `http://localhost:5000`. The probe battery, firewall component selector, and
pass/fail results are all there.

The workbench repository can be found at [github.com/tymyrddin/ot-defence-workbench](https://github.com/tymyrddin/ot-defence-workbench).
