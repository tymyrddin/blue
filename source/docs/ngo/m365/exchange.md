# Exchange Online: email security

Email is the primary attack surface for non-profit organisations. Phishing, business email
compromise, and invoice fraud are the threat scenarios that cause actual financial and
reputational damage, and they all arrive via email.

## Anti-spoofing: SPF, DKIM, DMARC

These three DNS records work together to make it harder to send email that falsely claims to
come from your domain. An organisation that does not have all three configured correctly is
making it easier for attackers to impersonate it to donors, partners, and members.

SPF publishes a list of authorised mail servers for your domain. Check whether yours exists and
whether it covers all the systems that send email on your behalf, including the CRM, the email
marketing tool, and any other service that sends mail using your domain name.

[DKIM](../../diy/mailserver/dkim/index.rst) adds a cryptographic signature to outgoing mail that allows recipients to verify it was
sent by an authorised system. Exchange Online can be configured to sign outgoing mail. Check
whether it is.

[DMARC](../../diy/mailserver/dmarc/index.rst) tells receiving mail servers what to do with mail that fails SPF or DKIM checks. A DMARC
policy of none is better than no DMARC at all, because it enables reporting. A policy of quarantine
or reject is better still, but should be approached carefully: moving to quarantine or reject
without first reviewing DMARC reports for a few weeks will catch legitimate mail you forgot to
account for.

DMARC reports can be processed by free tools if you do not have a commercial service for it.
The reports are XML and unreadable in their raw form, but services like dmarcian or postmark's
free DMARC analyser will make sense of them.

## Anti-phishing policies

Exchange Online Protection includes anti-phishing capabilities. If you have Defender for Office
365 Plan 1 or higher, additional protection is available. Check what is configured under the
Microsoft 365 Defender portal, Email and collaboration, then Policies and rules, then Threat
policies.

The default anti-phishing policy provides some protection. A custom policy tuned for your
organisation, with impersonation protection for key individuals (the director, the finance
manager, the fundraising lead), provides more.

## External email warnings

A simple and effective configuration: add an external email warning banner to all email
arriving from outside the organisation. Something visible that tells the recipient this email
came from outside and they should be cautious about links and attachments.

This is a one-line mail flow rule in Exchange Online and one of the higher-value things you
can do for awareness without training.

## Shared mailboxes and forwarding rules

Shared mailboxes accumulate access over time. Check who has access to each one. Former
employees with access to a shared mailbox can continue receiving sensitive communications
after their personal account is disabled.

Automatic forwarding rules, where a user has set up their mailbox to forward all email to
an external address, are a data exfiltration risk. Check whether any exist. Consider blocking
external auto-forwarding at the tenant level, which is a single configuration setting and a
[Secure Score recommendation](https://learn.microsoft.com/en-us/defender-xdr/microsoft-secure-score).

## Related

- [Microsoft Secure Score](secure-score.md)
- [Defender for Office 365](defender.md)
- [Security awareness](../awareness/phishing.md)
