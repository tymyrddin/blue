# Detection philosophy

## Core principles

### Defence is harder than attack

BGP's trust model is from 1994. It assumes:

- Operators don't lie
- Networks are cooperative
- Mistakes are accidental
- Everyone plays nice

Reality in 2025:

- Nation-states manipulate routing
- Criminals intercept traffic for profit
- Mistakes happen constantly
- Insider threats exist

Perfect prevention, then, is not on the table. The lever that is left is time-to-detection, and that is where the attention goes.

### Detection requires visibility

Nothing gets detected that nobody can see.

Minimum worth having:

- BGP UPDATE/WITHDRAW messages from multiple vantage points
- Routing table snapshots
- Configuration change logs
- Authentication/access logs

Better, where it can be had:

- Network performance metrics (latency, jitter, loss)
- NetFlow/IPFIX traffic analysis
- RPKI validator state
- Change management system integration

Better still:

- Synthetic monitoring from multiple locations
- Honeypot prefixes (canaries)
- Out-of-band verification
- Cross-organisation information sharing

### Correlation over perfection

A single signal is ambiguous. Correlation is what turns it into confidence.

| Signal            | Alone              | With correlation                    |
|-------------------|--------------------|-------------------------------------|
| BGP UPDATE        | Normal operation   | + Short duration = Hijack           |
| Latency spike     | Network congestion | + Subprefix announce = Interception |
| Login from Russia | Remote worker      | + ROA deletion = Compromise         |

Mapping onto Wazuh:

- Low-severity rules for single signals (level 3-7)
- Medium-severity for suspicious patterns (level 8-10)
- High-severity for correlated composite rules (level 11-15)

### False positives kill detection programs

Alert fatigue is real, and unforgiving. Once every alert is "probably nothing", analysts stop reading them, and the one that mattered goes by with the rest.

Keeping false positives survivable:

1. Tuned thresholds, a latency spike at 100ms versus 200ms
2. Allow-lists for known CDNs and anycast providers
3. Correlation, rather than an alert on a single ambiguous signal
4. Testing against legitimate change, to see whether routine maintenance trips the wire
5. A feedback loop, where analysts mark false positives and the rules learn

Rates worth aiming at:

- Critical alerts (L12+): under 1 false positive per month
- High alerts (L10-11): under 1 false positive per week
- Medium alerts (L7-9): under 5 false positives per day
- Low alerts (L3-6): informational, aggregated

### Speed is the whole game

Attack windows are short, and detection that arrives after them is history, not defence.

Typical attack timelines:

- Fat-finger hijack: 10-120 minutes
- Subprefix interception: hours to days
- Control-plane attack: hours (though the impact can land in minutes)

Where the time goes:

- Signal generation: under 30 seconds (BGP feeds update frequently)
- Rule evaluation: under 5 seconds (Wazuh is fast)
- Alert delivery: under 30 seconds (email/webhook)
- Human response time: variable, and this is the bottleneck

From attack to a human knowing about it: under 5 minutes for critical alerts, on a good day.

### Attribution is hard, detection is not

Detection and attribution are different questions, and conflating them is a common way to get stuck. Detection asks "did something suspicious happen?" Attribution asks "who did it, and why?"

- Detection: ROA deleted, RPKI state flipped, victim route rejected, caught in 2 minutes.
- Attribution: insider? nation-state? supply chain? accident? possibly weeks or months, possibly never.

Detection comes first. Attribution is forensics, legal, and diplomatic work, and it keeps.

### Assume breach

For anything high-value, the safer assumption is that someone has already had a go at the routing.

What that assumption implies:

- Credentials are occasionally compromised
- Insiders may be malicious
- Supply chain is not fully trustworthy
- Zero-days exist in routing platforms

And so:

- Defence in depth, not just a perimeter
- Continuous monitoring, not just an IDS
- Detection of compromise, not only its prevention
- Honeytokens, to catch the access nobody authorised
