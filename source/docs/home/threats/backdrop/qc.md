# Quantum computing and encryption

Quantum computing will, at sufficient scale, be able to break the asymmetric encryption that underlies most
internet security today: RSA, elliptic curve cryptography, and the key exchange mechanisms that protect HTTPS,
VPNs, and messaging apps. This is not in dispute. The question is timing, and the honest answer is that nobody
knows with confidence.

Current quantum computers are far from the scale needed for cryptographically relevant attacks. The error rates
remain high, the qubit counts are far below what "harvest now, decrypt later" attacks on modern key sizes would
require, and progress has been slower than some early forecasts suggested. Practical quantum attacks on current
encryption are likely years away, with significant uncertainty in either direction.

## Harvest now, decrypt later

The threat that is not theoretical is data collection against a future capability. Actors with sufficient
storage are plausibly harvesting encrypted communications now, with the intention of decrypting them when
quantum capability matures. For data that retains value over a long time horizon, this is a current risk.
For most home users, this applies primarily to long-term sensitive communications.

## Post-quantum cryptography

NIST has published post-quantum cryptographic standards following a multi-year evaluation process. These are
designed to be resistant to quantum attacks. Adoption across software, protocols, and hardware is the slow
part. Some password managers and VPN providers have already begun migrating to post-quantum algorithms.

The practical advice for home users is to watch for and apply software updates that include post-quantum
migration, prefer end-to-end encrypted applications that are actively maintaining their cryptographic
implementations, and be cautious of vendor claims about "quantum-proof" products that predate the NIST standards.

## Early access

When quantum capability becomes practically relevant for cryptographic attacks, early access will be limited
to nation-states and large, well-resourced organisations. Democratisation of the capability, as has happened
with other powerful technologies, is a later-stage concern. The more immediate risk is state-level actors
targeting high-value encrypted data they are already collecting.
Last updated: 16 May 2026
