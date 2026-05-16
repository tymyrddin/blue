# Madware

Madware is mobile adware: software installed on a phone, often without the user's explicit
knowledge, whose purpose is to serve advertising and extract data that supports it. The
distinction from general malware is mainly one of intent: the goal is monetisation through
advertising rather than credential theft or financial fraud, though the two overlap more than
the category implies.

## How it arrives

Madware typically comes bundled with another application. The host app may be entirely
functional; the madware component runs alongside it, collecting data and displaying ads.
It is found on third-party app stores and, periodically, on official ones: apps that passed
initial review but were updated later to include advertising SDKs with behaviours that
crossed into data collection without consent. Free-to-install apps in categories like
utilities, flashlights, battery monitors, and casual games have historically been common
carriers.

## What it collects

Most madware components collect some combination of:

* Location data, used to target ads and sold to data brokers
* Device identifiers (advertising ID, IMEI, or similar)
* Contacts and call logs
* Browsing history within the device's browser and sometimes within apps
* Details of installed applications

The data flows into ad networks and, in practice, to whoever purchases it from those networks.
The boundary between "targeted advertising data" and "tracking information with broader
uses" is not enforced by the data itself.

## Signs worth looking for

* More advertising appearing within apps that previously showed little or none
* Push notifications from apps that have no reason to send them
* The battery draining faster, or the device running warmer, than usual during periods of
  low activity
* Data usage higher than expected

## Removing it

Identifying the source app is the first step. If data usage or battery consumption is the
indicator, checking which apps are responsible in device settings (Android: Settings →
Battery and Settings → Network; iPhone: Settings → Battery and Settings → Cellular) can
point at the carrier.

Uninstalling the app stops the behaviour in most cases. If the app is one you want to keep,
looking for an alternative in the same category without the advertising SDK is often
possible; F-Droid catalogues open-source alternatives to many common applications.

For Android devices, [exodus-privacy.eu.org](https://exodus-privacy.eu.org) provides an
analysis of the advertising and tracking SDKs present in applications on the Play Store,
which makes it possible to check an app before installing it.
