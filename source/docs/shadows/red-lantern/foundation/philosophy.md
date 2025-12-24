# Dept of Silent Stability detection philosophy

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

Implication: Perfect prevention is impossible. Focus on reducing time-to-detection.

### Detection requires visibility

You cannot detect what you cannot see.

Minimum viable visibility:

- BGP UPDATE/WITHDRAW messages from multiple vantage points
- Routing table snapshots
- Configuration change logs
- Authentication/access logs

Better visibility:

- Network performance metrics (latency, jitter, loss)
- NetFlow/IPFIX traffic analysis
- RPKI validator state
- Change management system integration

Excellent visibility:

- Synthetic monitoring from multiple locations
- Honeypot prefixes (canaries)
- Out-of-band verification
- Cross-organisation information sharing

### Correlation over perfection

Single signals are ambiguous. Correlation provides confidence.

Examples:

| Signal            | Alone              | With correlation                    |
|-------------------|--------------------|-------------------------------------|
| BGP UPDATE        | Normal operation   | + Short duration = Hijack           |
| Latency spike     | Network congestion | + Subprefix announce = Interception |
| Login from Russia | Remote worker      | + ROA deletion = Compromise         |

Wazuh strategy:

- Low-severity rules for single signals (level 3-7)
- Medium-severity for suspicious patterns (level 8-10)
- High-severity for correlated composite rules (level 11-15)

### False positives kill detection programs

Alert fatigue is real. If every alert is "probably nothing," analysts stop caring.

Managing false positives:

1. Tune thresholds - Latency spike at 100ms vs 200ms
2. Use allow-lists - Known CDNs, anycast providers
3. Require correlation - Don't alert on single ambiguous signal
4. Test with legitimate changes - Does routine maintenance trigger alerts?
5. Feedback loop - Analysts mark false positives, rules improve

Target rates:

- Critical alerts (L12+): <1 false positive per month
- High alerts (L10-11): <1 false positive per week
- Medium alerts (L7-9): <5 false positives per day
- Low alerts (L3-6): Informational, aggregated

### Speed matters

Attack windows are short. Detection must be faster.

Typical attack timelines:

- Fat-finger hijack: 10-120 minutes
- Subprefix interception: Hours to days
- Control-plane attack: Hours (but impact can be minutes)

Detection time targets:

- Signal generation: < 30 seconds (BGP feeds update frequently)
- Rule evaluation: < 5 seconds (Wazuh is fast)
- Alert delivery: < 30 seconds (email/webhook)
- Human response time: Variable (this is your bottleneck)

Total time from attack to human awareness: < 5 minutes for critical alerts

### Attribution is hard, detection is not

Do not conflate detection with attribution. Detection asks: "Did something suspicious happen?" Attribution asks: 
"Who did it and why?"

Example:

- Detection: ROA deleted, RPKI state flipped, victim route rejected (DETECTED in 2 minutes)
- Attribution: Was it insider? Nation-state? Supply chain? Accident? (May take weeks/months)

Focus on detection first. Attribution is forensics, legal, and diplomatic work.

### Assume breach

If you're high-value, assume someone's already tried to compromise your routing.

Defensive assumptions:

- Credentials are occasionally compromised
- Insiders may be malicious
- Supply chain is not fully trustworthy
- Zero-days exist in routing platforms

Implications:

- Defense in depth (not just perimeter)
- Continuous monitoring (not just IDS)
- Assume compromise detection, not just prevention
- Honeytokens to detect unauthorized access
