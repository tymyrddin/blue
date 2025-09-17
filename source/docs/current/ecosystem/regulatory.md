# EU regulatory context

In Europe, a smart meter vulnerability is not just a technical curiosity. It intersects privacy law, critical 
infrastructure regulation, and cross-border coordination. I need to be aware that validation work carries legal and 
procedural weight, and disclosure practices must reflect that reality.

## EU agencies & national bodies

* [ENISA](https://www.enisa.europa.eu/) — European Union Agency for Cybersecurity; produces guidance and threat papers for energy/OT.
* [CERT-EU](https://cert.europa.eu/) — EU institutions’ CSIRT; coordinates at EU level on incidents.
* [National CSIRTs / agencies](https://tools.enisa.europa.eu/topics/incident-response/csirt-inventory/certs-by-country-interactive-map) — examples: [BSI](https://www.bsi.bund.de) (Germany), [ANSSI](https://cyber.gouv.fr/) (France), [NCSC-NL](https://www.ncsc.nl/) (Netherlands), [CERT-EE](https://www.cert.ee/), [etcetera](https://scadahacker.com/resources/cert.html). 
* [ACER](https://www.acer.europa.eu/) / national regulators — energy regulators are often involved for large incidents.
* [CEN/CENELEC](https://www.cencenelec.eu/european-standardization/european-standards/) / [ETSI](https://www.etsi.org/) — standards bodies that influence technical specs and harmonisation.

### National CERTs

- European coordination: Vulnerabilities in energy devices usually involve cross-border implications. National CERTs may need to be informed and consulted.  
- Best practice: Share PoC results in a controlled and secure manner, following responsible disclosure procedures. Provide context on affected devices, versions, and potential impact, but avoid publishing exploit code publicly.  
- Collaboration: CNAs often act as technical liaisons between vendors, regulators, and CERTs. Documentation, reproducibility, and careful lab validation are crucial to support these interactions.

## Laws / regulations

When working in a CNA lab validating smart energy vulnerabilities in Europe, the regulatory landscape adds layers of 
responsibility beyond the technical work. Consider the following:

## GDPR

[GDPR](https://gdpr-info.eu/) — personal data in meter reads or customer accounts increases disclosure and remediation complexity.

- Personal data risk: Many smart meters, inverters, and home energy devices collect data that can reveal household habits, occupancy patterns, and even appliance usage. A vulnerability in these devices is not just a technical issue—it can constitute a personal data breach under [GDPR](https://gdpr-info.eu/).  
- Disclosure phrasing: When reporting vulnerabilities, be precise. Avoid leaking personal data in reports or PoC artifacts. Frame the issue in terms of device behaviour, protocol flaws, and potential privacy impact, rather than including raw user data.  
- Responsibility: CNAs validating vulnerabilities need to treat every captured dataset as sensitive. Even “test” captures of real deployments could trigger GDPR obligations.

## NIS2

[NIS2 (Network and Information Security) Directive 2022](https://www.nis2-info.eu/) — raises obligations for operators of essential services, including energy. CNAs and vendors must consider incident reporting timelines and evidence preservation.

- Critical infrastructure: Energy providers and grid operators are classified as essential under the [NIS2 Directive](https://www.nis2-info.eu/). Vulnerabilities affecting smart meters, inverters, or control networks may fall under mandatory incident reporting obligations.  
- Timelines and reporting: NIS2 imposes strict deadlines for disclosure to competent authorities. CNAs must understand these timelines to avoid regulatory non-compliance.  
- Regulator involvement: Depending on the country, regulators or sector-specific authorities may demand technical detail, mitigation plans, or proof of PoC. Coordinating with legal or compliance teams is often necessary.

## CRA

[Cyber Resilience Act (CRA)](https://www.cyberresilienceact.eu/) — upcoming product security requirements for software/hardware placed on EU market (affects vendor responsibilities for secure development).

## RED

[Radio Equipment Directive (RED)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02014L0053-20241228) — now also applies to radio devices (Zigbee, LoRaWAN); national transposition varies.

