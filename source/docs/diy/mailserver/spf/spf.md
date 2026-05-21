# Necessary, but not enough alone

## Sender Policy Framework (SPF)

When someone sends an email, the recipient’s mail server performs a quick background check:

"Who is allowed to send mail for this domain?"

* The sending domain publishes an SPF record in DNS: a list of approved IP addresses and mail servers.
* Think of it like a VIP guest list for your email domain.

"Is this sender on the list?"

* The receiving server checks if the email’s originating IP matches one of the authorised senders in the SPF record.
* If it doesn’t match, the email fails SPF authentication, a red flag for potential forgery.

## On receipt

A failed SPF check does not always mean rejection; some servers mark the message as suspicious rather than dropping it outright. Passing SPF improves deliverability and reduces the chance of legitimate email being flagged as spam.

## Strengths and limitations

### Strengths

* Reduces email spoofing: stops random servers from impersonating your domain.
* Improves inbox placement: helps genuine emails avoid the spam folder.
* Simple to set up: just a DNS TXT record, no cryptographic infrastructure required.

### Limitations

* Breaks on forwarding: if a message is forwarded, the original SPF check may fail because the forwarding server is not in the original domain’s SPF record.
* Does not stop visible "From" spoofing: a scammer can still fake the display name (e.g., "PayPal scammer@evil.com").
* Requires maintenance: changing mail providers means the SPF record needs updating.