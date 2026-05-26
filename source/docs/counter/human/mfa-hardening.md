# MFA hardening

Not all multifactor authentication is equal, and the gap between the weakest and strongest
implementations is the gap between a control that is bypassed routinely in phishing campaigns
and one that is not. Understanding the distinction is essential for making a recommendation
that will actually hold up when tested.

## Phishing-resistant MFA

FIDO2 hardware tokens and passkeys are the only forms of MFA that are technically resistant to
adversary-in-the-middle proxy attacks. The reason is that they bind the authentication response
cryptographically to the origin URL. A passkey registered to login.microsoftonline.com will not
authenticate against an Evilginx proxy, because the proxy's domain is not microsoftonline.com
regardless of how convincing it looks. The cryptographic check happens before the user does
anything, and it cannot be socially engineered.

Hardware security keys (YubiKey, Google Titan, and similar) implementing FIDO2 provide the
same binding property from a physical device. They are currently the strongest broadly deployable
MFA option and are the appropriate recommendation for high-value accounts: administrators, finance
teams with payment authority, and anyone whose access to cloud environments would be meaningful
to an attacker.

Passkeys stored in platform authenticators (Face ID, Windows Hello) provide equivalent
phishing resistance when properly implemented and are increasingly available across consumer
and enterprise platforms. The enrolment experience is substantially better than hardware tokens,
which helps with deployment at scale.

## TOTP and push notifications

Time-based one-time passwords and push notifications are significantly better than no MFA and
significantly worse than FIDO2. Both are vulnerable to real-time relay attacks and push-based
approaches are additionally vulnerable to MFA fatigue.

*A TOTP relay works like this: the victim enters their credentials into the attacker's proxy
site. The proxy forwards them to the real service, which requests the TOTP code. The victim
enters their current code. The proxy relays it before the 30-second window expires. The attacker
has an authenticated session. The entire exchange takes under 30 seconds and requires no access
to the victim's device.*

*The same attack against FIDO2 fails at the code step: there is no code to relay. The
authenticator responds to a challenge that includes the origin URL. Against the proxy's domain,
the origin is wrong, the authenticator does not respond, and authentication stops before the
attacker gains anything.*

Deploying them is still worthwhile as a
baseline, particularly for accounts where FIDO2 deployment is not yet feasible, because they
raise the cost of account compromise even if they do not eliminate it.

If push notifications are in use, enabling number matching (the user must confirm a number
displayed on the authenticator rather than simply approving a notification) largely eliminates
push fatigue attacks. This feature is available in Microsoft Authenticator, Duo, and others
and is worth enabling universally.

SMS OTP is worth treating as a legacy control and avoiding for new deployments. The attack
surface it presents through SIM swapping, SS7 abuse, and carrier social engineering is
substantial enough that the convenience it offers is not a reasonable trade-off for many
organisations.

## Enrolment and recovery

Hardening the authentication method accomplishes less if the process of registering or
replacing that method is weaker than the method it protects. Enrolment and recovery
paths are frequently the weakest point in an MFA deployment, and where technically
strong controls get bypassed without ever being tested.

The default in many identity providers allows adding a new authenticator using only a
password. An attacker who has stolen a password but does not have the associated device
can register their own TOTP app or phone number if enrolment requires no proof of the
existing factor. Requiring MFA satisfaction to reach the authenticator management page
closes this. In Entra ID, a Conditional Access policy targeting the "Register security
information" user action means enrolment itself requires the existing factor. Limiting
self-service enrolment to lower-risk methods while requiring administrator provisioning
for FIDO2 keys on high-value accounts narrows the surface further.

Temporary Access Pass (TAP) in Entra ID and equivalent mechanisms in other providers
are designed for provisioning and recovery when a device is lost. A TAP issued without
constraints becomes a standing bypass. Worth enforcing:

- Time limit in hours, not days
- Single-use rather than multi-use
- Issuance restricted to the Authentication Administrator role, not delegated to general
  helpdesk staff
- Alert on every TAP issuance event

A multi-use TAP with 24-hour validity issued by a helpdesk agent with broad delegated
permissions functions as a password reset that bypasses the MFA it is meant to restore.

Social engineering the helpdesk to reset MFA is frequently easier than defeating MFA
technically. Knowledge-based verification answers questions that are often publicly
available or guessable: security questions, the last four digits of a phone number, a
date of birth. A manager or secondary approver callback before any authentication method
change, out-of-band identity verification (video call, ID check) for accounts with
elevated access, and a documented procedure that cannot be waived under social pressure
or time constraints are the controls worth having.

*The MGM Resorts breach of 2023 followed this path. Attackers found a target employee on
LinkedIn, called the IT service desk impersonating that employee, and persuaded helpdesk
to reset their account credentials. Knowledge-based verification was the control that
failed. The authentication method being replaced was never tested.*

New authenticator registration and TAP issuance are worth alerting on: a new
authentication method registered outside business hours or from a device or IP not
previously associated with that account; a TAP issued for a privileged account; SSPR
completed and followed within minutes by a new authenticator registration, the two-step
recovery bypass pattern where email access allows completing a password reset before the
attacker registers their own device.

## Conditional access and anomaly detection

MFA is most effective as part of a conditional access policy that evaluates context, not just
credential validity. An authentication from an unfamiliar device, an unusual geography, or
outside normal hours can trigger step-up verification or review rather than proceeding
normally. A stolen session token or compromised account will often be used in conditions that
differ from the legitimate user's patterns, and those anomalies are detectable if the controls
are in place to detect them.

## Resources

- [FIDO Alliance](https://fidoalliance.org/)
- [Microsoft guidance on phishing-resistant MFA](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-strengths)
- [COUNTERING SIM-SWAPPING (pdf)](https://www.enisa.europa.eu/sites/default/files/publications/ENISA_REPORT-Countering_SIM_Swapping.pdf)
- [ENISA Threat Landscape](https://www.enisa.europa.eu/topics/cyber-threats/threat-landscape)
- [NIST SP 800-63 Digital Identity Guidelines](https://pages.nist.gov/800-63-4/)
