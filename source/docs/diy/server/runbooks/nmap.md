# Check exposed services with nmap

Validation runbook. Scans a host or network from the outside to see which ports are actually reachable, without logging into each machine. The point is to see what an attacker sees, and to catch services exposed by accident.

## When to use

After a firewall change, to confirm only the intended ports are reachable. Periodically, as part of a [public exposure review](../../incidents/runbooks/exposure-review.md). When auditing a network whose service inventory is uncertain.

## Risk

Scan only systems and networks the organisation owns or has explicit permission to test. Port scanning infrastructure that belongs to someone else can breach acceptable-use policies or law. For the clearest external picture, run the scan from outside the organisation's own network, since a scan from inside sees ports the firewall would block from the internet.

## Basic scan

A SYN scan of one host:

```
sudo nmap -sS target.ip.address
```

`-sS` is a SYN scan: it is quieter than a full connection and is the common choice for routine checks. The output lists each port's state.

## Reading the states

- `open`: a service is running and reachable. For each open port, the question is whether it has any business being reachable from where the scan ran.
- `closed`: reachable host, but nothing listening on that port.
- `filtered`: a firewall is blocking the port. This is the expected state for everything that is not deliberately exposed.

A line like `Not shown: 996 closed ports` (rather than filtered) suggests no firewall is in front of the host.

## Fuller detail

To identify service versions and the operating system, and run nmap's built-in checks:

```
sudo nmap -A target.ip.address
```

This reports open, closed, and filtered ports, identifies service versions, attempts OS detection, and runs a set of detection scripts. Slower and far noisier than `-sS`; use it when detail is wanted, not for a quick check.

## Discovering hosts

To find what is on a subnet rather than scan one host:

```
sudo nmap -sn 192.168.1.0/24
```

On a local subnet this uses ARP, which firewalls do not block, making it a reliable way to enumerate live hosts.

## Verify

Compare the open ports against the intended list for that host. Every open port should map to a service that is meant to be reachable. An open port with no known purpose is the finding: identify the service, then close the port or stop the service.

Plaintext services worth flagging when found exposed: anything on the VNC ports, telnet, FTP. VNC in particular crosses the network unencrypted; where it is needed, an SSH tunnel is the usual remedy.

## Done

Every open port corresponds to an intended, documented service. No unexpected ports reachable from outside. Any plaintext service exposed to untrusted networks is flagged for remediation.

## Follow-up

- Findings feed the [public exposure review](../../incidents/runbooks/exposure-review.md) and any firewall tightening ([UFW](ufw.md) / [iptables](iptables.md)).
- An unexpected open service may also warrant a [running-services audit](systemctl.md) on the host itself.
