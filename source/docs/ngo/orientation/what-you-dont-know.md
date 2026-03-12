# What you do not know yet

The hypotheses in the previous page are useful scaffolding. They are not facts.

Arriving as the first architect in an organisation that has been running without one is an
epistemological problem before it is a technical one. You do not know what you do not know.
The work is to close that gap deliberately: identify the open questions, prioritise by risk,
and find the answers before something forces you to find them in a worse way.

## Identity and access

How many user accounts are in the Entra tenant? How many global administrators? Are there
guest accounts with no record of who invited them, shared accounts with no named owner, or
accounts for staff who left two years ago? Is MFA enforced or merely enabled? These answers
shape everything that follows: the Conditional Access work, the offboarding process, the
privilege review. You cannot meaningfully assess the access posture without them.

## Infrastructure boundary

Is there on-premise infrastructure? If so, what: a file server, an application server,
a managed network device, something older? Is there a network diagram that is less than
three years old? Who maintains the physical infrastructure and who has access to it? The
boundary between on-premise and cloud is not just a technical question. It is a question
about where the risks are and who is responsible for them.

## The membership and CRM system

Which system holds the 200,000 member and donor records? Who has administrative access,
and is that list current? Where is the data hosted, and in which country? Does a current
Data Processing Agreement exist with the vendor? This system is the highest-value data
store in the organisation. The answers to these questions determine the priority and shape
of the work in the applications section.

## Financial systems

What software handles bookkeeping and payment processing? Is it integrated with the CRM,
and if so, how? Who has access? Where does the data live? Financial data and donation
records attract the same threat actors as the membership data, and the integrations between
financial systems and other tools are among the most common sources of undocumented data flows.

## HR and provisioning

Which HR system is in use? Does it feed Entra ID automatically, or are joiners and leavers
managed manually? Who owns the offboarding process, and is there a process at all? An
organisation that has been growing organically may have accumulated a set of informal
practices that work most of the time, and that break silently when they do not.

## Application inventory

Does an application register exist in any form? What OAuth consent grants are currently
active in the M365 tenant, and which applications have delegated permissions? The answers
to these questions may surprise you. Applications granted permissions during a campaign
three years ago may still be running quietly against current data.

## AI adoption

Who is using AI tools, and which ones? What data is going into them? The answers come from
conversations, not from a technical audit. People are often willing to share this if the
conversation is framed as trying to understand what is useful rather than looking for
violations. The answers shape the AI governance work and inform how urgently it is needed.

## Security posture baseline

Has there ever been a security incident: a compromised account, a data breach, ransomware,
an accidental public share? Have backups ever been tested to confirm they actually restore?
Is there a disaster recovery plan, however informal? These questions establish the baseline.
An organisation that has had an incident and learnt from it is in a different position from
one that has been fortunate so far.

## On timing

Not all of these answers will arrive in the first week. Some will take months to surface.
A few may still be open at six months, because the person who knows is unavailable, or the
vendor is slow to respond, or the system is old enough that the documentation simply no
longer exists. That is normal. The goal is not to know everything before starting. It is to
know which gaps carry the most risk, and to work those first.

The thing in the basement has been here for twelve years. Nobody knows exactly what it is.
The difference between you and your predecessors is that you are going to write that down.

## Related

- [Reading the environment](reading-the-environment.md)
- [The Entra ID audit](../foundation/entra-id.md)
- [Application landscape](../applications/landscape.md)
- [GDPR obligations](../data/gdpr.md)
