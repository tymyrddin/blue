# Reducing the inter-domain attack surface

Inter-domain attacks mostly spend room that was left lying around: more-specific space under a loose ROA, a
prefix filter that accepts more than it needs, a path that no one is entitled to announce, a service that
leans on a single upstream. The controls below remove that room. They map to the reconnaissance in the red
notes on casing the clacks, and complement the brief origin-validation block in the network notes.

## Tight ROAs

A Route Origin Authorisation binds a prefix to its origin AS and a maximum length. A ROA whose maximum length
equals the announced length removes the more-specific room: a `/24` authorised only as a `/24` leaves no
`/25` to carve out and win by longest-prefix match. The published set is visible to anyone, which is also how
an attacker checks for the gap:

```
routinator vrps --format csv | grep 203.0.113
```

```
AS64500,203.0.113.0/24,24
```

A line whose max length is wider than the prefix it covers, or no line at all, is the opening to close.

## Validation on ingest

Publishing a ROA and enforcing validation are separate acts. Route Origin Validation that drops
RPKI-`invalid` on ingest, rather than logging it and moving on, closes the forged-origin case for signed
space. ROV depends on a local validator (Routinator, rpki-client, or OctoRPKI) feeding routers over RTR; the
Cisco-side configuration is shown in the network notes on reducing network attack surface, and applies
unchanged here.

## IRR hygiene and tight filters

Older than RPKI, the Internet Routing Registries hold route objects that automated filters still trust.
Objects pruned to what is actually announced, and per-customer prefix filters built from an accurate
`aut-num` and `as-set` rather than accepting `ANY`, shrink what any downstream will carry. Operators generate
those filters the same way an outsider audits them:

```
bgpq4 -4 -l CUSTOMER-IN AS64500
```

```
ip prefix-list CUSTOMER-IN permit 203.0.113.0/24
```

A filter built from a loose `as-set` lists more than the customer announces, and the surplus is exactly the
opening a leak or a hijack rides in on.

## Provider authorisation (ASPA)

Origin validation answers a forged origin; it does nothing for a route whose origin is correct but whose path
is not, which is what a route leak is. Autonomous System Provider Authorisation records each AS's legitimate
upstreams, so a neighbour can reject a path that climbs through an AS that is not an authorised provider. As
ASPA deployment grows it is the structural answer to leaks, the case where every prefix is genuine and the
shape of the path is the only thing wrong.

## Reducing dependency concentration

Concentration is the exposure. A service reachable through one upstream or one exchange degrades exactly as
cleanly as an attacker hopes, and a single chokepoint is the thing dependency mapping looks for first.
Spreading announcements across diverse upstreams, and avoiding a single exchange on the critical path,
narrows the window in which a quiet degradation can pass for congestion.
Last updated: 17 June 2026
