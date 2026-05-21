# STARTTLS, DANE, and MTA-STS

STARTTLS upgrades a plaintext SMTP connection to an encrypted one when both servers support it. The weakness is that support is negotiated opportunistically: a network-level attacker can strip the STARTTLS advertisement and force a plaintext connection. Neither server detects this.

## DANE and MTA-STS

Two mechanisms address this by binding the expectation of TLS to the domain itself rather than to a per-connection negotiation.

* DANE (DNS-Based Authentication of Named Entities) uses DNSSEC to bind TLS certificates directly to domain names, removing reliance on traditional Certificate Authorities.
* MTA-STS (SMTP Strict Transport Security) publishes a policy over HTTPS that instructs sending servers to require TLS and reject connections with invalid certificates.

Either approach closes the downgrade gap that opportunistic STARTTLS leaves open.

## DNS-based Authentication of Named Entities (DANE)

[DANE](dane.md) is an alternative to Public Key Infrastructure (PKI) Certificate 
Authorities. It complements [Domain Name System Security Extensions (DNSSEC)](../dnssec/dnssec.md), which needs to be 
implemented first. 

It is an Internet security protocol to allow X.509 digital certificates, commonly used for Transport Layer Security 
(TLS), to be bound to domain names using Domain Name System Security Extensions (DNSSEC). TLSA resource record is a 
type of DNS record.

## MTA Strict Transport Security (MTA-STS)

[MTA-STS](mta-sts.md) can be seen as a way to implement HTTP Strict Transport Security (HSTS) for SMTP. It is a 
mechanism to declare the ability to support TLS for SMTP and to specify whether sending mail servers refuse 
to deliver an email to an authoritative receiving mail server that does not offer TLS with a trusted X.509 certificate. 

MTA-STS solves the problem that TLS is entirely optional with SMTP. With MTA-STS, DNSSEC is not required but is 
recommended. A valid X.509 certificate is required. Self-signed certificates are not supported in combination with MTA-STS.
