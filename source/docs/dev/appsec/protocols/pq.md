# Post-quantum readiness

RSA and elliptic curve cryptography are vulnerable to Shor's algorithm on a sufficiently capable quantum computer. A cryptographically relevant quantum computer does not exist yet, but the threat model includes "harvest now, decrypt later": adversaries record encrypted traffic today with the intention of decrypting it once quantum capability arrives. Long-lived secrets (identity documents, health records, financial data with long retention) are at risk even before quantum computers are practical.

## NIST standardisation

NIST completed its post-quantum cryptography standardisation in August 2024 with FIPS 203, 204, and 205:

- FIPS 203: ML-KEM (Module-Lattice-based Key Encapsulation Mechanism), derived from CRYSTALS-Kyber. This is the primary key encapsulation mechanism for post-quantum key exchange.
- FIPS 204: ML-DSA (Module-Lattice-based Digital Signature Algorithm), derived from CRYSTALS-Dilithium.
- FIPS 205: SLH-DSA (Stateless Hash-Based Digital Signature Algorithm), derived from SPHINCS+.

ML-KEM-768 corresponds to what was referred to as Kyber768 during the NIST competition. The FIPS 203 designation is the current standard name.

## Hybrid key exchange

Hybrid key exchange combines a classical algorithm (X25519) with a post-quantum one (ML-KEM-768), so security degrades to classical strength if the post-quantum component is broken. This is the prevalent migration approach: it provides post-quantum protection for future decryption attacks without relying solely on algorithms that are newer and have had less public cryptanalysis.

OpenSSL's support for ML-KEM in stable releases is still in progress as of 2025. The OQS (Open Quantum Safe) project maintains an OpenSSL fork and provider with post-quantum support:

```bash
# Experimental — requires oqs-provider installed against OpenSSL 3.x
openssl s_client -groups mlkem768:x25519 -connect target:443
```

The group name `kyber768` may still appear in some implementations using earlier naming; `mlkem768` is the standardised name under FIPS 203.

## TLS 1.3 side channels

Separate from post-quantum concerns, TLS 1.3 has been subject to timing side-channel research (Raccoon, Lucky13 variants in specific implementations). These affect specific implementations; patching the TLS library to a current version addresses this.

## Practical readiness

For most applications, the more pressing question is where RSA or EC keys protect data with long-term sensitivity, and whether the TLS library and key exchange configuration in use will support hybrid ML-KEM/X25519 when it becomes available in stable releases. NIST and CISA have published migration guidance; the timeline for mandatory migration in regulated environments is being established on a sector-by-sector basis.
Last updated: 10 July 2026
