# Smishing

A text message has one practical advantage over email: it arrives in a channel most people
trust more. Smishing exploits that trust. The message appears to come from a courier, a bank,
a tax authority, or a mobile network operator. It asks for something urgent. It provides a
link or a number to call.

## How it works

The basic pattern is a message containing either a malicious link or an instruction to take
an action that begins an attack. The link commonly leads to a credential harvesting page
designed to look like the impersonated service. Entering credentials there transfers them to
the attacker. Alternatively, the link delivers a malware payload, often exploiting browser or
system vulnerabilities to install without obvious prompts.

The delivery pretexts have become more specific over time. Parcel delivery notifications
("your package requires a fee"), HMRC or tax authority messages, bank fraud alerts, and
mobile carrier account warnings are the current standard patterns. Some campaigns run
conversational smishing: an initial message that seems benign, a response, then a gradual
escalation to a request. The extra exchange builds perceived legitimacy.

Callback phishing uses text messages that contain a phone number rather than a link. The
message reports a problem (a fraudulent transaction, an account suspension) and asks the
recipient to call. On the call, the attacker collects the information directly.

## What to look for

The indicators that hold across most variants:

* Unexpected urgency, especially around accounts, deliveries, or fees
* A link using a shortened URL or a domain that approximates the real one
* A phone number to call rather than a website address
* A request for information (card details, one-time codes, passwords) that the genuine
  organisation would already have or would not ask for by text

Legitimate courier companies, banks, and tax authorities generally do not initiate contact
by text and then ask for payment credentials or account verification through a link in that
same message.

## What to do

Do not click the link. Do not call the number in the message. If the message claims to be
from a service you use, navigate to that service directly through a browser or its official
app and check your account there. Report the message to the relevant national authority
before deleting it; in the UK, forward to 7726 (spells SPAM).
