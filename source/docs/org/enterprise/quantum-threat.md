# The quantum threat

Quantum computing does not break all cryptography. It breaks specific mathematical
problems that underpin specific algorithms, on a specific timeline that is uncertain
but no longer theoretical.

## What Shor's algorithm breaks

Shor's algorithm (1994) runs in polynomial time on a quantum computer and solves:

- Integer factorisation: breaks RSA at all key sizes
- Discrete logarithm over integers: breaks DSA and classic DH
- Discrete logarithm over elliptic curves: breaks ECDSA and ECDH

A cryptographically relevant quantum computer (CRQC) running Shor's algorithm would
render all of these algorithms insecure regardless of key size. A 4096-bit RSA key
provides no more protection than a 2048-bit key against a sufficiently large quantum
computer.

The current estimate from NIST and most cryptographers is that a CRQC with the error
correction required to run Shor's against 2048-bit RSA does not exist yet, but the
timeline is measured in years to decades rather than never.

## What Grover's algorithm does to symmetric crypto

Grover's algorithm provides a quadratic speedup for unstructured search. Applied to
symmetric key search, this halves the effective key length:

- AES-128 provides approximately 64 bits of quantum security
- AES-256 provides approximately 128 bits of quantum security

128 bits of security is considered adequate by current standards. The practical
guidance is to migrate to AES-256 if not already using it, and to double hash output
lengths for long-term security (SHA-384 or SHA-512).

## Harvest-now-decrypt-later

The asymmetric urgency is compounded by the harvest-now-decrypt-later threat model.
An adversary with access to your encrypted traffic today can store it and decrypt it
when a CRQC becomes available.

For most data, this is not a concern: session keys are ephemeral, TLS sessions expire,
and the data is not valuable in ten years. But for some categories it is directly
relevant:

- Classified government communications
- Long-term business secrets and intellectual property
- Personal health, financial, and identity records
- Certificate authority key material and infrastructure secrets
- Code signing keys

Organisations holding data in these categories should treat post-quantum migration
as urgent.

## Forward secrecy and the current exposure window

Current TLS deployments using ECDHE provide forward secrecy against a classical
adversary: compromise of the server's long-term private key does not decrypt past
sessions. Against a quantum adversary, the forward secrecy is only as strong as the
key exchange algorithm.

ECDHE is broken by Shor's algorithm. A captured TLS session using ECDHE can be
decrypted if the ephemeral ECDH key exchange is solved, which requires the discrete
log of the session's public values, achievable with a CRQC.

RSA key exchange (not ECDHE) has no forward secrecy even classically; it is doubly
exposed in the quantum threat model.

## The X25519/ML-KEM hybrid approach

The current best practice for new deployments is hybrid key exchange: combine a
classical algorithm (X25519 or P-256) with a post-quantum algorithm (ML-KEM-768 or
ML-KEM-1024) so that the session is secure if either algorithm holds. TLS 1.3 with
X25519Kyber768 is available in Chrome, Firefox, and recent OpenSSL builds.

The hybrid approach hedges against two risks simultaneously: a flaw discovered in
the new post-quantum algorithm, and a CRQC breaking the classical algorithm. It
costs slightly more in handshake size but is the correct choice for high-value
connections today.
