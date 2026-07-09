# ICS Access and Persistence SimLab

![ICS Access and Persistence SimLab](/_static/images/ot-company-location.png)

At how many steps along the way from the internet to the turbine PLC is a credential actually required?
Fewer than the architecture diagram suggests. The [ICS Access and Persistence SimLab](https://github.com/tymyrddin/ics-access-simlab)
was built to make that traversal concrete.

The estate belongs to Unseen University Power & Light Co., Ankh-Morpork's primary utility provider:
infrastructure assembled over decades, documentation patchy, cybersecurity posture emergent. Five network
zones, real Linux bridges, FRR-routed boundaries with actual iptables forwarding policy, about 35 containers
on a single Linux host. Vulnerabilities are properties of the simulated systems, not configuration options.
Consequences emerge from what players do.

## The topology

Six bridges, each mapped to a Purdue model layer:

- `ics_internet` (10.10.0.0/24): internet and city network, where players start
- `ics_dmz` (10.10.5.0/24): Guild Quarter, directly reachable from internet
- `ics_enterprise` (10.10.1.0/24): corporate IT
- `ics_operational` (10.10.2.0/24): site operations
- `ics_control` (10.10.3.0/24): area supervisory and field devices

Zone separation is enforced by five FRR router containers, each running zebra, staticd, and iptables with a
deny-by-default forwarding policy. The routers are also discoverable attack surfaces: the SSH admin plane lands
directly in `vtysh`, with default credentials that open configure mode.

Key dual-homed hosts bridge the zones. `wizzards-retreat` sits on the internet and has standing VPN tunnels into
enterprise and operational. `uupl-eng-ws` bridges operational and control. The Modbus gateway bridges them again
via stunnel-wrapped TLS, a second path the SCADA system has no visibility of.

## The attack chains

Two main branches from the starting position on `unseen-gate`.

### DMZ chains

The DMZ is directly reachable without any prior foothold. Four targets.

`contractors-gate` (10.10.5.20) is an SSH bastion with root password authentication and an optional
CVE-2024-6387 path. The root password is reused on the Neuron gateway in the same zone, a credential-reuse
find that opens two different directions.

`guild-exchange` (10.10.5.10) runs an umatiGateway management UI with no authentication (CVE-2025-27615). The
configured OPC-UA endpoint is visible in the UI; connecting to the OPC-UA server requires no credentials and
exposes callable methods including `stopPump()`. OPC UA looks like a modern protocol; with security policy set
to None it presents the same surface as any unauthenticated Modbus register. Two hops from a browser to a
stopped pump.

`substation-rtu` (10.10.5.14) exposes an unauthenticated REST management API that sets IEC-104 datapoints.
Any IEC-104 master polling the RTU receives whatever values the REST API last wrote. Consistent falsification
looks like a real grid event. Inconsistent falsification looks like a sensor fault. The choice between them is
worth considering.

`guild-clock` (10.10.5.30) is an NTP server with no authentication. Time manipulation is more useful as a
precondition than a standalone objective: shifted timestamps corrupt log correlation and expand
replay-protection windows.

### IT/OT pivot chains

Entry through `wizzards-retreat` (10.10.0.10), available via SSH, NFS mount, or OSINT. Once inside, a short
path and a full chain are both available.

The short path uses an Ed25519 key found on the workstation to reach the engineering workstation in two hops.
The full chain adds enterprise credential harvesting via anonymous FTP and SMB on a legacy file server, SCADA
access with default credentials, and a choice between path traversal and SQL injection against the historian.

The control zone holds the turbine PLC, two relay IEDs, and a revenue meter, all running Modbus with no
authentication. Three ways to trip the turbine: an emergency stop coil write (logged as estop, noisy), an
overspeed setpoint write (appears as a protection event), or a relay overcurrent threshold write that brings the
turbine down through its own protection system acting on a threshold an attacker set.

Historian ingest poisoning pairs with any turbine trip. Injecting normal-looking RPM readings while the turbine
is offline keeps the SCADA dashboard green. Operators see healthy telemetry. The window to work undetected
depends on how long the injected values stay plausible.

## Real routing, real failure

The routing is real. Zone separation is not simulated; it is enforced by actual iptables rules on actual Linux
bridges. An attack chain that cannot find its way through the forwarding policy fails the same way it would fail
in a real network, not because a scoring system says so.

The attack chains branch on real decisions: noisy versus stealthy, consistent versus inconsistent falsification,
speed versus coverage. A turbine trip via relay threshold write looks like a protection event in the logs; a
coil write looks like a command. Pairing a turbine trip with historian ingest poisoning requires understanding
both the control plane and the monitoring plane.

The Discworld setting is decorative. The vulnerabilities are not.

The estate grows as CVEs land in equipment the topology models and as new attack patterns get documented. Some
nodes don't change between releases. The legacy file server's anonymous FTP and SMB will remain: not a
misconfiguration waiting for remediation, but the kind of service that predates any policy that would remove
it. That stability is a condition the lab is built to explore.

## Setup

Linux only. Docker Desktop on macOS or Windows will not work; fixed-IP bridge networking requires the Linux
kernel. Requires Docker Engine 24+, containerlab 0.50+, and Python 3.10+.

```bash
./ctl up          # generate + build images + clab deploy
./ctl ssh         # connect as ponder
./ctl verify      # print verification commands
./ctl down        # destroy and clean up
```

`./ctl up` prompts for sudo once to create the host bridges via containerlab. On first run it generates a
dedicated ed25519 keypair; `./ctl ssh` selects it automatically.

For Hetzner deployment, run `./ctl cohort-keys` before `./ctl up` to generate a participant keypair for
distribution. Restricting repo directory permissions prevents the private key from being world-readable.

The SimLab repository can be found at [github.com/tymyrddin/ics-access-simlab](https://github.com/tymyrddin/ics-access-simlab).
Last updated: 20 May 2026
