# EU Players

This list is not exhaustive down to every local integrator.

## Smart meter manufacturers / AMI vendors

Physical meters, head-ends, DLMS/COSEM stacks

* Landis+Gyr — global meter OEM; widespread deployments across Europe.
* Itron — large smart-meter and AMI provider with EMEA presence.
* Iskraemeco — prominent European meter vendor (Central / Eastern Europe).
* Kamstrup — Danish meter maker (water & energy metering).
* Sagemcom / Sagemcom Energy & Telecom — major European meter and HAN player.
* Elster (Honeywell/now part of Honeywell/ID) — legacy and modern meters; many installed bases.
* Sensus (Xylem) — smart-metering and networks in several EU markets.
* ZIV / Echelon (regional vendors) — legacy kit still present in some grids.
* Local/regional meter integrators — often the weak link (custom firmware, bespoke backends).

## EV charger vendors / charge-point operators (CPOs) / OCPP ecosystem

Hardware, station software, management backends

* Wallbox — Spanish EV charger vendor and cloud platform.
* EVBox — Netherlands origin, large European fleet management presence.
* ABB / ABB E-Mobility — industrial player with chargers and backend integration.
* Schneider Electric — EV chargers plus grid integration tools.
* Alfen — Dutch supplier: chargers, storage, and integrator for utilities.
* Easee — Norwegian charger maker, rapid EU growth.
* Rolec, Pod Point, Garo, Circontrol — regional vendors with notable install bases.
* ChargePoint / Tesla (indirectly relevant) — international vendors whose tech or approaches influence EU markets.
* CPOs & MSPs (e.g., NewMotion, bp pulse) — operate charge networks and manage OTA/firmware, thus high-impact targets.

## Inverter / solar / storage manufacturers

For Distributed Energy Resources (DER)

* SMA Solar Technology — German inverter market leader for some segments.
* Fronius — Austrian inverter maker; common in residential/SME PV.
* SolarEdge — power-electronics for PV; large installed base in EU.
* Huawei (FusionSolar) — large inverter vendor active in European markets.
* Sungrow, KACO, ABB (again) — other suppliers with fielded fleets.
* Battery integrators / BMS vendors — increasingly targets because storage enables injection.

## Grid operators, TSOs and DSOs

Operators, essential for incident coordination

* ENTSO-E — European transmission system coordination body.
* TenneT (Netherlands/Germany), RTE (France), Red Eléctrica (Spain), Terna (Italy), Elia (Belgium) — major TSOs.
* National DSOs and municipal utilities — e.g. Enedis (France), E.ON / Innogy distribution arms (Germany), Iberdrola distribution (Spain), Enel Distribuzione (Italy).
* Aggregators / VPP operators — e.g. Next Kraftwerke, small but crucial for DER orchestration.

## Energy suppliers & retailers

Large customers, billing, and cloud integration

* EDF, Enel, Iberdrola, Engie, E.ON, RWE, Vattenfall, SSE — major retailers and suppliers with meter and billing systems that can be impacted by meter-level exploits.

## Platform / cloud / fleet management vendors

Backend orchestration, OTA, provisioning

* Vendor cloud platforms from the OEMs above (e.g., Wallbox Cloud, EVBox OCPP cloud).
* White-label EV/DER platforms and IoT cloud providers (various regional SaaS players).
* MQTT / message broker providers, API gateway vendors used by vendors and CPOs.

## Component & module suppliers

SoCs, Wi-Fi/Zigbee chips, secure elements

* Silicon vendors (Nordic Semiconductor, Silicon Labs, Infineon, STMicro) — their stacks and reference code appear in many devices.
* Secure element / HSM suppliers — Infineon, NXP — matter for key protection and firmware signing.

## Security vendors, test labs & research groups

Potential partners

* Independent testing houses / labs — TUV, KIWA, DEKRA, and specialized OT test labs.
* Academic / research groups — technical universities and OT security centres in Europe (TU Berlin, KTH, TNO, etc.).
* Well-known security firms doing OT/ICS work — various (CrowdStrike, Mandiant, NCC Group, Forescout, Nozomi/Claroty partners in region).

## National programme & procurement entities

Large buyers and policy actors

* Government procurement arms and national cyber programmes funding grid hardening (varies by country).
* EU programmes — CEF, Horizon projects for smart grid pilots (funding and standardisation influence).

## Notes

* When a CVE references a vendor, check: does the vendor use third-party SoCs (Nordic/SiliconLabs)? Is a shared cloud backend involved? That often scales an issue.
* Prioritise device models by installed base in a specific country (DSO procurement lists, regulatory filings, tender winners).
* Make vendor-cloud contacts part of the disclosure playbook: who to call, safe comms channels, SLAs for patches.
* Log vendor supply-chain touchpoints (who signs firmware, who builds the CIM/firmware) — Likely needed during NIS2/CRA interactions.
