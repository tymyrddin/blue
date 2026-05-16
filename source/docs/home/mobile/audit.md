# Audit app permissions

Apps frequently request more access than they need. A flashlight does not need location data. A game does
not need microphone access. Reviewing permissions periodically removes exposure that accumulated during
installation.

## How to

* Android: Settings → Apps → select the app → Permissions → revoke unnecessary ones
* iPhone: Settings → Privacy & Security → review each permission category

## Patterns worth questioning

* Weather apps requesting SMS access
* Games requesting microphone or camera
* Any app labelled "free" with an unusual number of trackers

For apps that are genuinely untrusted but sometimes needed: Shelter (Android) can sandbox them in a
separate work profile, limiting their access to the main device environment.
