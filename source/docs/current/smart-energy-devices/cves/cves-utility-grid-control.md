# CVEs for utility / grid control layer

| CVE                                                               | Product / Vendor                           | Protocol or component                  | Issue summary                                                                                                    |
|-------------------------------------------------------------------|--------------------------------------------|----------------------------------------|------------------------------------------------------------------------------------------------------------------|
| [CVE-2025-39203](https://nvd.nist.gov/vuln/detail/CVE-2025-39203) | Hitachi Energy MicroSCADA X SYS600         | IEC 61850-8 (IED / remote system)      | Crafted IEC 61850-8 message causes a denial of service → “disconnection loop”.                                   |
| [CVE-2025-1445](https://nvd.nist.gov/vuln/detail/cve-2025-1445)   | Hitachi Energy (RTU500 device)             | IEC 61850 with TLS                     | TLS renegotiation timing issue can lead to availability loss when the IEC 61850 communication is active.         |
| [CVE-2022-3353](https://www.tenable.com/plugins/ot/500950)        | Hitachi Energy / ABB AC 800PEC suite       | IEC 61850 MMS server stack             | Crafted message sequence can stop the MMS server from accepting *new* client connections (affects availability). |
| [CVE-2014-0761](https://nvd.nist.gov/vuln/detail/CVE-2014-0761)   | CG Automation ePAQ-9410 Substation Gateway | DNP3                                   | Remote attacker can send a crafted TCP packet that triggers Denial of Service (infinite loop or process crash).  |
| [CVE-2014-0762](https://nvd.nist.gov/vuln/detail/CVE-2014-0762)   | Same gateway / product                     | DNP3 (serial / input over serial line) | Physically proximate attacker can cause DoS via crafted inputs over serial.                                      |

## Patterns

* Even modern SCADA / IEC 61850 stacks are vulnerable to *availability attacks* (Denial of Service), which are serious in substation control contexts.
* Use of TLS / secure channels doesn’t automatically guarantee safety; certificate validation, handshake/renegotiation logic, and message parsing remain weak spots.
* Older devices (gateways, RTUs) are especially risky, particularly when they expose DNP3-based drivers or services without hardened input validation.
* Patching is essential, but so is network segmentation, *access control*, and *monitoring traffic* for malformed messages or anomalous TLS renegotiation patterns.

