## Responsible disclosure considerations

If we discover vulnerabilities in commercial products during our testing, we have ethical obligations beyond just 
reporting to our client.

### Vendor notification

If the vulnerability is in a product used by other organisations:

1. Notify the vendor first (before public disclosure)
2. Provide sufficient detail that they can reproduce
3. Allow reasonable time for patching (typically 90 days)
4. Coordinate disclosure with vendor

### ICS-CERT coordination

For critical infrastructure vulnerabilities, notify the authority:

- They can coordinate with vendors
- They can issue advisories to other users
- They can help with responsible disclosure timeline

### Client notification boundaries

Our client needs to know about the vulnerabilities we found, but we should:

- Not provide full exploit code unless necessary
- Consider whether the report might be shared
- Redact sensitive details if report will be widely distributed
- Ensure exploits are not trivially weaponisable from report alone

At [UU P&L](https://red.tymyrddin.dev/docs/power/) for example, we discovered a zero-day vulnerability in a popular 
industrial firewall. The vulnerability allowed authentication bypass via a crafted HTTP request. We:

1. Notified the vendor immediately with proof of concept
2. Notified the Dept of Silent Stability (in the role of an ICS-CERT) with coordination details
3. Provided our client with detailed mitigation steps
4. Did not include full exploit code in the written report
5. Agreed on 90-day disclosure timeline with vendor
6. Published advisory after patch was available

The vendor patched within 45 days, we publicly disclosed at 90 days, and UU P&L received recognition for responsible 
disclosure. Everyone wins, except attackers who had a slightly smaller attack surface to work with.

## The balance of proof and safety

The fundamental tension in OT penetration testing proof-of-concept development is this: we need to prove that 
something dangerous is possible without actually doing the dangerous thing. It's like proving we could rob a bank by 
showing the vault's blueprints, demonstrating that we can pick the lock on a replica, and explaining our exit 
strategy, all without actually taking any money from the actual bank.

This requires more creativity than IT penetration testing, where "proof" often means "I actually did it and here's 
the data I exfiltrated". In OT, proof means "I could have done it and here's everything that makes that claim 
credible short of actually doing it".

The more evidence we can provide short of actually manipulating production systems, the better. Simulator 
attacks are better than theoretical descriptions. Videos are better than static screenshots. Detailed technical 
analysis is better than "trust me, this would work". But never, ever cross the line into actually doing something 
that could cause harm, no matter how certain we are that it would be safe. The moment something goes wrong, "I was 
sure it would be fine" stops being a defence and becomes evidence of negligence.

Document everything we can safely demonstrate, explain clearly what we can't safely demonstrate and why, and trust 
that if we have done our job properly, the stakeholders will understand the risk even without seeing production 
systems fall over. If they don't believe us without a live demonstration, they're not going to respond appropriately 
to the findings anyway, and demonstrating on production systems will not fix that particular organisational problem.
