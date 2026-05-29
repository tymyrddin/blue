# References and resources

Support passive fingerprinting, correlation, and enrichment activities within the Fingerprint Forge. This page focuses on datasets, reference material, and internal discipline required to turn raw artefacts into stable identifiers.

## Passive datasets and observation sources

Large-scale, passive or quasi-passive datasets used for correlation, prevalence analysis, and historical comparison. These are used for *lookups and pattern matching*, not active discovery.

* [Shodan](https://www.shodan.io/): internet-wide scan data for banners, services, certificates, and metadata
* [Censys](https://censys.io/): structured scan datasets with strong TLS and service fingerprinting support
* [Shadowserver public datasets](https://www.shadowserver.org/what-we-do/network-reporting/): community-driven measurements and reports
* [Common Crawl](https://commoncrawl.org/): large-scale web crawl data, useful for historical UI assets and web fingerprints
* Vendor firmware mirrors and archives (when available): used for version correlation and artefact comparison

*These sources are observational. If it requires you to send packets, it is out of scope for the Forge.*

## Asset hash databases and fingerprint libraries

Resources for matching extracted artefacts against known fingerprints. Hashes and signatures are treated as *signals*, not proof.

* [VirusTotal](https://www.virustotal.com/): multi-engine hash lookups and historical context
* [TLSH (Trend Micro Locality Sensitive Hash)](https://github.com/trendmicro/tlsh): fuzzy hashing for binaries and firmware
* [SSDeep](https://ssdeep-project.github.io/ssdeep/): context-triggered piecewise hashing
* [JA3 / JA3S TLS fingerprinting](https://github.com/salesforce/ja3): client and server TLS fingerprint methodology
* [HASSH](https://github.com/salesforce/hassh): SSH fingerprinting via handshake characteristics

Hash matches inform hypotheses. They do not end them.

## Protocol references for fingerprinting

Protocol documentation used to identify stable fields, version markers, optional features, and implementation quirks that can be fingerprinted passively.

* [Modbus protocol specifications](https://www.modbus.org/modbus-specifications)
* [Siemens S7 protocol overview](https://support.industry.siemens.com/cs/document/26483647/what-properties-advantages-and-special-features-does-the-s7-protocol-offer-?dti=0&lc=en-VN)
* [OPC UA specifications](https://opcfoundation.org/developer-tools/specifications-unified-architecture/)
* [DNP3 protocol overview](https://www.dnp.org/About/Overview-of-DNP3-Protocol)
* [MQTT protocol specification](https://mqtt.org/mqtt-specification/)
* [HTTP/1.1 specification (RFC 7230–7235)](https://www.rfc-editor.org/rfc/rfc7230)
* [UPnP Device Architecture](https://openconnectivity.org/developer/specifications/upnp-resources/)

Focus is on banners and greetings, default headers and ordering, optional capability advertisements, protocol misuse and edge cases

## TLS and certificate analysis references

TLS artefacts are often the most stable passive identifiers available.

* [X.509 certificate structure (RFC 5280)](https://www.rfc-editor.org/rfc/rfc5280)
* [OpenSSL documentation](https://docs.openssl.org/master/)
* [crt.sh certificate transparency search](https://crt.sh/)

Serial numbers, issuer quirks, key reuse, and certificate lifetimes are all fingerprint material.
