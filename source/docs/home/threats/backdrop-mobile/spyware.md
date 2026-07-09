# Spyware

The malicious app rarely announces itself. The ones that do are easier to find.

Spyware arrives on a device disguised as something benign: a utility app, a game, a
document viewer, or in some cases a link that installs without explicit user action by
exploiting a browser or operating system vulnerability. Its purpose is to collect and
transmit data: credentials, messages, contacts, location, call records, audio, or images.
The financial motivation is the most common driver; the extracted data feeds fraud, account
takeover, or direct sale in credential markets.

This distinguishes it from stalkerware, which typically requires physical access to the
device and is deployed for personal surveillance. Both are
present on mobile platforms; the vectors and indicators differ.

## What spyware can access

The capabilities depend on what permissions it obtained, either granted by the user
unknowingly or acquired by exploiting a vulnerability:

* Keylogging and clipboard capture, which retrieves passwords and one-time codes as they
  are typed or pasted
* Microphone and camera access without visible indication
* SMS and messaging app content, including encrypted messages if the spyware intercepts at
  the application layer rather than the network layer
* Location history
* Stored credentials and autofill data from browsers

## How it arrives

* Malicious apps on official stores that passed initial review but were later found to
  carry payloads, or that added malicious functionality in a later update
* Apps distributed outside official stores, via direct APK download or third-party
  marketplaces, which face less scrutiny
* Phishing, smishing, or vishing that persuades the target to install something
* Zero-click exploits that deliver payloads via a message or notification without requiring
  any user interaction, typically used in targeted campaigns

## Signs worth investigating

* Battery draining faster than usual with no obvious cause
* Data usage significantly higher than expected, particularly background data
* The device running warm while idle
* Unfamiliar applications in the app list
* The device taking longer than usual to shut down

None of these are definitive on their own. They are reasons to look more carefully.

## Removal

Mobile antivirus tools detect some known spyware variants but are not reliable against
recent or targeted deployments. Factory reset is the most complete option, as it removes
the operating system environment the spyware was running in. Back up only contacts and
documents, as restoring from a full backup may restore the problem. Update the operating system before restoring, so any patched
vulnerability the spyware exploited is no longer present.
Last updated: 09 July 2026
