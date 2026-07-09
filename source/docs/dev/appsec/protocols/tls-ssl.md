# Protocol versions and cipher suites

Every TLS connection begins with a negotiation: client and server agree on a protocol version and a cipher suite
from the intersection of what each supports.
[TLS interception techniques](https://red.tymyrddin.dev/docs/in/network/notes/intrusions.html) exploit misconfigured
negotiation: downgrades to broken protocol versions and cipher suites with known weaknesses. What the server
advertises as acceptable determines much of the attack surface.

## Protocol version selection

Each deprecated TLS version carries a specific reason for retirement.

SSLv3 fell to POODLE in 2014. POODLE is a padding oracle attack against SSLv3's CBC mode: an attacker in a
man-in-the-middle position can force a browser to retry a failed TLS connection using SSLv3 and then exploit the
padding behaviour to decrypt session cookies byte by byte. The attack requires about 256 requests per byte. SSLv3
has no variant without this property; the only fix is disabling the protocol entirely.

TLS 1.0 fell to BEAST in 2011. BEAST exploits the fact that TLS 1.0 CBC mode uses the previous ciphertext block
as the IV for the next record, making the IV predictable. An attacker with a JavaScript injection on the same
origin can mount a chosen-plaintext attack against session cookies. Browser-side mitigations (1/n-1 record
splitting) largely defanged BEAST in practice, but TLS 1.0 has been prohibited by PCI DSS since 2018. Disabling
it at the server removes the negotiation path entirely.

TLS 1.1 has no known practical attacks but offers nothing over TLS 1.2: no cipher suites not already available in
TLS 1.2, no security improvement. Keeping it serves only clients too old to negotiate TLS 1.2, and those clients
are old enough that their absence is generally acceptable.

TLS 1.2 is the current minimum. TLS 1.3 is the preferred version, and for a concrete reason: it removes the
entire category of cipher suites that have caused trouble. No RSA key exchange, no CBC mode suites, no export
suites. Every cipher suite in TLS 1.3 provides forward secrecy and authenticated encryption. The handshake is
also faster: one round trip instead of two.

## Cipher suite selection

For TLS 1.2, cipher suite selection is explicit: the server's configuration lists what it accepts, and the
negotiation picks the first suite both parties support. For TLS 1.3, the protocol itself restricts the
negotiation to a small set of AEAD algorithms, so explicit cipher configuration is less necessary. The TLS 1.2
list remains relevant for backward-compatible deployments.

AEAD (Authenticated Encryption with Associated Data) is the property to require. AEAD suites encrypt and
authenticate in a single operation, with no separate MAC step. This eliminates the padding oracle and MAC timing
attack classes that affected CBC-mode cipher suites (Lucky13, BEAST).

Cipher suites worth accepting for TLS 1.2:

```text
ECDHE-ECDSA-AES128-GCM-SHA256
ECDHE-RSA-AES128-GCM-SHA256
ECDHE-ECDSA-AES256-GCM-SHA384
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-ECDSA-CHACHA20-POLY1305
ECDHE-RSA-CHACHA20-POLY1305
```

ChaCha20-Poly1305 is particularly useful on mobile devices and embedded systems where hardware AES acceleration
is absent; GCM is faster on platforms with AES-NI. Listing both lets the server and client negotiate based on
hardware capability.

Cipher suites to avoid:

- Any `RSA` key exchange: no forward secrecy; a stolen server private key decrypts all recorded past sessions.
- Any `DHE` with parameters below 2048 bits: vulnerable to Logjam.
- Any `RC4`: broken by statistical bias attacks since 2013.
- Any `NULL`, `EXPORT`, or `ANON` suite.
- Any `CBC` mode suite for TLS 1.2: Lucky13 timing channel, padding oracle risk.

## Nginx configuration

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;
```

`ssl_prefer_server_ciphers off` is the correct setting when the cipher list is already restricted to acceptable
suites: it allows the client to express a preference (relevant for ChaCha20 on mobile), and TLS 1.3 ignores this
directive anyway. If the server list still contains suites of varying strength, `on` allows server-side ordering
to enforce the better options.

## Downgrade protection

`TLS_FALLBACK_SCSV` is a signalling cipher suite that the client includes when it deliberately attempts a lower
protocol version after a connection failure. A server that receives it from a client offering a version below the
server's maximum aborts the handshake with an `inappropriate_fallback` alert. This prevents an attacker from
exploiting transient network failures to force a protocol downgrade.

Modern OpenSSL includes `TLS_FALLBACK_SCSV` support by default. The relevant check is whether the running
OpenSSL predates its addition (OpenSSL 1.0.1j, released October 2014); anything later handles it automatically.
