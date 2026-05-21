# The mail security stack

Mail security controls divide into two layers: sender authentication, which addresses who sent the message, and
transport security, which addresses whether the channel itself can be trusted. Each layer has its own chain of controls,
and the controls within each chain cover different gaps.

## Sender authentication

[SPF](spf/spf.md), [DKIM](dkim/overview.md), and [DMARC](dmarc/dmarc.md) work together here. Each closes a gap the
others leave open.

### SPF

SPF verifies that the sending IP address is authorised to send mail for the envelope sender domain: the MAIL FROM
address used during SMTP negotiation. A domain publishes a list of authorised servers as a DNS TXT record; receiving
servers check the connecting IP against that list.

Two gaps remain. Forwarding breaks SPF: when a message is forwarded, the forwarding server's IP is not in the original
domain's record, so the check fails for a legitimate message. And SPF says nothing about the From header, the address
the recipient actually sees. An attacker can pass SPF while displaying a completely different domain in the From field.

### DKIM

DKIM attaches a cryptographic signature to selected headers and the message body. The signature is tied to the signing
domain, and the corresponding public key is published in DNS. Receiving servers verify the signature by fetching that
key.

DKIM survives forwarding because the signature travels with the message. Because it covers the message body and selected
headers, it confirms nothing was altered in transit.

One gap remains: the signing domain does not have to match the From header. A message signed by `attacker.com` can
display `From: bank@legitimate-bank.com` and pass DKIM. The signature proves the message came from somewhere authorised,
not that the sender is who they appear to be.

### DMARC

DMARC connects authentication to the From header. It requires alignment: either the SPF-authenticated domain or the DKIM
signing domain must match the domain in the From header. This is the control that closes the visible-spoofing gap that
SPF and DKIM individually leave open.

DMARC policy has three modes: `none` (data collection only), `quarantine`, and `reject`. A domain at `p=none` has
instrumentation but no enforcement. Progressing through the modes gradually, using aggregate reports to identify
legitimate mail streams that would fail, reduces the risk of blocking legitimate traffic in the process.

Two gaps remain even at `p=reject`. An attacker who can pass either SPF or DKIM independently, by using the same email
service provider as the victim domain for instance, also satisfies DMARC alignment. And display name spoofing is outside
DMARC's scope entirely: the From address can pass alignment while the display name reads "PayPal" or any other trusted
brand. DMARC checks the domain; it has no visibility into the label a mail client shows the user.

## Transport security

A message can pass all three sender authentication controls and still be intercepted in transit if the connection
between mail servers is not properly secured.

### STARTTLS

[STARTTLS](tls/overview.md) upgrades a plaintext SMTP connection to an encrypted one. The upgrade is opportunistic:
support is advertised in the SMTP session and either server can decline. A network attacker can strip the STARTTLS
advertisement before the sending server sees it, forcing a plaintext connection. Neither side detects this.

### DANE and MTA-STS

Both [DANE](tls/dane.md) and [MTA-STS](tls/mta-sts.md) close the STARTTLS downgrade gap, but by different means.

DANE publishes the expected TLS certificate, or a hash of it, in DNSSEC-signed DNS records. A sending server that
supports DANE fetches the TLSA record and rejects any certificate that does not match. Because the TLSA record is
DNSSEC-signed, an attacker cannot substitute a different record in transit. The dependency is DNSSEC: both domains need
it for DANE to apply, and deployment is still uneven.

MTA-STS publishes a policy file over HTTPS, declaring that the receiving domain requires TLS and specifying acceptable
certificates. Sending servers that support MTA-STS cache this policy and will not deliver to a server that cannot
present a valid, CA-signed certificate. No DNSSEC dependency, though self-signed certificates are not accepted.

The two are complementary. DANE is stronger where DNSSEC is deployed; MTA-STS covers the gap where it is not. A domain
that deploys both covers the most ground.

## Not addressed

Even with SPF, DKIM, DMARC at `p=reject`, DANE, and MTA-STS all in place, some attack surface remains.

A compromised or shared sending infrastructure can produce mail that passes all authentication legitimately, because the
controls verify the channel and the signing domain, not intent. An attacker using the same ESP as the victim domain,
with a properly configured account, clears every check.

Display name spoofing is invisible to these controls. The From address can be clean while the name shown to the user is
anything at all.

Content-based deception, a message that passes all checks but carries a phishing link or a social engineering payload,
is out of scope. That is the domain of filtering, not authentication.

The stack is a necessary foundation. It is not a ceiling.
