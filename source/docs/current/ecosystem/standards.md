# Standards & protocols to watch

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

## Especially

* IEC 61850 and IEC 62351 (security for substation communications).
* DLMS/COSEM (smart metering).
* OCPP (EV charging).
* ICCP/TASE.2 (inter-utility).
* Modbus, DNP3 (legacy ICS).
* Zigbee Green Power, LoRaWAN (LPWAN / home to meter communications).
* TLS / PKI — correct deployment is essential; poor or absent PKI is a recurring gap.
