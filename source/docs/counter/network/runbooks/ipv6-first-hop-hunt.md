# IPv6 first-hop attack hunting

Four hunts for rogue Router Advertisement and rogue DHCPv6 activity on a local segment: RAs
from a non-gateway source, competing default-router advertisements, a poisoned RDNSS resolver,
and rogue DHCPv6 server replies. IPv6 autoconfiguration trusts the first advertisement it
hears, so a rogue RA or DHCPv6 server reroutes traffic or redirects name resolution with no
exploit; each leaves ICMPv6 or DHCPv6 evidence on the wire.

Data source: a span port feeding `tshark` or Zeek on the segment under test, the switch's RA
Guard and DHCPv6 Guard drop counters, and the known set of gateway and DHCPv6-server addresses
as baseline.

## Router Advertisements from a non-gateway source

Hypothesis: a host that is not a legitimate router is sending Router Advertisements to take the
default route or rewrite the on-link prefix.

```bash
# every source sending RAs (ICMPv6 type 134), with its link-local and MAC
tshark -i eth0 -Y 'icmpv6.type == 134' -T fields \
  -e ipv6.src -e eth.src -e icmpv6.nd.ra.router_lifetime 2>/dev/null | \
  sort | uniq -c | sort -rn
```

Any source address or MAC outside the known gateway set, advertising a non-zero router
lifetime, is a rogue RA. A lifetime of zero from an unexpected source is the de-prioritising
half of an RA-spoofing pair and is just as much a finding.

## Competing default-router advertisements

Hypothesis: two sources are advertising themselves as default router on the same segment, the
contention an injected RA produces alongside the real gateway.

```bash
# distinct RA sources advertising a non-zero router lifetime, over two minutes
tshark -i eth0 -a duration:120 -Y 'icmpv6.type == 134 && icmpv6.nd.ra.router_lifetime > 0' \
  -T fields -e ipv6.src 2>/dev/null | sort -u
```

More than one address here, where the segment has a single gateway, is a rogue router.
Comparing the list against the documented gateways names the impostor.

## Poisoned RDNSS resolver

Hypothesis: a rogue RA leaves routing alone but advertises an RDNSS option naming an
attacker-controlled resolver, redirecting name resolution while the path appears unchanged.

```bash
# RDNSS resolver addresses carried inside RAs
tshark -i eth0 -Y 'icmpv6.type == 134 && icmpv6.opt.type == 25' -T fields \
  -e ipv6.src -e icmpv6.opt.rdnss.dns 2>/dev/null | sort -u
```

Any resolver address that is not the organisation's own is a redirection. An RA that changes
only the RDNSS option, leaving the prefix and gateway intact, is the quieter form of the attack
and the easier one to miss.

## Rogue DHCPv6 server replies

Hypothesis: a host that is not the authorised DHCPv6 server is answering solicits, handing out
addresses, resolvers, or both.

```bash
# DHCPv6 Advertise (2) and Reply (7) messages, by server source
tshark -i eth0 -Y 'dhcpv6.msgtype == 2 || dhcpv6.msgtype == 7' -T fields \
  -e ipv6.src -e eth.src -e dhcpv6.msgtype 2>/dev/null | sort | uniq -c | sort -rn
```

A server source outside the authorised set is a rogue DHCPv6 server. Where DHCPv6 Guard is
deployed, the same finding appears as an incrementing drop counter on the offending access
port, which localises it to a physical port without a capture.
