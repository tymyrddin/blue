# Emergency lockdown

A lost or stolen phone is not just an inconvenience. It is a device with stored sessions,
saved passwords, SMS access for account recovery codes, and, in some cases, banking apps
in authenticated state. The threat model differs depending on what happened.

A lost phone, sitting on a train seat, is mostly a data exposure risk. A stolen phone, in
the hands of someone with intent and time, is closer to an account takeover risk. A phone
that has been compromised remotely is a different problem again and is not addressed by
erasing it.

## Set up before you need it

Remote locate and erase only works if it was enabled before the incident.

* Android: Settings → Google → Find My Device. Ensure location access is enabled and
  the feature is turned on.
* iPhone: Settings → your name → Find My → Find My iPhone. Enable both Find My iPhone
  and Send Last Location.

## If the phone is lost or stolen

Locate first, then decide:

* Android: [google.com/android/find](https://www.google.com/android/find/)
* iPhone: [icloud.com/find](https://www.icloud.com/find)

If there is a realistic chance of recovery (left somewhere, likely to be turned in), use
Play Protect or Find My to mark it as lost and display a contact message on the screen
before erasing. Once erased, the location data is gone.

If it is clearly stolen and recovery is unlikely, select Erase Device. This returns the
phone to factory state and signs out of associated accounts. File a report with local
police and the mobile carrier.

## What erasure does and does not do

Factory reset removes the data on the device. It does not revoke active sessions on
accounts that were logged in at the time. After erasing, sign into your email, cloud
storage, and any financial apps from another device and terminate other active sessions
there. Change passwords on accounts where saved credentials were stored on the phone.

If the phone was used for SMS-based two-factor authentication, consider whether accounts
using that number as a recovery method are now at risk via SIM, especially if the phone
was stolen by someone who knows you.
