# Hardware and lab infrastructure

A CNA lab needs precise, safe, and purpose-driven hardware. Every component should support reproducing PoCs without touching production networks.

## Target devices

- PoC-specific devices: Only acquire hardware affected by the reported vulnerability—smart plugs, meters, solar inverters, EV chargers, gateways, or sensors.  
- Firmware versions: Ensure the devices match the version(s) cited in the vulnerability report.  
- Emulators / optional devices: Use solar inverter or gateway emulators when real hardware is unavailable.  

## Single-board computers (SBCs) and lab PCs

Raspberry Pi, BeagleBone, or similar SBCs:

- Run local MQTT/CoAP brokers.  
- Simulate controllers or slaves for PoC validation.  
- Capture traffic and log device interactions.  

Dedicated lab PC:  

- For Wireshark, firmware analysis, fuzzing, and running protocol-specific testing tools.  
- Preferably isolated from home/production networks.

## Network and sniffing hardware

- USB protocol sniffers: Zigbee, Z-Wave, or other protocol-specific USB dongles for capturing wireless mesh traffic.  
- Managed switch: Supports VLANs and port mirroring/SPAN to monitor multiple devices simultaneously.  
- Old Wi-Fi router: Create an isolated IoT network air-gapped from my main LAN.  
- Ethernet cables, USB cables, serial/TTL adapters: Required for connecting SBCs, devices, and sniffers. Label everything for clarity.  

## Power and safety

- Switched power strips: Easily cut power to multiple devices at once.  
- Surge protectors / lab-grade extension cords: Prevent accidental spikes from damaging devices or my home infrastructure.  
- Separate circuits if needed: For higher-power devices like EV chargers or inverters.  

## Storage and organisation

- Labelled shelves or bins: Keep PoC devices, adapters, and cables organised by protocol or vulnerability.  
- Static-safe handling: Antistatic mats or wrist straps for sensitive electronics.