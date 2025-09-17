# CVEs related to inter-utility exchanges

| CVE                                                                              | Affected component / protocol                                                   | Issue                                                                                                                                          | Severity / Impact                                                                                       |
|----------------------------------------------------------------------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| [CVE-2022-38138](https://www.cisa.gov/news-events/ics-advisories/icsa-22-249-01) | Triangle Microworks IEC 61850 Library and TMW IEC 60870-6 (ICCP/TASE.2) Library | Access of uninitialised pointer → Denial of Service (DoS) for clients or servers using vulnerable versions.                                    | High – DoS against critical grid comms libraries can cascade into SCADA/TSO disruption.                 |
| [CVE-2022-2277](https://cvefeed.io/vuln/detail/CVE-2022-2277)                    | Hitachi Energy MicroSCADA X SYS600’s ICCP stack                                 | Improper input validation in ICCP protocol during communication establishment; DoS when forwarding data with timestamps too far in the future. | High – Remote DoS against grid control systems; could block inter-utility data exchange and visibility. |

---

## Patterns

* These CVEs show that the libraries/tools used in inter-utility / TSO / SCADA layers (like ICCP/TASE.2, IEC 60870-6) still have vulnerabilities, sometimes very basic (uninitialized memory, input validation), which can lead to service disruption.
* Because many utilities use these libraries for cross-vendor communication, upstream/downstream interconnects, or for exchanging control / measurement data between control centres, even a DoS or mis-timestamped data could ripple into operational issues.
* These kinds of vulnerabilities illustrate that using the hollow phrase “TSO networks are secure” doesn’t help — check the library versions, patch status, and understand what external / inter-utility traffic is handled by deployments.
