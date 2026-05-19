# OT Defence Workbench

Most OT security labs teach attack paths. The [OT Defence Workbench](https://github.com/tymyrddin/ot-defence-workbench)
starts from the other end: a network boundary with nothing on it, legitimate traffic that needs to get through,
and a probe that already knows what to try.

## The topology

Two segments. One boundary. Nothing reaches the south without crossing it.

The north segment (10.0.1.0/24) holds a client and a probe. The south segment (10.0.2.0/24) holds a Modbus/TCP
asset server. The boundary node sits between them, starting as a transparent bridge. Building it up from there
is the work.

The probe generates attack traffic and reports what got through. The web interface at `http://localhost:5000`
shows either HELD (all known checks passed) or OPEN (something got through). HELD is not the same as secure.
The probe's battery is finite; the asset is simulated. The scoreboard reports what the probe knows, no more.

## The brief ladder

Eight briefs, each one introducing something the previous defence did not anticipate.

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

## The thing that separates it

Attack labs check whether an attack got through. This one checks both sides: whether the attack got through
and whether legitimate traffic kept flowing. Blocking Modbus writes from the probe while also dropping the
client's reads is a fail. The requirement is a boundary that distinguishes, not one that refuses everything.

That constraint makes the briefs harder. It also makes them closer to what defensive decisions in real OT
environments actually involve.

Custom probes are possible too: attack scripts written directly in the browser interface, saved and run
independently without affecting the HELD/OPEN verdict.

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

The workbench is at [github.com/tymyrddin/ot-defence-workbench](https://github.com/tymyrddin/ot-defence-workbench)
and more briefs will follow.
