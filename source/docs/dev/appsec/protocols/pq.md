# Emerging threats & post-quantum readiness

* Prepare for Quantum Computing – Test hybrid PQ-TLS (e.g., Kyber + X25519).
* Watch for New Attacks – Stay updated on TLS 1.3 side channels (e.g., Raccoon, Raccoon-2).

Example (OpenSSL PQ Experiment):

```bash
openssl s_client -groups kyber768:x25519  # Hybrid key exchange
```