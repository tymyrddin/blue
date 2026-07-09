# When MFA gets bypassed

The widespread adoption of MFA is part of why MFA bypass has become a distinct attack category. When most
accounts lack a second factor, stolen passwords are enough. When most accounts have one, the authentication
layer itself becomes the target.

Multi-factor authentication substantially raises the cost of account compromise. It is not a complete
defence. Several bypass techniques are now in routine use, and they share a common pattern: they route around the cryptography by targeting the human in the authentication flow.

## MFA fatigue

Attackers with valid credentials send repeated push notification requests to the victim's authentication app.
The goal is volume: enough prompts that the recipient approves one out of exhaustion, distraction, or the
reasonable assumption that the notifications are a technical error. This works reliably enough that it has become
a standard technique in credential-access playbooks.

The response, beyond user awareness, is to switch to number-matching or to hardware keys. Both close the gap by
changing the nature of the authentication act.

## Man-in-the-middle via phishing proxies

Modern phishing kits intercept the authentication session in real time. The victim enters credentials on a
convincing replica of the legitimate site; the kit forwards them to the real site and relays back the MFA
prompt. The attacker captures the resulting session token and gains access before the session expires. OTP bots
automate this at scale, handling the timing and interception without manual involvement.

## Session token theft

Authentication tokens, stored in browser cookies, allow services to recognise returning users without
re-authentication. Stealing the cookie provides equivalent access to stealing the password, bypassing MFA
entirely because the authentication already happened. Infostealer malware routinely targets browser credential
stores for this reason.

## Hardware keys

FIDO2 hardware keys close a different gap. The key performs the authentication cryptographically, bound to the
specific domain, so a replayed or intercepted credential from a phishing site is not valid for the real site.
More importantly, the human is not making a decision: there is no push notification to approve, no code to
enter, no moment of uncertainty. The decision has been removed from the flow. That is the source of the
protection.

For accounts that matter, hardware keys address the failure mode that other MFA methods leave open.
Last updated: 10 July 2026
