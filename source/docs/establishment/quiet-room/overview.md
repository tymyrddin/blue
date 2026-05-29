# Signal intake and confidence classification

Signal intake for the Establishment runs through the Quiet Room. Three sensor sources, one classification
scheme, and a consistent rule about where the output goes.

## Signal sources

Suricata generates alert-level signal from network perimeter sensors. Each alert carries a rule signature,
a source address, and a timestamp. It does not carry context. Context is added downstream.

Zeek generates connection metadata from the same sensors: DNS queries, HTTP transactions, connection logs,
file extraction events, and SSL certificate data. Where Suricata records that something triggered a rule,
Zeek records what the surrounding conversation looked like.

Wazuh contributes host-level telemetry on a selective basis. Not every Wazuh event is relevant at the
Quiet Room's level of analysis. The selection criteria are internal.

## Classification

Each piece of incoming material is classified on two axes before leaving the Quiet Room.

Source taxonomy has three categories: Society notification, Office advisory, or Other. "Other" covers
third-party feed material, anonymous submissions forwarded by the Receiving Desk, automated output from the
Quiet Room's own sensors, and signals whose origin cannot be confirmed within the Quiet Room's available
information.

Automated sensor events are tagged on both axes at intake without an analyst: source taxonomy Other with a
sensor provenance note, and a default reliability of 2, since a single uncorroborated alert sits there by
definition. They leave intake at `tlp:white`, because the sensor path cannot judge the sensitivity of what
it has seen. An analyst is involved only when correlation raises such material toward the routing
threshold.

Reliability runs from 1 to 5. Level 1 is unconfirmed, single-source material with no corroboration.
Level 5 is independently verifiable, source-confirmed, and consistent across multiple collection points.
In practice, most material arrives at 2 or 3. Material at 1 is dropped unless a correlation already in
the pipeline changes its standing.

## Routing

Material classified at reliability 3 or above with clear source attribution passes to the Long Table.

Material that falls below the routing threshold individually but shows pattern correlation across two or
more sources is held for correlation analysis. A Zeek connection log and a Suricata alert from
overlapping infrastructure on the same day, both at reliability 2, produce a different picture combined
than either produces alone.

Low-confidence, single-source, non-correlating material is dropped. The drop is logged. The drop log is
not reviewed by the Long Table.

## Scope

The Quiet Room characterises. It does not interpret. A cluster of signals pointing toward a particular
threat pattern is the Quiet Room's output. What that pattern means is determined by whoever receives it.

It does not investigate. An alert that appears to warrant investigation is passed upward with that
observation noted. The investigation is not the Quiet Room's function.

## The logs that do not exist

Suricata records network flows, and network flows contain IP addresses, which are personal data under
data-protection law. This is the kind of detail an organisation is ordinarily expected to have a position
on.

The Establishment's position, where it has one, is that it logs only what the Data Privacy Framework
permits. The framework legalises the transfer that the tool's American origin would otherwise raise; the
origin is therefore not a problem; the problem the position was meant to address does not arise. The chain
closes on itself neatly enough that no single link has to bear weight.

Underneath it sits a simpler arrangement. The Establishment publishes no privacy policy, does not
acknowledge that it processes data, and does not answer subject access requests. Whether anyone, foreign
agencies included, can reach the Suricata logs is a question that cannot be put, because the logs are not
confirmed to exist. A log that is never acknowledged is a log that never has to be explained.
