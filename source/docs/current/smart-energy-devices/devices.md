# Smart energy device focus

Smart energy devices are a swamp of poorly patched IoT and industrial control technologies. To operate 
effectively as a CNA or security analyst in this space, I would need a clear map of the terrain and its players.

## Smart grid and energy IoT basics

The smart energy ecosystem covers devices and systems at both consumer and grid levels:

- Consumer devices: smart meters, home energy management systems, EV chargers, solar inverters, smart plugs, and gateways.
- Grid / industrial devices: substations, control units, PLCs, and sensors that manage energy flows.

## Key communication protocols

Understanding the protocols used by these devices is crucial:

```text
                         +-----------------------------------+
                         |      Inter-utility exchanges      |
                         |  (Transmission operators, TSOs)   |
                         +-----------------------------------+
                         | Protocols:                        |
                         | - ICCP / TASE.2                   |
                         | - Proprietary WAN SCADA links     |
                         +-----------------------------------+
                                         │
                                         │
                    +--------------------------------------------+
                    |        Utility / Grid Control Layer        |
                    |   Substations, control centres, SCADA      |
                    +--------------------------------------------+
                    | Protocols:                                 |
                    | - DNP3 (legacy, still widespread)          |
                    | - IEC 61850 / MMS                          |
                    | - IEC 60870-5 (Europe)                     |
                    | - OPC-UA (increasingly adopted)            |
                    +--------------------------------------------+
                                         │
                                         │
                 +---------------------------------------------------+
                 |         Field / Edge Devices (Operational)        |
                 |  Smart meters, inverters, EV chargers, RTUs, IEDs |
                 +---------------------------------------------------+
                 | Protocols:                                        |
                 | - DLMS/COSEM (smart meters, EU standard)          |
                 | - Modbus / Modbus TCP (legacy controllers)        |
                 | - OCPP (EV chargers)                              |
                 | - OPC-UA (slowly spreading)                       |
                 | - MQTT/CoAP (some new devices)                    |
                 | - LoRaWAN (low-power uplink via LoRaWAN GW →      |
                 |    Network Server at utility / cloud)             |
                 +---------------------------------------------------+
                                         │
                                         │
            +--------------------------------------------------------------+
            |          Consumer / Home IoT (End-user environment)          |
            |   Smart plugs, bulbs, thermostats, gateways, home EMS        |
            +--------------------------------------------------------------+
            | Protocols:                                                   |
            | - Zigbee / Zigbee GP, Z-Wave (mesh networks)                 |
            | - Wi-Fi based APIs (vendor cloud, REST, gRPC, etc.)          |
            | - MQTT / CoAP (increasingly common in smart hubs)            |
            | - Proprietary mobile/cloud integrations                      |
             +-------------------------------------------------------------+
```

## Common vulnerability classes

Smart energy devices suffer from many of the same issues as general IoT, but with energy-specific consequences:

- Default credentials, weak authentication, or hardcoded keys.
- Exposed web interfaces or admin portals accessible over the network.
- Buffer overflows, input validation errors, and logic flaws.
- Firmware signing bypasses and insecure update mechanisms.
- Poor use of TLS/cryptography: self-signed certificates, expired certs, or no certificate validation.

Understanding these classes helps anticipate what kinds of flaws may exist, even without access to specific exploits.

## Ecosystem players

Knowing who builds and operates the infrastructure helps contextualize vulnerabilities and stakeholders:

- EU smart meter manufacturers: Landis+Gyr, Iskraemeco, Itron.
- EV charger vendors: Wallbox, ABB, Schneider Electric.
- Grid operators and energy suppliers: regional and national utilities – they become key stakeholders if vulnerabilities affect the grid or public infrastructure.
