# Detecting inter-domain attacks

The control plane is observable from outside, and the same public feeds an attacker reads, RIPE RIS and
RouteViews, carry the evidence. Detection works by comparing each announcement against something the operator
knows to be true: its own prefixes, the published relationships, and the prefix's learned normal. Most of
these signals can be built and replayed against recorded streams before they are trusted live.

## Unexpected more-specifics and new origins

Watch the organisation's own address space for a more-specific, or an origin, it never announced. BGPalerter
reading RIS Live captures the intent in a few lines:

```yaml
prefixes:
  203.0.113.0/24:
    description: corp edge
    asn: [64500]
    ignoreMorespecifics: false
```

`ignoreMorespecifics: false` is the line that fires on a `203.0.113.0/25` that AS64500 never announced.
Feeding a recorded RIS or RouteViews stream through the same logic confirms it triggers on first sight, which
is the cheapest early warning available.

## RPKI-invalid and IRR mismatch on the stream

Validate a live RIS or RouteViews stream against a local Routinator or rpki-client cache, and surface
RPKI-`invalid` announcements and routes that contradict a clean route object as they arrive. This catches the
louder variants well before any correlation is needed, and it runs from public data alone.

## Route leaks against the relationship graph

A leak is a path that contradicts the valley-free shape: a customer AS appearing as transit between two
providers, or a peer edge crossed twice. Holding CAIDA's inferred relationship graph as ground truth, a
detector can flag any AS_PATH that uses an edge in a direction the relationships do not permit, even when
every prefix in the announcement is genuine.

## Baseline deviation

Hold a rolling baseline per prefix: the usual origin, the path-length distribution, and the recurring upstream
set. Alert on deviation, because thresholds tuned for "down" miss
"different", and "different" is where these changes live. The harder case is slow baseline pollution, where a
prefix is gradually taught to look multi-origin over months; catching that needs history kept long enough to
compare today's normal with where the prefix started.

## Control-plane and data-plane correlation

A path or latency shift on a critical prefix that no maintenance ticket explains is the signal. Scheduled
traceroutes from a few vantage points, correlated against a new upstream appearing in the AS_PATH, separate a
deliberate reroute from ordinary congestion, which neither signal manages alone.

## Classifier features and cross-vantage correlation

The public detectors (GRIP, ARTEMIS, Cloudflare Radar) score a small, well-understood feature set, and the
same features drive an in-house pipeline:

```
MOAS          a prefix suddenly announced by a second origin AS
sub-MOAS      a more-specific announced by a different origin than the covering block
new edge      an AS adjacency never seen before in the path
path change   large edit distance from the prefix's usual AS_PATH
RPKI invalid  the route disagrees with a published ROA
bogon         unallocated or reserved space in the announcement
```

Scored against a known-origin list, a rolling baseline, and a local RPKI cache, these turn raw updates into
ranked anomalies. Cross-vantage correlation, the same signal seen from many collectors at once, is what
raises confidence that a flag is a real shift. These models improve faster on an
operator's own ground truth than an outsider's do from outside, because the operator knows which announcements
are theirs. A detection lab such as heimdallr is where the classifier and the baseline get built and replayed
against recorded streams, so the model is tested on real movement rather than on faith.
Last updated: 09 July 2026
