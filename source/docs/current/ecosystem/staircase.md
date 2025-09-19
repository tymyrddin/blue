# The security staircase

The “levels” bit is shorthand from how regulators and operators structure security capacity in critical infrastructure (energy, water, telecoms). It is not always spelled out the same way, but in EU/NIS2/ENISA-type documents and sector standards there seems to be a kind of staircase:

## Level A (operator/SOC level)

Each Distribution System Operator (DSO), Transmission System Operator (TSO), or even big supplier must run some form of SOC-lite. For example: TenneT, RTE, E.ON. They monitor their own estate, do first-line response, and escalate. Their labs are often small — test harnesses, PoC environments, maybe a simulated grid segment — mostly for detection tuning and training ops staff.

## Level B (sector/CNA level)

The Cybersecurity and Network Assurance body, usually national or sector-wide. In Germany this could be BSI, in France ANSSI, in the Netherlands ILT (for energy oversight). They ensure operators share intelligence and follow common playbooks. They maintain a bigger lab: a reference environment for cross-operator systems, interop checks, malware detonation, and joint red-blue exercises.

## Level C (national CSIRT/Gov cert level)

Above CNA sits the national CSIRT or competent authority: GovCERT.NL, CERT-FR, BSI CERT-Bund, INCIBE-CERT in Spain. They see incidents that go beyond one sector, coordinate with law enforcement, and pass threat intel between sectors and internationally. Their labs are broader — spanning multiple domains, handling classified data, doing advanced malware research.

## Level D (EU-wide coordination)

At the top sits the EU layer. ENISA provides guidance, capacity building, and runs Cyber Europe. CERT-EU protects EU institutions but also brokers intel between national CSIRTs. The NIS Cooperation Group and the CSIRTs Network ensure incidents that spill across borders are handled consistently. The Joint Research Centre (JRC) maintains smart grid and EV charging test facilities, feeding evidence into EU policy and certification schemes.

## Embrace messy reality

| Device Level (exposure)                              | Examples                                                                                    | Main risks                                                 | CNA role                                                             | Lab needed?                     | Who does testing / PoC                                                         |
|------------------------------------------------------|---------------------------------------------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------------|---------------------------------|--------------------------------------------------------------------------------|
| Level A devices (consumer / prosumer)                | Smart plugs, Zigbee hubs, EV wallboxes in homes                                             | Weak auth, replay attacks, unsafe default configs          | Receive CVE submissions, assign IDs, publish entries                 | No                              | Vendors, independent researchers; CNA may request minimal PoC for verification |
| Level B devices (commercial / municipal)             | Office BMS, school PV inverters, municipal EV charging clusters                             | Poor patching, supply-chain firmware flaws, lateral spread | Validate CVEs, coordinate with sector CNAs, ensure advisory issuance | Sometimes (small test harness)  | Sector reference labs, vendors                                                 |
| Level C devices (industrial / inter-utility)         | Substation controllers, SCADA gateways, ICCP/TASE.2 stacks                                  | DoS via protocol abuse, timestamp / association flaws      | Validate CVEs, liaise with national CSIRTs, ensure publication       | Yes (shared CSIRT / sector lab) | CSIRT labs, vendor SOCs, forensic teams                                        |
| Level D devices (grid-critical / cross-border infra) | HVDC interconnectors, ENTSO-E cross-border balancing platforms, large-scale DER aggregation | Mass manipulation of setpoints, geopolitical disruption    | Assign CVE, coordinate with ENISA/CERT-EU, advise national CSIRTs    | Yes (mega testbed)              | JRC / ENTSO-E mega testbed, specialised vendor labs, national CSIRTs           |

## CNA labs in practice

1. CNA role is administrative and coordinating: Its main responsibility is to receive vulnerability reports, validate that they are unique (not already assigned a CVE), and publish CVE entries. You also ensure vendors or discoverers get credit and that proper advisories are issued.

2. PoC validation is usually delegated

   * The CNA can request a minimal test case or proof-of-concept to verify the vulnerability is real, but you rarely need a full-blown lab.
   * Actual exploit testing, attack simulation, and lab experimentation is handled by:

     * Vendors of the affected devices/software
     * Reference labs or sector labs (for industrial/critical devices)
     * National CSIRTs if the CVE affects national infrastructure

3. When a lab might be useful

   * For high-volume submissions or complicated ICS/SCADA CVEs, having access to a shared sandbox or small test harness can help confirm PoCs without touching production systems.
   * But this is usually lightweight, not a full CSIRT or mega testbed setup.

A CNA is mostly about [coordination, verification, and publication](governance.md), not hands-on attack testing.

