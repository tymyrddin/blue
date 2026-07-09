# Trends in cryptanalysis: defensive perspective

The cryptographic threat landscape in 2026 is not about new algorithms being broken. AES,
ChaCha20, and properly implemented modern ECC continue to hold. What is changing is the
context around them, and the timeline pressure introduced by quantum computing.

## What defenders are facing

Side-channel attacks are moving from specialist hardware labs into mainstream pentests.
ChipWhisperer is cheap and documented. Deep learning trace analysis reduces the measurement
count needed for DPA to be practical. Hardware wallets, embedded payment terminals, and
IoT authentication devices are all realistic targets.

Protocol-level weaknesses remain the most common source of real breaches. TLS 1.0 and
1.1 are formally deprecated but still running on internal infrastructure everywhere.
Padding oracle vulnerabilities keep resurfacing in custom implementations. JWT libraries
continue to ship with algorithm confusion exposures.

Weak randomness is the most underestimated risk. Embedded devices generating keys at first
boot with insufficient entropy produce weak key material that does not announce itself.
The problem is invisible until someone sweeps public key material for shared factors or
runs a lattice attack on signature nonces.

Automated tooling is lowering the bar for all of the above. Semgrep and CodeQL with
cryptographic rule sets find hardcoded keys, ECB mode use, MD5 for secrets, and missing
MAC in minutes. What previously required a cryptographer to audit manually is now in CI
pipelines.

## The quantum context

Harvest-now-decrypt-later is an active threat for data with long-term sensitivity. A nation-
state actor capturing TLS sessions today that protect state secrets, medical records, or
intellectual property can decrypt them once large-scale quantum computing is available.
Migration to post-quantum key exchange is urgent for high-value data.

For most organisations, symmetric encryption (AES-256) and hash functions are not the
urgent concern; Grover's algorithm halves the effective key length (256 bits becomes
128 bits of quantum security) but AES-256 remains adequate. The urgent migration is
asymmetric: RSA, DSA, ECDSA, and ECDH are all broken by Shor's algorithm.

See [quantum threat](quantum-threat.md) and [post-quantum migration](post-quantum.md)
for the detailed analysis.

## Where detection and response sit

Detection of cryptographic attacks is harder than detection of other techniques because
cryptographic operations are designed to look like noise. The indicators are behavioural
and indirect:

- Unusually high volumes of requests to a service endpoint (padding oracle automation)
- Timing anomalies in authentication responses
- Key material appearing in unusual places (memory dumps, log files)
- TLS negotiation at outdated versions or with weak cipher suites

The defensive use of the same automated tools is an underutilised approach: running
semgrep crypto rules, formal protocol verification, and RNG quality analysis against
your own systems before an attacker does.
Last updated: 09 June 2026
