# Post-attack hygiene

The attack has stopped. The damage has not. A compromised account may continue to provide
access long after the original incident if the attacker planted persistence: a forwarding
rule, a connected application, a recovery email or phone number they control. Changing the
password closes one door; checking what else changed closes the rest.

## Account recovery

For each account that was, or might have been, compromised:

1. Change the password from a clean device.
2. Check for email forwarding rules or filters you did not create.
3. Check connected applications (OAuth grants): remove anything unfamiliar.
4. Check recovery options: email address, phone number, backup codes. Replace any that
   were accessible to the attacker.
5. Review login history where available. Most email providers show recent sessions with
   device and approximate location. Sign out of all other sessions.

## Monitoring

[Have I Been Pwned](https://haveibeenpwned.com) allows you to check whether your email
address appears in known breach datasets. Setting up monitoring there means future breaches
are flagged without having to check manually.

If credentials were stolen, assume they will be tried against other accounts where the
same or similar password was used. Credential stuffing is automated and begins quickly.

## Credit freeze

If financial information was involved, contact your local credit bureaus and request a
freeze. This prevents new credit being opened in your name without your involvement.

* UK: Experian, Equifax, TransUnion
* Ireland: [Central Credit Register](https://www.centralcreditregister.ie/)
* EU: availability varies by member state; the relevant national consumer protection
  authority can advise
* US: Equifax, Experian, TransUnion (free, permanent until lifted)
* Australia: Equifax, illion, Experian

Monitor credit reports for at least 12 months. A freeze can be lifted temporarily if you
need to apply for credit.

## GDPR (EU and UK residents)

If the breach involved personal data held by a company or service, you have the right to
know what data was affected and may have grounds to request compensation. The relevant data
protection supervisory authority in your country handles complaints where the company does
not respond adequately.

The [ICO guidance on compensation claims](https://ico.org.uk/for-the-public/data-protection-and-journalism/taking-your-case-to-court-and-claiming-compensation/)
covers the UK position. EU residents can contact their national supervisory authority.

## Factory reset

Resetting a device removes most persistent malware but is not a substitute for the account
recovery steps above. If you plan to report the incident to authorities, do not reset until
you have been told to. The device may be needed as evidence.

Resetting erases local data. Restoring from a backup made after the compromise can
reintroduce the problem. Use the oldest clean backup available, or start from scratch and
reinstall applications manually.

## What the incident reveals

Cleaning up returns the system to a working state. It does not address the condition that
made the incident possible. A phishing email that worked did so because something made it
believable. A reused password that was breached was reused for a reason that felt acceptable
at the time. The incident points at a specific gap. Noting what that was, without assigning
blame, is what changes the odds next time.
