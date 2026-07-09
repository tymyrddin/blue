# Infostealer as a service

Infostealers collect credentials, session tokens, and stored data from infected devices and send them to the
operator. The as-a-service model means that the malware development, collection infrastructure, and data
management are provided by one party and the campaigns are run by another.

## Common delivery vectors

Macro-enabled documents are a longstanding vector. A document arrives with a plausible pretext, the user enables
macros as prompted, and the infostealer installs. The technique is old enough that some mail providers block
macro-enabled attachments by default; it remains effective where that filtering is absent.

Impersonation via search advertising has become more prevalent. Attackers clone the download pages of
widely-used applications, buy search advertising for the brand name, and reach users who are actively searching
for legitimate software. The user downloads from what appears to be the official site.

App store infiltration places corrupted applications into official marketplaces. Detection and removal
eventually happen, but downloads occur in the interim.

## What gets stolen

Infostealers typically target browser credential stores, where passwords and session cookies are kept;
cryptocurrency wallets; authentication app data; and files matching patterns associated with sensitive content.
The collected data is packaged and sent to the operator, who may use it directly or sell it.

Stolen session tokens bypass MFA entirely because the authentication already occurred. This is the mechanism
behind many account takeovers that puzzle victims who had multi-factor authentication enabled: the attacker
never needed to authenticate, only to use an existing authenticated session.

## For home users

Browser password managers are a common target. A dedicated password manager with local or audited cloud storage
is a more defensible position. Keeping browsers updated closes many of the vulnerabilities that infostealers
use for initial access to credential stores.
Last updated: 16 May 2026
