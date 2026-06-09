# Inbound email filtering

The filtering layer sits between the internet and the inbox. Domain authentication
controls (SPF, DKIM, DMARC) address whether a message was sent by an authorised system;
filtering addresses what the message contains, how the sending domain behaves, and whether
the delivery pattern looks legitimate. The two layers are complementary: authentication
without filtering still delivers malicious content from attacker-owned authenticated
domains; filtering without authentication still delivers spoofed messages from domains
with no authentication records at all.

## Display-layer anti-spoofing

Display name spoofing produces messages where the From header address passes
authentication (the attacker controls attacker.com and has valid SPF and DKIM) but
the display name reads "Finance Team" or "IT Helpdesk". Every authentication check
passes. The recipient sees a recognisable name attached to an address they have never
communicated with. Detection requires the gateway to check whether a display name matches
a known internal identity while the sending domain does not.

Lookalike domains go a step further: the domain itself is constructed to resemble the
target organisation's domain. Homograph substitution uses characters from other scripts
that are visually identical to Latin letters (Cyrillic 'а' in place of Latin 'a');
hyphen-inserted variants add or rearrange hyphens (company-name-invoices.com); TLD swaps
use .net or .org where recipients expect .com. Sender intelligence and lookalike domain
detection policies flag messages from domains registered recently with structural
similarity to an organisation's own domain.

External sender warnings: a visible label on all email arriving from outside the
organisation is among the simplest effective configurations available. It costs nothing,
deploys as a single mail flow rule on most platforms, and provides a visible prompt
before the recipient clicks anything. It does not stop determined attackers; it removes
the category of attack where the recipient did not notice the email was external.

First-contact safety tips mark email from senders the recipient has never exchanged
messages with. On targeted attacks where the attacker is impersonating a new contact
rather than a known one, this is a higher-signal banner than the generic external
sender warning.

## Gateway policy

Inbound spam and bulk filtering assigns a confidence score to each inbound message and
routes it to inbox, spam folder, or quarantine based on thresholds. Most gateways
distinguish general spam scoring from bulk email classification, applying stricter handling
to high-volume commercial senders than to individual messages with the same score. Tightening
thresholds for high-risk recipients (finance, accounts payable, executives whose contact
details are publicly listed) is straightforward and worth applying before a targeted campaign
arrives rather than after.

Allow-list risk is underappreciated. Gateway allow lists that exempt senders or domains
from filtering are a frequent bypass point. A vendor domain added to a gateway allow list
during a support engagement, and never removed, bypasses every filtering rule in the
policy for all time. Permissive allow entries are high-value targets for attacker-
controlled infrastructure: a message sent from an allowed domain arrives in the inbox
with no warnings, no sandboxing, no link inspection. Allow lists are worth reviewing
for entries that are broad, old, or no longer actively managed.

Inbound DMARC enforcement: a receiver applying the sending domain's published DMARC
policy is a distinct configuration from the sending domain publishing it. Not all
gateways enforce inbound DMARC by default, even when the domain publishes `p=reject`.
A gateway that does not enforce inbound DMARC delivers spoofed messages from domains
that have explicitly requested rejection.

## Attachment controls

File type filtering blocks executable attachment types before they reach the inbox.
The effective list covers .exe, .bat, .cmd, .ps1, .vbs, .js, .wsf, .hta, and variants.
The list requires periodic review: attacker delivery formats shift in response to
what filtering catches. OneNote files (.one) emerged as a delivery vector after VBA
macros were disabled by default in Microsoft 365; ISO and IMG container files appeared
when zip-based delivery was filtered more aggressively.

Office macro controls address files that pass file type filters but carry executable
content. Blocking macros in email attachments entirely, or restricting execution to
macros signed by a trusted publisher, is effective independent of user awareness.
The default-disabled macro policy Microsoft introduced in 2022 removed much of this
vector for M365 users running current builds; environments that override the default or
run older client versions remain exposed.

Attachment sandboxing opens the attachment in an isolated environment and observes its
behaviour before delivery. A PDF that drops an embedded object, a Word file whose macro
reaches out to a pastebin URL, an HTML attachment that loads a credential-harvesting
form: static analysis and file type filtering miss these; detonation catches them.

Two gaps are worth understanding. Password-protected archives cannot be detonated without
the password: an attacker who delivers a ZIP file and includes the password in the email
body defeats most sandbox configurations. Some advanced sandboxes attempt to extract
passwords from the email body and use them to open the archive, but this capability is
not universal. Sandbox evasion techniques exist: delayed execution,
checks for mouse movement, virtual machine detection. Sandboxing raises the cost and
narrows the delivery window. It does not close the gap.

## Link inspection

URL rewriting replaces clickable links in email with proxy URLs. When the recipient
clicks, the gateway checks the destination in that moment before redirecting. This covers
post-delivery weaponisation: a link that is benign when the message arrives and is
weaponised hours later bypasses scan-at-delivery entirely. Time-of-click inspection is
the correct comparison point, not whether scanning happened at all.

QR codes in email body or attachments encode URLs as images. No clickable hyperlink is
present in the message, so link filtering has nothing to inspect. The URL is only decoded
when a device's camera scans the code, after which the device fetches the destination
directly, typically on a mobile device outside the corporate network and outside the
proxy infrastructure. Some modern gateways perform OCR-based QR code extraction from
images and check the decoded URL; coverage is inconsistent and this remains an active
gap in most gateway configurations.

## Tenant-level controls

Outbound spam policy: rate-limiting and automatic quarantine for suspicious outbound
email detects compromised accounts being used to send spam or phishing at scale. The
signal is volume and recipient patterns inconsistent with the account's normal behaviour.
Acting before significant volume exits prevents blocklist entries and protects domain
reputation for legitimate outbound mail.

External auto-forwarding: automatic rules that forward inbound mail to an external
address are a data exfiltration path and, in the case of compromised accounts, an
attacker persistence mechanism. The attacker sets a forwarding rule and continues
receiving mail from that account indefinitely without further access. Blocking external
auto-forwarding at the tenant level prevents new rules from being created. Existing rules
require an explicit audit; the setting that blocks new rules does not remove old ones.

*A contractor sends a Word document as an email attachment. The gateway sandbox
detonates it: the macro reaches out to an external URL for a second-stage payload. The
message is quarantined before delivery. Three days later, the same macro arrives inside
a password-protected ZIP file with the password in the email body. The sandbox does not attempt password
extraction from the email body. The message is delivered with an external sender
banner. The user opens the archive, enters the password, and enables the macro.*

## Related

- [How a resource-constrained NGO runs this filtering layer](../../ngo/m365/defender.md)
