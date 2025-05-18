# Necessary, but not enough alone

## How Sender Policy Framework (SPF) works

When someone sends an email, the recipient’s mail server performs a quick background check:

"Who is allowed to send mail for this domain?"

* The sending domain publishes an SPF record in DNS—a list of approved IP addresses and mail servers.
* Think of it like a VIP guest list for your email domain.

"Is this sender on the list?"

* The receiving server checks if the email’s originating IP matches one of the authorised senders in the SPF record.
* If it doesn’t match, the email fails SPF authentication—a red flag for potential forgery.

"What happens next?"

* A failed SPF check doesn’t always mean rejection (some servers just mark it as suspicious).
* But passing SPF boosts deliverability, reducing the chance of legitimate emails being mistaken for spam.

## The good, the bad, and the ugly of SPF

The Benefits

* Reduces email spoofing – Stops random servers from impersonating your domain.
* Improves inbox placement – Helps genuine emails avoid the spam folder.
* Simple to implement – Just a DNS TXT record (no complex crypto).

The Limitations

* Breaks on forwarding – If an email is forwarded, the original SPF check may fail (since the new sender isn’t in the original domain’s SPF record).
* Doesn’t stop visible "From" spoofing – A scammer can still fake the display name (e.g., "PayPal scammer@evil.com").
* Requires maintenance – If you change mail providers, you must update your SPF record.