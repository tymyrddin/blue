# Disabling sideloading

The official app stores, for all their limitations, apply some level of review before
distributing an application. Sideloading bypasses that review entirely. An app installed
from outside the official store may be what it claims to be, or it may carry a payload the
installer cannot see.

The delivery pattern is common: a link arrives via message, email, or website, inviting
installation of an updated or exclusive version of a known app. The installed file looks
functional. The malware component runs in the background. This is not a theoretical
pathway; it is one of the more reliable mobile malware delivery mechanisms in use.

## Android

Settings → Security → Install unknown apps

Review which apps currently have permission to install from unknown sources and disable it
for all of them. This permission is sometimes granted and forgotten during a legitimate
one-time installation.

## iPhone

Installation from outside the App Store requires either a developer profile (which users
typically do not have) or a process that involves explicit trust of an enterprise
certificate. The default state is already restrictive. If you have never deliberately
enabled sideloading, no action is needed.

## The exception

F-Droid is a curated repository of free and open-source Android applications. The apps
it distributes are auditable in a way that Play Store apps are not, because the source
code is accessible. Enabling sideloading specifically for F-Droid, while keeping it
disabled for all other sources, is a reasonable choice for users who prefer open-source
alternatives. The F-Droid client itself is the only installation from an external source
that then needs to remain permitted.

The principle behind the exception is also the principle behind the rule: the question is
not whether sideloading is categorically permitted or forbidden, but whether you have
enough information about the source to make a considered decision. For most sources and
most users, the answer is no.
Last updated: 16 May 2026
