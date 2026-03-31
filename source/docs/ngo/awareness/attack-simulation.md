# Attack simulation

The phishing programme is built entirely in-house using Gophish. Defender is never
touched. No bypass rules, no whitelisting of simulation infrastructure, no Advanced
Delivery exceptions. The emails are crafted to reach the inbox the same way a real
attacker's email would reach it: by using techniques that currently evade the filters.

This is the point. A simulation that only works because Microsoft has been told not to
filter it is not a simulation of a real attack. It is a simulation of an email. The
two are not the same, and training people to respond to the second does not prepare
them for the first.

The afternoon purple team session uses Gophish with a sandbox inbox on a machine where
Defender is running normally. Red team participants craft emails. The emails either get
through or they do not. If they do not get through, that is also a result: the red team
learns why, and the technique is refined. What reaches the blue team's inbox is what
would reach a real staff inbox.

The monthly programme works the same way. The security team selects a technique currently
observed in the wild, crafts a campaign in Gophish, tests it against a single test account
with Defender running, and deploys it to the staff population only once it has been
confirmed to land in the primary inbox without modification. If the technique stops working
because Defender has been updated, the security team selects a different technique. This
is not a maintenance burden. It is the work.

Keeping the simulation current requires threat intelligence. The security team needs to
know what is getting through organisational defences in the sector right now, not what
was getting through eighteen months ago when the simulation library was last updated.
Sources and a working method for translating threat intel into Gophish campaigns are in
the threat intelligence runbook.

The rationale for both decisions, why attacker-role training and why live defences, is
in the rationale page. Setup instructions for the session infrastructure are in the runbooks.

## Vectors

Understanding what the simulation is modelling matters as much as running it well. The
vectors pages cover the mechanics of each attack type, what makes them effective, and
what the simulation is designed to surface in each case.

- [Phishing](vectors/phishing.md)
- [Social engineering](vectors/social-engineering.md)
- [Volunteers and third-party access](vectors/volunteers.md)

## Runbooks

Step-by-step instructions for setting up and running the programme. Start with the session
run overview if this is your first time; the individual runbooks cover each component in
the order you would need them.

- [Session run](runbooks/session-run.md)
- [Blue team setup](runbooks/blue-team-setup.md)
- [Outlook report button](runbooks/outlook-report-button.md)
- [Gophish install](runbooks/gophish-install.md)
- [Gophish sending profile](runbooks/gophish-sending-profile.md)
- [Gophish landing page](runbooks/gophish-landing-page.md)
- [Gophish campaign](runbooks/gophish-campaign.md)
- [Display machine](runbooks/display-machine.md)
- [Threat intelligence](runbooks/threat-intel.md)
- [Advanced delivery](runbooks/advanced-delivery.md)
- [Simulation create](runbooks/simulation-create.md)
- [Simulation results](runbooks/simulation-results.md)
