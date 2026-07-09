# Key exchange and forward secrecy

The question forward secrecy answers is: if the server's private key is compromised tomorrow, can an attacker
decrypt traffic recorded today? Without forward secrecy, the answer is yes.
[TLS interception](https://red.tymyrddin.dev/docs/in/network/notes/intrusions.html) at scale, passive recording
of encrypted traffic with the expectation of later decryption, is a documented practice for state-level
adversaries, which makes this more than a theoretical concern.

## The problem with static key exchange

In RSA key exchange (the non-forward-secret path), the client generates a random session key, encrypts it with
the server's RSA public key, and sends it. The server decrypts it with its private key. Both parties now share
the session key and can encrypt the session.

The problem is that the session key's security is tied to the server's long-term private key. A recording of the
handshake and subsequent traffic, stored until the private key is stolen or cracked, decrypts the entire session.
This is not a hypothetical: RSA private keys are exposed through Heartbleed-type vulnerabilities, certificate
mis-issuance, server compromise, and (in the post-quantum future) sufficiently capable quantum computers.

## Ephemeral key exchange

Forward secrecy addresses this by making the key exchange ephemeral. Both client and server generate temporary
key pairs for each session, combine them to produce a shared secret, and then discard the ephemeral private keys.
The session key exists only in memory for the duration of the session. A stolen long-term private key cannot
reconstruct it.

Diffie-Hellman Ephemeral (DHE) operates over a multiplicative group. Elliptic Curve DHE (ECDHE) applies the
same principle to elliptic curves, producing equivalent security with smaller key sizes and faster computation.
ECDHE is the practical choice; DHE at adequate parameter sizes (2048 bits minimum, but 4096 preferred) is
significantly slower.

## Curve selection

X25519 is the preferred curve for ECDHE. It was designed explicitly to resist side-channel attacks: its
Montgomery ladder implementation runs in constant time, and the curve's parameters were chosen transparently,
without the concerns that attach to NIST P-curves whose genesis is less well documented. X25519 is also fast:
a Diffie-Hellman operation on X25519 is roughly 15 times faster than on P-256 in constant-time implementations.

In nginx, the curve preference is configured as:

```nginx
ssl_ecdh_curve X25519:prime256v1:secp384r1;
```

X25519 as the first choice; P-256 and P-384 as fallbacks for clients that do not support X25519.

## TLS 1.3 and forward secrecy as a requirement

TLS 1.3 removes RSA key exchange entirely. There is no negotiation path in TLS 1.3 that does not provide forward
secrecy; the protocol simply does not include non-forward-secret cipher suites. This is one of TLS 1.3's most
significant improvements over 1.2, where a misconfigured server could still offer RSA key exchange.

For deployments supporting TLS 1.2, ensuring that no RSA key exchange cipher suites are in the configuration is
the relevant check. A cipher suite string that starts with `ECDHE` or `DHE` provides forward secrecy; one that
starts with `RSA` does not.

## Session resumption and the forward secrecy tension

Session resumption avoids the full handshake cost for returning clients. Two mechanisms exist, and they interact
differently with forward secrecy.

Session IDs store session state on the server. The client presents the session ID on reconnection; the server
looks up the state and resumes without a full handshake. Forward secrecy is preserved because no key material
leaves the server. The drawback is that this does not scale across multiple server instances without shared
session storage.

Session tickets encrypt the session state with a server-side ticket key and send it to the client. On
reconnection, the client presents the ticket; the server decrypts it and resumes. This is the more common
approach for load-balanced deployments. The forward secrecy implication: if the ticket key is compromised, any
session resumed with it can be decrypted. The ticket key is not the long-term certificate key, but it is still
a secret that warrants protection and rotation.

Rotating ticket keys at regular intervals, with a brief overlap period to accept the old key during transition,
limits the exposure window. In nginx, the `ssl_session_ticket_key` directive points to a key file;
the file is rotated by a cron job or secrets management system. Using a key that persists across server reboots
without rotation extends the window unnecessarily.

## TLS 1.3 0-RTT resumption

TLS 1.3 introduces 0-RTT resumption (early data), where a client can send application data in the first
flight of the handshake, before the key exchange completes. This eliminates the latency cost of resumption
entirely. The tradeoff is that early data is vulnerable to replay attacks: an attacker who captures a 0-RTT
message can replay it against the server.

0-RTT is appropriate for idempotent requests (reads, searches) and worth disabling or treating with extra
caution for state-changing operations (payments, account modifications). Servers that accept 0-RTT data
identify it via the `Early-Data` header and can choose to reject non-idempotent requests received in that
context.
Last updated: 17 May 2026
