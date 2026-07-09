# SIM swapping

A mobile number is not just a contact address. For many accounts, it is the second factor:
the place where one-time codes arrive, where password resets are sent, where banks confirm
transactions. SIM swapping targets that number directly.

## How it works

The attacker contacts the mobile carrier, impersonating the account holder, and requests
that the number be transferred to a new SIM card. This is a legitimate service: carriers
do it routinely when customers get new phones or replace lost SIMs. The attacker's task is
to supply enough information to pass the carrier's identity verification.

The information required varies by carrier and country. Some verify with the last four digits
of a national identification number. Some ask for the account PIN. Some rely on personal
details (address, date of birth, recent call history) that can be assembled from public
sources, data broker records, or prior breaches. Some carrier staff can be socially
engineered past the verification step.

Once the number is transferred, the original SIM stops receiving calls and messages. The
attacker's SIM receives them instead. Any service relying on SMS for account recovery or
two-factor authentication is then accessible.

## Who is a target

The attacker needs a reason to want your number. Common ones: a high-value financial account
linked to that number (bank, cryptocurrency exchange), a social media account worth taking
for its username or audience, or a business account. Targeted campaigns sometimes research
a specific individual before executing. Opportunistic attacks focus on people identified in
breach datasets as having cryptocurrency holdings.

## Before an incident

* Contact your carrier and ask whether they offer a SIM lock or port freeze, sometimes
  called a port-out PIN or account security PIN. Not all carriers offer this, but where
  available it adds a step an attacker cannot easily bypass remotely.
* Switch to an authenticator app or hardware key for any account currently using SMS as
  a second factor. SMS is the weakest 2FA option specifically because of this attack.
* Use a separate, non-public number for account recovery where possible. A number not
  associated with your name in public sources is a harder target.

## After an incident

If your phone suddenly loses signal in a location where coverage is normally good, or stops
receiving calls and texts while others on the same network are not affected, contact your
carrier immediately from another device. Ask whether a SIM transfer was recently processed
on your account.

If a transfer occurred: request a reversal, change passwords on high-value accounts, revoke
active sessions, and contact any financial institutions that use that number for
authentication.
Last updated: 16 May 2026
