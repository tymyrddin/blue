# Domain Name System Security Extensions (DNSSEC)

DNSSEC adds digital signatures to DNS records, ensuring:

* Authenticity – The response actually came from the legitimate DNS server.
* Integrity – The data wasn’t tampered with in transit.
* Non-repudiation – The owner of the domain really published those records.

Without DNSSEC, DNS is vulnerable to:

* Cache poisoning – Attackers inject fake DNS records (like sending you to a scam bank site).
* Man-in-the-middle (MITM) attacks – Intercepting and altering DNS responses.
* DNS spoofing – Tricking systems into trusting malicious servers.

## Signing and verification

### Signing the records: The cryptographic seal of approval

* The domain owner generates public/private key pairs for their DNS zone.
* Each DNS record (A, AAAA, MX, etc.) gets a digital signature (RRSIG).
* These signatures are stored alongside the records in the DNS zone.

### The chain of trust 

From root to your domain DNSSEC works like a hierarchical notary system:

* Root Zone (.) signs the Top-Level Domains (TLDs) (.com, .net, etc.).
* TLDs sign the domains under them (e.g., example.com).
* Your domain signs its subdomains (mail.example.com, www.example.com).

If any link in this chain is broken, validation fails.

### Checking the signatures

When a resolver (like your ISP or Google’s 8.8.8.8) gets a DNS response:

* It fetches the public key (DNSKEY) for the domain.
* It verifies the signature (RRSIG) against the data.
* If everything checks out, the record is trusted. If not? Warning signs go up.

## DNSSEC’s challenges

1. Deployment is Still Patchy
   * Many domains do not yet use DNSSEC.
   * Some registrars make it unnecessarily hard to enable.
2. Complexity = Misconfigurations Galore
   * Key rollovers are sensitive to timing: a gap in coverage breaks the chain.
   * Human error (expired keys, bad signatures) can cause outages.
3. DNSSEC signs records but does not hide them. DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT) is needed for privacy.

## Trade-offs

Worth enabling for high-value domains (banking, government, corporate infrastructure) where DNS hijacking carries serious consequences, or anywhere DNS spoofing would be a significant exposure.

Less straightforward when the registrar does not support DS record submission, or when no one on the team is prepared to monitor key expirations. Key rollovers are sensitive to timing: a gap in coverage breaks the chain and causes validation failures downstream.
