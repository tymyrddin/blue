# Correlation and escalation

The Long Table receives classified signals from the Quiet Room: network observables that have been
attributed, scored, and routed for assessment. It does not receive vulnerability findings. Those belong
to the Watch Tower.

The distinction matters. The Watch Tower processes firmware vulnerability findings from the Society and
enriches them against CVE databases and exploitation catalogues. Its domain is the vulnerability. The
Long Table's domain is the threat actor: the infrastructure they use, the campaigns they run, the
patterns they leave in network traffic.

## What it does

Incoming classified signals (IP addresses, domains, certificates, file hashes, network behaviour
patterns) are structured as threat intelligence events and correlated across time and source. An IP
address seen in a Zeek log today, appearing in a Suricata alert last week, resolving to a domain that
arrived in a Receiving Desk submission last month: these are the relationships the Long Table maps.

The correlation produces actor attribution where the evidence supports it, campaign tracking where the
same infrastructure appears across multiple incidents, and confidence levels assigned to each claim.

An analyst reviews the correlated picture and determines one of three outcomes: escalation as a
consolidated assessment, retention as an open case for continued monitoring, or closure with a note.

## What leaves

The escalation product is a single document. Correlated observables. Attributed relationships.
Confidence levels. Analyst determination. The raw signals remain in the event store. The consolidated
view is what leaves the Long Table.

## Relationship to the Watch Tower

The Watch Tower and the Long Table operate in adjacent domains that occasionally overlap. A firmware
vulnerability being actively exploited produces both a Watch Tower finding (the vulnerability) and a
Quiet Room signal (the exploitation traffic). The two events may eventually be correlated, but they
enter through different pipelines and produce different products. Whether the two instances share events,
and under what rules, is an architectural question. See the design page.
