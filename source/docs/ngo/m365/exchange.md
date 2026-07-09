# Exchange Online: email security

Email is the primary attack surface for the Home, as it is for most non-profit organisations.
The Fabulist Incident began with a single email to the IT coordinator that appeared to come
from a legitimate vendor contact. The sending domain was fabulist-systerns.com, with a
Cyrillic character in place of a Latin one. Nothing in the email delivery chain flagged it.
It reached the inbox cleanly, was forwarded internally without scrutiny, and from there the
attacker had thirty-six hours before anyone noticed.

Email security configuration does not prevent every phishing attack. What it does is remove
the avoidable ones and provide the reporting data that makes the rest visible.

## Anti-spoofing: SPF, DKIM, DMARC

These three DNS records work together to make it harder to send email that falsely claims
to come from the Home's domain. An organisation without all three configured correctly makes
it easier for attackers to impersonate it to donors, members, and partner organisations.

SPF publishes a list of authorised mail servers for the domain. At the Home, this needs to
cover Exchange Online, Brevo (used for high-volume membership and fundraising campaigns),
and any other service that sends email using the Home's domain name. A common gap is an SPF
record that was set up when Exchange Online was provisioned and has never been updated to
include the marketing platform added later.

[DKIM](../../diy/mail/stack.md) adds a cryptographic signature to outgoing mail that allows recipients to verify it
was sent by an authorised system. Exchange Online can sign outgoing mail with DKIM. Check
whether it is configured and whether Brevo's DKIM signing is set up under Brevo's domain
authentication settings.

[DMARC](../../diy/mail/stack.md) tells receiving mail servers what to do with mail that fails SPF or DKIM checks.
The Home's DMARC record is currently in monitoring mode (policy: none), which was the
correct first step. It has been in monitoring mode for long enough that the reporting data
should by now give a clear picture of what legitimate mail is in scope. Moving to quarantine
is the next action. Staying in monitoring indefinitely provides no protection to the
recipients of spoofed mail and no reduction in the reputational exposure from domain abuse.

DMARC reports are XML and not readable in raw form. Services such as dmarcian or Postmark's
free DMARC analyser process the reports into a usable format. Review the reports for a month
before tightening the policy to confirm nothing legitimate is being missed.

## Anti-phishing policies

The default anti-phishing policy provides baseline protection. A custom policy tuned for
the Home provides more: impersonation protection for the Director, the Head of IT, and the
finance lead, whose names and roles are visible on the Home's website and are the most
likely targets for business email compromise. Configure these as protected users in a custom
anti-phishing policy in the Defender portal under Threat policies.

The Fabulist email impersonated a vendor contact. The
vendor name and contact details were correct because they were taken from the Fabulist
Systems website. There is no technical control that catches this entirely, but a policy that
flags lookalike domains and unexpected first-contact senders raises the visible signal.

## External email warnings

A visible banner on all email arriving from outside the organisation is a simple and
effective configuration. It tells the recipient that this email came from an external sender
and prompts a moment of consideration before they click anything.

This is a single mail flow rule in Exchange Online. It costs nothing and provides more
practical effect than some configurations that require significant effort to implement. The
Home does not currently have this configured.

## Shared mailboxes and forwarding rules

Shared mailboxes accumulate access over time. The volunteering@ and reception@ shared
mailboxes at the Home should be reviewed for who currently has access. Former employees
with access to a shared mailbox can continue receiving sensitive communications after their
personal Entra ID account is disabled. Access to shared mailboxes is not automatically
revoked by disabling the primary account.

Automatic forwarding rules, where a mailbox forwards incoming email to an external address,
are a data exfiltration risk and a governance gap. The security advisories from the Great
Ledger Consortium are currently being forwarded from a departed staff member's address to a
personal email account that the Home has no visibility over. This is not a hypothetical
risk. Check whether external forwarding rules exist across the tenant and consider blocking
external auto-forwarding at the tenant level, which is a single configuration setting and a
Microsoft Secure Score recommendation.

## Related

- [Microsoft Secure Score](secure-score.md)
- [Defender for Office 365](defender.md)
- [Security awareness](../awareness/vectors/phishing.md)
- [The Fabulist Incident](../data/breach-simulation.md)
- [Email delivery controls (SPF, DKIM, DMARC)](../../counter/human/email-hardening.md)
Last updated: 10 July 2026
