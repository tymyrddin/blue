# Post-quantum cryptography

NIST completed its post-quantum cryptography standardisation process in 2024. The
selected algorithms are now published standards. Migration is a long project; starting
the inventory is the immediate priority.

## The NIST PQC standards

Four algorithms were standardised:

ML-KEM (FIPS 203, formerly Kyber): key encapsulation mechanism for key exchange and
encryption. Replaces RSA and ECDH. Three parameter sets: ML-KEM-512, ML-KEM-768,
and ML-KEM-1024, providing roughly 128, 192, and 256 bits of classical security
respectively. ML-KEM-768 is the recommended general-purpose choice.

ML-DSA (FIPS 204, formerly Dilithium): digital signature algorithm. Replaces RSA,
ECDSA, and EdDSA for signing. Three parameter sets: ML-DSA-44, ML-DSA-65, ML-DSA-87.
ML-DSA-65 is the general-purpose recommendation.

SLH-DSA (FIPS 205, formerly SPHINCS+): hash-based signature scheme. Slower and larger
than ML-DSA but based on different mathematical assumptions (hash function security
only). Recommended as a backup option when algorithm diversity matters more than
performance.

FN-DSA (FIPS 206, formerly Falcon): lattice-based signature scheme with smaller
signatures than ML-DSA, but more complex to implement securely due to Gaussian
sampling requirements. Recommended only where signature size is a hard constraint.

## What to migrate

The migration priority is asymmetric algorithms used for long-term keys or long-lived
sessions:

TLS key exchange: deploy hybrid X25519+ML-KEM-768. Available in OpenSSL 3.x with the
oqs-provider plugin; natively in BoringSSL for Chrome. This is the highest-impact
change for most organisations because it immediately protects all new TLS sessions
against harvest-now-decrypt-later.

```text
# openssl with oqs-provider: list available PQC groups
openssl list -groups | grep kyber

# configure nginx to prefer hybrid key exchange
ssl_ecdh_curve X25519MLKEM768:X25519:prime256v1;
```

Code signing and certificate authorities: plan migration of CA key material and code
signing infrastructure to ML-DSA or SLH-DSA. This is a long-lead project because
certificate chains and trust stores must be updated across all clients.

SSH: OpenSSH 9.0 introduced sntrup761x25519 (hybrid post-quantum key exchange).
Enable it explicitly:

```text
# sshd_config
KexAlgorithms sntrup761x25519-sha512@openssh.com,curve25519-sha256
```

GPG and email: current GPG versions do not support NIST PQC standards. Migration
options are limited; this is an area where tooling is still catching up.

## Symmetric and hash algorithms

AES-256 and SHA-384/SHA-512 are considered post-quantum adequate. No migration is
needed for symmetric encryption or hashing if already using these sizes. AES-128 and
SHA-256 provide reduced but still acceptable security margins under Grover's algorithm
for most threat models.

## The migration inventory

Before migrating, organisations need an inventory of what they are actually running.
The common gaps:

- Internal services using TLS 1.0/1.1 that need upgrading before any PQC consideration
- Legacy applications with hardcoded RSA 1024-bit keys
- Embedded devices and IoT with firmware-baked key pairs that cannot be updated
- Custom applications implementing their own key exchange (these need auditing)

Scanning tools for TLS configuration status:

```text
testssl.sh --full target.example.com
```

For internal infrastructure, running testssl against every HTTPS endpoint is the
fastest way to generate the migration backlog.

## Timelines and standards adoption

NIST FIPS 203, 204, 205 are published as final standards (2024). Most major TLS
libraries have or are adding support. Browser hybrid deployment (X25519Kyber768)
has been active since 2023.

US government (CNSA 2.0 guidance) requires post-quantum for new systems handling
national security information by 2030. Commercial organisations should treat 2030
as a planning horizon rather than a hard deadline; migration complexity typically
exceeds estimates.
