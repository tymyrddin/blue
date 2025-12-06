# The Problem with STARTTLS: A Flawed Upgrade

STARTTLS upgrades a plaintext SMTP connection to an encrypted one, if both servers support it. But it’s vulnerable to downgrade attacks, where a hacker tricks servers into communicating without encryption.
Two Solutions: DANE vs. MTA-STS

* DANE (DNS-Based Authentication) – Uses DNSSEC to bind TLS certificates directly to domain names, eliminating reliance on traditional Certificate Authorities. "Your cert is valid because DNS says so."
* MTA-STS (SMTP Strict Transport Security) – Forces encrypted connections (like HTTPS for email) and rejects servers with invalid certificates. "No TLS? No delivery."

TL;DR: "STARTTLS alone is like locking your door but leaving the key under the mat. DANE and MTA-STS bolt it shut. Pick one."

## DNS-based Authentication of Named Entities (DANE)

[DANE](dane.md) is an alternative to Public Key Infrastructure (PKI) Certificate 
Authorities. It complements [Domain Name System Security Extensions (DNSSEC)](../dnssec/dnssec.md), which must be 
implemented first. 

It is an Internet security protocol to allow X.509 digital certificates, commonly used for Transport Layer Security 
(TLS), to be bound to domain names using Domain Name System Security Extensions (DNSSEC). TLSA resource record is a 
type of DNS record.

## MTA Strict Transport Security (MTA-STS)

[MTA-STS](mta-sts.md) can be seen as a way to implement HTTP Strict Transport Security (HSTS) for SMTP. It is a 
mechanism to declare the ability to support TLS for SMTP and to specify whether sending mail servers must refuse 
to deliver an email to an authoritative receiving mail server that does not offer TLS with a trusted X.509 certificate. 

MTA-STS solves the problem that TLS is entirely optional with SMTP. With MTA-STS, DNSSEC is not required but is, 
of course, highly recommended. A valid X.509 certificate is required. Self-signed certificates are not allowed to be 
used in combination with MTA-STS.