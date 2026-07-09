# Availability under attack: response runbook

Step-by-step response when a service is degraded or denied by deliberate action rather than fault:
volumetric denial of service, routing or signal manipulation, or a forced service stop. Pairs with
the [availability](../availability.md) family.

## Confirm the failure mode

The three modes need different containment. Tell them apart first.

```bash
# Volumetric: packet/connection rate far above baseline
ss -s                                     # totals; watch the SYN-RECV count
ss -tan state syn-recv | wc -l            # half-open count (SYN flood)
sar -n DEV 1 5                            # per-interface pps/bps vs baseline
# top talkers from a quick capture (or pull them from the NetFlow/sFlow collector)
timeout 10 tcpdump -nni <if> | awk '{print $3}' | cut -d. -f1-4 | sort | uniq -c | sort -rn | head

# Routing / integrity: traffic delivered, but to the wrong place
ip route get <dest>                       # local path as expected?
ip neigh show                             # changed/duplicate MAC for the gateway = ARP spoof
dig +short <name> @<authoritative_ns>     # compare to what the resolvers are handing out
# BGP: check the prefix origin against RPKI/IRR on a looking glass; a new origin AS is the tell

# Service stop: a clean halt
systemctl status <service>; journalctl -u <service> --since -30min
# Windows: System log, Service Control Manager, Event IDs 7034/7036/7040
```

Cross-check monitoring against reality. In a routing or integrity attack the dashboards read green
while the service is wrong, so trust the process.

## Contain by failure mode

### Volumetric denial of service

Scrubbing lives upstream; by the time the flood reaches the edge the link is already full. Engage the
upstream provider or scrubbing service first, then take the local edge off the worst of it.

```bash
sysctl -w net.ipv4.tcp_syncookies=1       # ride out SYN floods without filling conntrack
ip route add blackhole <bad_prefix>       # drop a hostile source range at the edge
nft add rule inet filter input tcp flags syn limit rate over 100/second drop
# ask upstream for a remote-triggered blackhole (RTBH) or a flowspec rule on the source
```

### Routing or signal manipulation

- Validate the route's origin before trusting it: check the prefix against RPKI/IRR. A genuine
  signature on a bad update means a stolen key, not a safe change. Withdraw or filter the bad
  announcement and quarantine the peer or relay that sent it.
- Pin the local layers: a static ARP entry or Dynamic ARP Inspection for a spoofed gateway, DNSSEC
  validation plus a cache flush and a zone lock for poisoned resolution.
- Re-key only after the rogue source is isolated, so the new key is not re-poisoned on arrival.
  Revoking the compromised key darkens every device that trusts it, the defender's own included, for
  the re-key window. That window is the cost, and it may be the thing the attacker was driving toward.

### Forced service stop

Find what issued the stop before restarting (the systemd journal, the Windows SCM events above, or
the orchestration audit log). A service stopped by a valid token or a scheduled job is stopped again
the moment it restarts, so revoke that path first, then verify the binary and config against a
known-good hash before bringing it back.

## Coordinate out of band

Move incident coordination off the affected path; assume the channel under attack cannot carry the
instruction to fix it. Confirm the fallback channel is not itself watched or pre-positioned, because a
single fallback is a single point of failure.

## Recover and verify

- Restore only after provenance is established. Compare running config and firmware against a
  known-good baseline (`sha256sum`, a config-management diff) before trusting the device again.
- Watch for re-assertion: firmware or config that reloads the attack from local memory after a reboot.
Last updated: 10 July 2026
