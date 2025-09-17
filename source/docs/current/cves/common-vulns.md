# Common vulnerability classes

Smart energy devices suffer from many of the same issues as general IoT, but with energy-specific consequences:

- Default credentials, weak authentication, or hardcoded keys.
- Exposed web interfaces or admin portals accessible over the network.
- Buffer overflows, input validation errors, and logic flaws.
- Firmware signing bypasses and insecure update mechanisms.
- Poor use of TLS/cryptography: self-signed certificates, expired certs, or no certificate validation.

Understanding these classes helps anticipate what kinds of flaws may exist, even without access to specific exploits.

## Practical mitigation priorities for EU CNAs & operators

1. Enforce NIS2-grade logging & incident playbooks: ensure CSIRT liaises with national CSIRT (BSI/ANSSI/NCSC-NL) and CERT-EU where appropriate.
2. Signed firmware + supply-chain checks: require vendor support for signed updates (CRA push). Maintain firmware hashes for all test devices.
3. Mutual TLS & PKI for interconnects: require certificate-based mutual auth for ICCP/TASE.2 and OCPP backends where feasible (ENISA guidance).
4. Protocol-aware monitoring & baseline capture: instrument IEC 61850, Modbus, OCPP, Zigbee traffic with Wireshark dissectors and targeted IDS rules. Store PCAPs in write-once evidence buckets.
5. Segment and control remote vendor access: jump hosts, MFA, short-lived credentials; log everything.
6. Regulatory coordination: prepare evidence packages (PCAPs, serial logs, firmware hashes) for NIS2 incident reports and coordinate with national authority & ENISA.
7. Test matrices & recipes: maintain device-specific deterministic tests (no exploit code), mapped to CVE classes (replay, timestamp, parsing, auth).
8. Certification roadmap: push vendors toward CRA/RED compliance and independent security testing (penetration, fuzzing, supply-chain audits).

## Practical attacker-centric patterns

1. Replayable sessions — common in consumer/edge Zigbee and Wi-Fi stacks. Lab priority: capture canonical auth flows and attempt safe replay in isolation.
2. Timestamp / sequence validation bugs — common in ICCP/IEC 61850/Modbus forwarding logic. Lab priority: canonical capture → bounded timestamp mutation → serial + pcap evidence.
3. Unsigned or poorly validated updates — mass-impact vector for supply-chain. Lab priority: firmware extraction, signature checks, attempt safe update simulation in a sandbox.
4. Protocol parsing crashes — buffer overflows or malformed fields. Lab priority: incremental packet mutation, emulation or QEMU first, then hardware confirmation.
5. Cloud dependency mis-assumptions — devices trusting cloud to enforce security. Lab priority: stub vendor clouds to assess device behaviour when cloud is absent/compromised.
