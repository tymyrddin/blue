# Known TLS vulnerabilities

TLS has accumulated a substantial attack history since its predecessors appeared in the mid-1990s. Most of these
attacks are not theoretical: they were demonstrated against real deployments, influenced real decisions, and left
specific configuration guidance in their wake. [The TLS interception and downgrade techniques](https://red.tymyrddin.dev/docs/in/network/notes/intrusions.html)
used by attackers today largely exploit the failure to apply this guidance.

The practical takeaway from all of them is the same: disable the feature that made the attack possible, or
switch to a cipher mode that is not susceptible. testssl.sh (covered in the [monitoring page](monitoring.md))
checks for most of these automatically.

## POODLE (2014)

SSLv3's CBC mode has a padding oracle vulnerability. When decrypting a CBC-encrypted block, the receiver
validates the padding length but not the padding content. An attacker in a man-in-the-middle position can exploit
this to decrypt data byte by byte, requiring roughly 256 requests per byte. Session cookies, which are typically
under 64 bytes, can be recovered in under 20,000 requests, achievable via JavaScript injection.

POODLE requires SSLv3 to be negotiated. Modern clients do not offer SSLv3 by default, but if the server still
accepts it, a downgrade attack brings SSLv3 into play. Disabling SSLv3 on the server closes the attack.

## BEAST (2011)

TLS 1.0 CBC mode uses the last ciphertext block from the previous record as the IV for the next. This makes the
IV predictable. An attacker with a JavaScript injection on the same origin can exploit this predictability with a
chosen-plaintext attack to recover session cookies.

Browser-side mitigations (1/n-1 record splitting) were deployed widely and reduced BEAST to a largely theoretical
concern for patched browsers, but TLS 1.0 itself has been deprecated by PCI DSS since 2018. Disabling TLS 1.0
removes the negotiation path.

## CRIME (2012)

CRIME exploits TLS-level compression. When a secret (a session cookie) is compressed alongside attacker-controlled
input, the compressed size varies depending on whether the input matches bytes in the secret. Measuring the
compressed sizes allows the attacker to recover the secret byte by byte.

TLS compression is off by default in modern OpenSSL (since 1.0.0). Verifying the configuration explicitly:

```nginx
# nginx has no ssl_compression directive; it follows the OpenSSL build
# confirm with: openssl version -a | grep -i zlib
```

An OpenSSL build without zlib support does not support TLS compression at all.

## BREACH (2013)

BREACH is CRIME applied to HTTP response compression rather than TLS compression. Disabling TLS compression does
not prevent BREACH. If the server compresses HTTP responses that contain both secrets (CSRF tokens, session
identifiers) and attacker-controlled input (a reflected search query), the attacker can recover the secret
through the same length-based oracle.

Mitigations: disable HTTP response compression for endpoints that echo user input alongside secrets; separate
the secret from the reflected content in the response structure; or apply length-hiding by adding random padding
to responses. CSRF tokens derived fresh per-response (rather than per-session) also limit the utility of the
recovered value.

## FREAK (2015)

FREAK (Factoring RSA Export Keys) exploited a downgrade to export-grade RSA cipher suites, which use 512-bit
keys. These suites date to US export regulations from the 1990s that restricted strong cryptography. Despite the
regulations having lapsed, many servers still advertised export suites, and the 512-bit keys could be factored
in hours on commodity hardware.

Disabling export cipher suites removes the attack surface. A cipher string that excludes `EXPORT` suites and
`RSA` key exchange is not vulnerable.

## Logjam (2015)

Logjam exploits DHE (Diffie-Hellman Ephemeral) downgrade to export-grade 512-bit DH parameters. Like FREAK,
this exploited servers that still offered export cipher suites. Additionally, many servers that did not use
export suites used 1024-bit DH parameters, which are within reach of nation-state precomputation.

Mitigations: use ECDHE in preference to DHE; if DHE is used, generate custom DH parameters of at least 2048
bits:

```bash
openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

```nginx
ssl_dhparam /etc/nginx/dhparam.pem;
```

## Heartbleed (2014)

Heartbleed was a memory disclosure vulnerability in OpenSSL's implementation of the TLS heartbeat extension. A
crafted heartbeat request caused OpenSSL to return up to 64 KB of server memory per request, potentially
including private keys, session keys, and plaintext from other connections.

The fix was an OpenSSL update (1.0.1g, released April 2014). For servers that were running vulnerable versions,
rekeying (generating new private keys and obtaining new certificates) is necessary after patching: a private key
exposed while Heartbleed was active is no longer trustworthy regardless of the patch.

## ROBOT (2017)

ROBOT (Return Of Bleichenbacher's Oracle Threat) revived an RSA PKCS#1 v1.5 padding oracle attack first
described in 1998. Many implementations of RSA key exchange still contained timing or error-message differences
that allowed an attacker to determine, via repeated queries, whether a crafted ciphertext decrypted to
well-formed PKCS#1 v1.5 padding. Enough queries allow the attacker to decrypt arbitrary ciphertexts without
the private key.

Disabling RSA key exchange cipher suites entirely eliminates the attack surface: ECDHE and DHE cipher suites
do not use RSA for key transport.

## Lucky13 (2013)

Lucky13 is a timing side-channel in the MAC verification step of CBC-mode cipher suites. The time taken to
process a MAC varies slightly depending on the padding length, leaking information about the plaintext.

Switching to AEAD cipher suites (AES-GCM, ChaCha20-Poly1305) eliminates Lucky13: AEAD modes have no separate
MAC step, and their authentication is not vulnerable to the same timing channel.

## Renegotiation

TLS supports in-session renegotiation, allowing either party to initiate a new handshake within an established
connection. Two attack vectors emerged from this:

Client-initiated renegotiation is a denial-of-service vector. Renegotiation is computationally expensive (it
involves asymmetric key operations); a client that repeatedly initiates renegotiation can exhaust server CPU.

Insecure renegotiation (before RFC 5746) allowed a man-in-the-middle to inject a prefix into a session by
initiating a renegotiation. The server would complete the renegotiation and associate the attacker's prefix with
the client's subsequent authenticated request.

RFC 5746 introduced the secure renegotiation extension, which cryptographically binds renegotiations to the
established session. Configuring the server to require the extension (and to disable client-initiated
renegotiation entirely for contexts where it is not needed) addresses both vectors:

```nginx
# nginx: client-initiated renegotiation is limited by ssl_renegotiation_limit (default 0 = disabled in
# recent versions); the renegotiation extension is handled by the underlying OpenSSL
```

For Apache with mod_ssl, `SSLInsecureRenegotiation off` (the default since 2.2.15) disables the insecure variant.
Last updated: 17 May 2026
