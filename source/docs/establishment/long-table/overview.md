# Correlation and escalation

The Long Table is where the Establishment's findings converge. It receives two kinds of input.
Classified network signals arrive from the Quiet Room: observables that have been attributed, scored,
and routed for assessment. Vulnerability findings arrive from the Receiving Desk: firmware findings and
CVEs with vendor timelines, routed for correlation against everything else in the pipeline.

The two enter through different paths and describe different things. A Quiet Room signal is an actor's
infrastructure in network traffic. A Receiving Desk finding is a weakness in a product. The Long Table's
function is to hold both in one view and see where they meet: a CVE whose exploitation traffic is already
in the event store, a piece of infrastructure that appears in three unrelated submissions, a campaign
that only becomes visible once the vulnerability and the traffic are read together.

## What it does

Incoming material (IP addresses, domains, certificates, file hashes, network behaviour patterns, and the
vulnerability findings that frame them) is structured as threat intelligence and correlated across time
and source. An IP address seen in a Zeek log today, appearing in a Suricata alert last week, resolving to
a domain that arrived in a Receiving Desk submission last month, and now tied to a CVE under active
exploitation: these are the relationships the Long Table maps.

The correlation produces actor attribution where the evidence supports it, campaign tracking where the
same infrastructure recurs, and a confidence level on each claim. A finding that arrived with a low
reliability ceiling can have that ceiling lifted when an independent source corroborates it; correlation
is the mechanism that changes a single uncertain report into a supported one.

An analyst reviews the correlated picture and determines one of three outcomes: escalation as a
consolidated assessment, retention as an open case for continued monitoring, or closure with a note.

## What leaves

The escalation product is a single document. Correlated observables. Attributed relationships. The
vulnerabilities in play. Confidence levels. Analyst determination. The raw signals and the original
findings remain in the event store; the consolidated view is what leaves the Long Table. It produces one
view. It does not append alternatives.

## The Watch Tower

The Watch Tower is a separate organisation. Officially it belongs to the Office, runs on the Office's
infrastructure, and keeps its own repository. It also processes vulnerability findings, enriching them
against CVE databases and exploitation catalogues, which is adjacent to part of what the Long Table does.

The two are not the same pipeline, and the Establishment's own vulnerability findings are handled here,
at the Long Table. Where the two instances share material at all,
it crosses an institutional boundary, the Office's network and the Establishment's are not the same
network, and what crosses is governed by sharing-group rules. A
firmware vulnerability under active exploitation may produce a finding on both sides; they are correlated,
if at all, by agreement.
Last updated: 10 July 2026
