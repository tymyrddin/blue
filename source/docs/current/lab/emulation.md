# Emulation and firmware analysis

Firmware and simulation tools let me validate PoCs without touching live devices, reducing risk.

## Firmware extraction and analysis

Always check the firmware version matches the target device. Emulation avoids bricking hardware during testing.

- [Binwalk](https://github.com/ReFirmLabs/binwalk) – Extract and inspect firmware images.  
- [Ghidra](https://github.com/NationalSecurityAgency/ghidra) – Decompile and reverse engineer binaries.  
- [QEMU](https://www.qemu.org/) – Emulate device firmware for safe testing.  
- [Firmadyne](https://github.com/firmadyne/firmadyne) – Full system emulation for embedded devices.

## Protocol fuzzing and traffic replay

- [Scapy](https://scapy.net/) – Craft and send network packets (IP, Modbus, Zigbee, etc.) for testing responses.  
- [boofuzz](https://github.com/jtpereyda/boofuzz) – Automate fuzzing of protocol fields and message sequences.  
- [Replay tools](https://goreplay.org/blog/replay-production-traffic-for-realistic-load-testing/) – Use captured traffic to reproduce PoCs and validate fixes.  

## Smart grid simulators

Simulation is not a replacement for live-device validation but helps interpret results and environmental factors.

- [OpenDSS](https://opendss.epri.com/OpenDSSFPCBuild.html), [GridLAB-D](https://gridworks.org/initiatives/distribution-system-modeling-tools/)
- [Comparison of simulators](https://docs.nrel.gov/docs/fy17osti/64228.pdf) – Model electricity flows and grid behaviour.