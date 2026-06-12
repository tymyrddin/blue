# Route-origin hijack hunting

Four hunts for a BGP route-origin hijack of the organisation's own address space: a foreign
origin AS for an owned prefix, a more-specific announcement of an aggregate, an RPKI-invalid
route in the table, and a short-lived announcement window. A hijack is announced to the whole
internet, so the strongest signal comes from the global table, not from the local routers a
hijacked prefix may never cross.

Data source: a local RPKI validator (Routinator, `rpki-client`) for validity state, the
routers' own BGP table (`show bgp`), and a feed of the global table from a public route
collector (RIPE RIS via the RIPEstat API, or RouteViews). The organisation's authorised
origins are the comparison baseline.

## Owned prefixes seen from a foreign origin AS

Hypothesis: one of the organisation's prefixes is being announced into the global table from
an origin AS that is not its own, a multiple-origin-AS conflict.

```bash
# query RIPEstat for every origin currently announcing an owned prefix
# the owned ASN and prefix list are the local baseline
for p in 198.51.100.0/24 203.0.113.0/24; do
  curl -s "https://stat.ripe.net/data/routing-status/data.json?resource=$p" | \
    python3 -c '
import sys, json
d = json.load(sys.stdin)["data"]
own = {"64500"}                       # the organisation own ASN(s), without the AS prefix
seen = {str(o["origin"]) for o in d.get("origins", [])}
rogue = seen - own
if rogue:
    print(d["resource"], "origins:", sorted(seen), "UNEXPECTED:", sorted(rogue))
'
done
```

An origin that is not the organisation's own, for a prefix only it originates, is a
hijack until proven a misconfiguration by a downstream or a documented anycast arrangement.

## More-specific announcements of an aggregate

Hypothesis: an attacker has announced a longer prefix, a /24 inside an announced /20, to win
the route by specificity, the standard way a hijack draws traffic without displacing the
legitimate aggregate.

```bash
# list every more-specific currently visible under an announced aggregate
curl -s "https://stat.ripe.net/data/related-prefixes/data.json?resource=198.51.96.0/20" | \
  python3 -c '
import sys, json
for r in json.load(sys.stdin)["data"].get("prefixes", []):
    if r.get("relationship") == "Overlap - More Specific":
        print(r["prefix"], "origin", r.get("origin_asn"))
'
```

A more-specific that the organisation did not announce, especially one carved to the /24 floor
that most providers still accept, is the hijack's working mechanism.

## RPKI-invalid routes in the table

Hypothesis: the local routers are carrying, or selecting, a route the RPKI marks invalid.

```bash
# routes marked invalid by the validator, from the router BGP table
# (IOS-XR equivalent: 'show bgp ipv4 unicast origin-as validity invalid')
ssh rtr01 'show bgp ipv4 unicast rpki invalid' | awk '/^\*/ {print}'
```

With Route Origin Validation enforced, invalids are dropped or de-preferred and this hunt is
expected to return nothing. A non-empty result means either ROV is not enforcing, or a route is
invalid for a reason worth understanding before it is trusted.

## Short-lived announcement windows

Hypothesis: an interception hijack announced an owned prefix only long enough to capture
traffic, then withdrew it, which shows as an update-and-withdraw pair minutes apart rather
than a standing route.

```bash
# RIPE RIS updates for an owned prefix over the last day; announce/withdraw pairs are the signal
curl -s "https://stat.ripe.net/data/bgp-updates/data.json?resource=198.51.100.0/24&starttime=$(date -u -d '1 day ago' +%FT%T)" | \
  python3 -c '
import sys, json
for u in json.load(sys.stdin)["data"]["updates"]:
    a = u.get("attrs", {})
    print(u["timestamp"], u["type"], a.get("source_id",""), a.get("path",""))
' | sort
```

A pair of announce and withdraw for an owned prefix, minutes apart and from a path that does
not include the organisation, is the signature of a timed interception rather than a fat-finger.
