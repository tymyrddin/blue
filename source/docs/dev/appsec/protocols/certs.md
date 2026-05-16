# Certificate management

A TLS certificate does two things: it binds a public key to a domain name, and it carries a signature from a
Certificate Authority (CA) that the client already trusts. Everything downstream of TLS security depends on both
of these properties holding. [Certificate reconnaissance](https://red.tymyrddin.dev/docs/in/network/notes/recon.html)
is often an attacker's first step; the same visibility that makes certificates useful also makes them a source
of intelligence.

## Certificate chain validation

A TLS handshake presents a chain: leaf certificate, intermediate CA, root CA. Browsers carry a list of trusted
root CAs. The root CA signed the intermediate; the intermediate signed the leaf. The chain is only as useful as
its completeness: if the server omits the intermediate certificate, some clients will fail to validate even
though the root is trusted, because the client has no way to bridge from the leaf to a root it knows.

Verifying the chain as presented by the server:

```bash
openssl s_client -connect host:443 -showcerts </dev/null 2>/dev/null | openssl x509 -noout -text
```

The full chain (leaf and all intermediates, but not the root) appears in the `ssl_certificate` directive for
nginx and `SSLCertificateChainFile` for Apache.

## CAA DNS records

Certification Authority Authorisation (CAA) records specify which CAs are permitted to issue certificates for a
domain. A record of the form:

```text
example.com. CAA 0 issue "letsencrypt.org"
```

instructs compliant CAs that only Let's Encrypt may issue certificates for `example.com`. Any other CA that
receives a certificate signing request for the domain is required to check and refuse. This limits the blast
radius of a compromised CA: a CA that issues certificates it is not authorised to issue is visible in Certificate
Transparency logs, and a CAA record provides a policy hook that compliant CAs honour during issuance.

CAA records depend on DNS integrity.
[DNS cache poisoning](https://red.tymyrddin.dev/docs/in/network/notes/manipulation.html) that allows an attacker
to modify CAA records undermines this control; DNSSEC-signed zones make that significantly harder.

## Certificate Transparency

All publicly trusted CAs log issued certificates to CT logs before browsers accept them. Browsers require Signed
Certificate Timestamps (SCTs) as proof of CT log inclusion. The practical effect is that every certificate issued
for a domain is publicly visible: an attacker who persuades a CA to issue an unauthorised certificate for a
domain leaves a permanent, searchable record.

Monitoring CT logs for new certificates on owned domains detects misissued or shadow certificates promptly.
The crt.sh search API provides JSON output:

```bash
curl "https://crt.sh/?q=%.example.com&output=json" | jq '.[].name_value' | sort -u
```

Certspotter (open source) and similar tools watch CT logs continuously and deliver alerts when new certificates
appear. This is worth setting up: the detection window between issuance and discovery is otherwise bounded only
by how often you look.

## Lifecycle management

Certificate expiry is an operational failure mode, not a security one, but an expired certificate breaks services
as effectively as any attack. Automated renewal removes the dependency on human scheduling.

Let's Encrypt certificates have a 90-day validity period. The ACME protocol (used by certbot and acme.sh) handles
renewal automatically when certificates approach expiry:

```bash
certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

`--deploy-hook` runs a command after successful renewal, here reloading nginx to pick up the new certificate.

For certificates not managed through ACME, monitoring expiry separately is worthwhile. A Prometheus approach
using `x509-certificate-exporter` scrapes expiry dates from certificate files and TLS endpoints; a simpler cron
job suffices for smaller deployments:

```bash
openssl s_client -connect host:443 -servername host </dev/null 2>/dev/null \
  | openssl x509 -noout -enddate
```

## HSTS and preload

HTTP Strict Transport Security instructs browsers to refuse plain-HTTP connections to a domain for the duration
of `max-age`. Even if a user types `http://` or clicks an old HTTP link, the browser converts the request to
HTTPS without making the plain-HTTP connection.

A minimal HSTS header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

`includeSubDomains` extends the policy to all subdomains. This is worth verifying carefully before deploying: a
subdomain served over plain HTTP breaks under HSTS.

`preload` signals eligibility for inclusion in browser preload lists, which are hardcoded into browsers before
any header is seen. A domain on the preload list is protected on the first visit, before the browser has ever
received the HSTS header. The requirements for preload inclusion are: `max-age` of at least 31536000,
`includeSubDomains`, and `preload` in the header, with all subdomains actually served over HTTPS.

Preload is difficult to reverse: removal from the list takes months to propagate, and browsers already carrying
the old list continue to enforce it. Committing to preload means committing to HTTPS for all subdomains
indefinitely.

## OCSP stapling

Certificate revocation status is checked via OCSP (Online Certificate Status Protocol). Without stapling, the
browser makes a real-time OCSP request to the CA's responder on each connection. This adds latency and reveals
connection events to the CA.

With OCSP stapling, the server fetches the OCSP response from the CA's responder, caches it, and includes it in
the TLS handshake. The client gets the revocation status without contacting the CA directly.

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

`ssl_stapling_verify on` causes nginx to verify the OCSP response against the CA chain before stapling it. The
`resolver` directive is required because nginx needs to perform DNS resolution to reach the OCSP responder.
