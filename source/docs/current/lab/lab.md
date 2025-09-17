# Simplistic lab diagram

```text
                          ┌─────────────────────────────┐
                          │ Version-controlled Lab Repo │
                          │ & CVE / Issue Tracker       │
                          └─────────────┬───────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Documentation & │
                              │ Templates       │
                              └─────────┬───────┘
                                        │
                                        ▼
                        ┌─────────────────────────────┐
                        │    Isolated Lab Network     │
                        │    (Air-gapped, VLANed)     │
                        └─────────┬──────────┬────────┘
                                  │          │
                 ┌────────────────┘          └─────────────────┐
                 ▼                                             ▼
       ┌─────────────────┐                            ┌─────────────────┐
       │ Managed Switch  │                            │ Dedicated Router│
       │ VLANs + SPAN    │                            │ NAT + DHCP      │
       └───────┬─────────┘                            └────────┬────────┘
               │                                               │
    ┌──────────┼───────────┐                      ┌────────────┼───────────┐
    ▼          ▼           ▼                      ▼            ▼           ▼
┌────────┐ ┌────────┐ ┌─────────┐            ┌──────────┐  ┌────────┐ ┌──────────┐
│ Smart  │ │ Smart  │ │ Solar   │            │ Raspberry│  │ SBC    │ │ Lab PC   │
│ Plug   │ │ Meter  │ │ Inverter│            │ Pi/BBB   │  │ /MQTT  │ │ Wireshark│
└───┬────┘ └───┬────┘ └────┬────┘            └────┬─────┘  └────┬───┘ └────┬─────┘
    │          │           │                      │             │          │
    │          │           │                      │             │          │
    └──────────┴───────────┘                      │             │          │
        Connected via Ethernet / Wi-Fi            │             │          │
                                                  ▼             ▼          ▼
                                               ┌─────────────────────────────┐
                                               │ USB Sniffers / Protocol     │
                                               │ Dongles (Zigbee/Z-Wave)     │
                                               └───────────────┬─────────────┘
                                                               │
                                                               ▼
                                                  ┌───────────────────────┐
                                                  │ Firmware & Emulation  │
                                                  │ Tools (Binwalk, Ghidra│
                                                  │ QEMU, Firmadyne)      │
                                                  └───────────────────────┘

        ┌───────────────────────────────────────────────────────────┐
        │ Power & Safety Infrastructure                             │
        │ - Switched Power Strips                                   │
        │ - Surge Protectors / Lab-grade Extension Cords            │
        │ - Separate Circuits for High-Power Devices                │
        └───────────────────────────────────────────────────────────┘
```
