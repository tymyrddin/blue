# Domain Name System Security Extensions (DNSSEC)

DNSSEC adds digital signatures to DNS records, ensuring:

* Authenticity – The response actually came from the legitimate DNS server.
* Integrity – The data wasn’t tampered with in transit.
* Non-repudiation – The owner of the domain really published those records.

Without DNSSEC, DNS is vulnerable to:

* Cache poisoning – Attackers inject fake DNS records (like sending you to a scam bank site).
* Man-in-the-middle (MITM) attacks – Intercepting and altering DNS responses.
* DNS spoofing – Tricking systems into trusting malicious servers.

## How DNSSEC works (without making your brain melt)

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

## The ugly truth: DNSSEC’s challenges

1. Deployment is Still Patchy
   * Many domains still don’t use DNSSEC (looking at you, facebook.com).
   * Some registrars make it unnecessarily hard to enable.
2. Complexity = Misconfigurations Galore
   * Key rollovers must be timed perfectly—or the domain breaks.
   * Human error (expired keys, bad signatures) can cause outages.
3. DNSSEC signs records but doesn’t hide them. For privacy, you still need DNS-over-HTTPS (DoH) and DNS-over-TLS (DoT)

## Should you use DNSSEC?

Yes, if:

* You run a high-value domain (banking, government, corporate).
* You want to prevent DNS hijacking & spoofing.
* You’re okay with extra maintenance (key management).

No, if:

* Your registrar doesn’t support it (check first!).
* You’re not prepared to monitor key expirations.
* You think "DNS troubleshooting" sounds like a nightmare.
