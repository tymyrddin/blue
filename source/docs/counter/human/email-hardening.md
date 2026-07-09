# Email delivery controls

Domain authentication and SMTP transport hardening address the delivery layer rather than the content of user behaviour. SPF, DKIM, and DMARC together establish whether email claiming to originate from a domain was authorised by that domain; MTA-STS and TLS-RPT constrain how SMTP connections are made. Together they close the attack surface that makes direct domain spoofing trivially easy without them.

The gap between having records and having effective controls is considerable. Many organisations have SPF and DKIM records and a DMARC record at p=none. None of that configuration provides enforcement.

## SPF

An SPF record lists the IP addresses and sending services authorised to send email on behalf of a domain. Receivers that check SPF reject or flag messages from sources not in the list. The control is only meaningful when paired with DMARC enforcement: SPF alone does not prevent spoofing of the header From address, which is what recipients see.

The `-all` qualifier rejects everything not listed. The `~all` qualifier, a softfail, flags it but allows delivery. Using `~all` is common during initial deployment and worth tightening once the authorised sender list is stable.

SPF has a limit of 10 DNS lookups per evaluation. Include chains from third-party senders are the common cause of exceeding this limit: each include directive typically resolves to further lookups. Exceeding 10 returns permerror, and receivers that check SPF strictly treat permerror as a failure. Adding a fourth or fifth marketing platform to an existing SPF record may silently break authentication for all senders if the lookup chain is already long.

## DKIM

DKIM adds a cryptographic signature to outbound messages, tied to a public key published in DNS. Receivers verify the signature against the DNS record. If the message was modified in transit or the signing key is not valid for the domain, verification fails.

2048-bit keys are the current minimum for new deployments. 1024-bit keys have been deprecated in most guidance and some receivers no longer accept them. Sending platforms that sign with 1024-bit keys on behalf of a domain are worth pressing to upgrade; the key length is set by the platform, not the domain owner, when delegation is used.

Key rotation is worth scheduling. A DKIM private key that has not been rotated since initial setup is effectively a long-term credential: an attacker who exfiltrates it can sign new fraudulent emails that pass DKIM validation under the domain's identity. Rotation involves generating a new key pair, publishing the new public key under a new selector, updating the sending platform, and retiring the old selector after propagation.

The `l=` body length parameter permits partial signing of the message body, allowing content to be appended without invalidating the signature. Omitting it from DKIM signatures means the entire body is covered: any modification invalidates the signature.

## DMARC

DMARC ties SPF and DKIM to the header From address that recipients see, and provides a policy for how receivers handle messages that fail. The policy progression runs from `p=none` (report only, no enforcement) through `p=quarantine` (deliver to spam folder) to `p=reject` (do not deliver).

A DMARC record at `p=none` generates aggregate reports but provides no protection. The drift is common: a domain publishes `p=none` as the first step toward enforcement, begins receiving aggregate reports, and never advances past it.

The aggregate reporting address (`rua=`) receives XML summaries from participating receivers, showing which sources sent mail as the domain and whether they passed authentication. Processing those reports is what makes the transition to `p=quarantine` and `p=reject` tractable: a spike in failures from previously-unseen source addresses is usually either an active spoofing campaign or an undocumented sending system. The reports do not read themselves.

*An organisation publishes DMARC at p=none in early 2024. Aggregate reports arrive weekly and go unreviewed. In late 2025, a spoofing campaign impersonating the domain's finance team targets the organisation's suppliers, requesting bank account changes. The campaign runs for six weeks before a supplier calls to query a payment. The DMARC aggregate reports from that period show thousands of failures from infrastructure the organisation does not recognise. The data was there throughout.*

RFC 7489 specifies that subdomains inherit the apex DMARC policy when no `sp=` tag is present. An explicit `sp=reject` is worth adding for clarity and to avoid variation across receivers in how they interpret the inheritance rule.

## BIMI

BIMI (Brand Indicators for Message Identification) attaches a brand logo to authenticated
email in supporting inbox clients including Gmail, Apple Mail, and Yahoo Mail. The logo
appears next to the sender name before the message is opened.

The prerequisite is DMARC at `p=quarantine` or `p=reject`. BIMI is not available to
domains still at `p=none`; the requirement is deliberate. The practical value is inbox
presence and brand recognition for recipients; the security forcing function is the
DMARC enforcement it requires. An organisation that deploys BIMI has necessarily moved
past monitoring mode.

The DNS record is published at `default._bimi.<domain>` with a `v=BIMI1` tag, an `l=`
tag pointing to an SVG logo file hosted over HTTPS, and optionally an `a=` tag referencing
a Verified Mark Certificate. A VMC, issued by Entrust or DigiCert following trademark
verification, adds a blue verified checkmark in Gmail and Apple Mail alongside the logo.
Self-asserted BIMI without a VMC is honoured by some clients and ignored by others;
the major clients that matter for most domains require a VMC for the full display.

## MTA-STS and TLS-RPT

SMTP servers negotiate TLS via STARTTLS, which is opportunistic: a network attacker able to intercept SMTP connections can strip the STARTTLS offer and force a plaintext connection. MTA-STS closes this by publishing a policy that receiving servers cache, instructing senders to require TLS and reject connections that cannot establish it.

The MTA-STS policy file lives at `https://mta-sts.<domain>/.well-known/mta-sts.txt`. The DNS record at `_mta-sts.<domain>` signals to senders that a policy exists and provides a version identifier for cache invalidation. Policy modes follow the same progression as DMARC: testing mode logs failures without rejecting connections; enforce mode requires TLS and rejects connections that cannot establish it.

TLS-RPT, published at `_smtp._tls.<domain>`, requests that senders report TLS delivery failures and MTA-STS policy failures. Those reports surface downgrade attempts and misconfigured connectors before they become undetected plaintext flows.

## Third-party sender management

Marketing platforms, ticketing systems, and helpdesk tools often send as the organisational domain. Each adds entries to the SPF record. Auditing the record against the sending services actually in use, and removing entries for services no longer active, is straightforward and worth doing periodically.

A subdomain strategy isolates third-party senders from the primary domain. Sending marketing email from a dedicated subdomain keeps the primary domain's SPF record clean and limits the blast radius if a third-party platform is compromised or sends spoofed messages. Separate DMARC and SPF records for the subdomain cover it explicitly.

DKIM delegation to SaaS platforms gives those platforms signing authority for the domain. The key length used is set by the platform. Platforms that still default to 1024-bit signing keys are worth flagging during vendor reviews.

## Resources

- [RFC 7489: DMARC](https://datatracker.ietf.org/doc/html/rfc7489)
- [RFC 8461: MTA-STS](https://datatracker.ietf.org/doc/html/rfc8461)
- [RFC 8460: TLS-RPT](https://datatracker.ietf.org/doc/html/rfc8460)
- [DMARC.org](https://dmarc.org/)
- [dmarcian SPF surveyor](https://dmarcian.com/spf-survey/)

## Related

- [How a resource-constrained NGO configures this in Exchange Online](../../ngo/m365/exchange.md)
Last updated: 10 July 2026
