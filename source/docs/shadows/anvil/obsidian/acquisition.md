# Firmware acquisition

This page describes concrete methods to acquire firmware and related artefacts from devices and software, using tools that actually exist.

## Acquire from vendor packages (baseline)

Typical formats: `.bin`, `.img`, `.upd`, `.pkg`, `.exe` / `.msi` (engineering tools), `.apk` / `.ipa` (mobile apps), `.rom`

Steps:

1. Download firmware or installer
2. Verify checksum (if provided)
3. Extract contents

### Siemens CPU 1212C (non-fail-safe), DC/DC/DC — 6ES7212-1AE40-0XB0

I had in mind to download from [Siemens](https://support.industry.siemens.com/cs/document/109976907/firmware-v4-7-for-s7-1200-available).

Why?

- Common in the wild. The 1212C is one of the most widely deployed S7-1200 CPUs. It shows up in small plants, OEM panels, building automation, and places where budgets went to lunch and never came back.
- Non-fail-safe: Study ordinary firmware, not the legally-sensitive, certification-heavy world of F-CPUs.
- DC/DC/DC variant has a simple hardware profile, fewer relay-specific quirks, and is most common in control cabinets. AC/DC/Rly is electrically noisier and operationally irrelevant for firmware research.
- Siemens documentation, update tooling, and community material are best for the 1212C. Method, not heroics.
- Representative attack surface: S7CommPlus; Embedded web server; Firmware update mechanism. 
- Known historical issues (auth, info disclosure, hardening gaps)

Why not?

- It is required to register and receive permission
- The firmware can only be accessed via the TIA portal (see below).

### Moxa / Nport 5000ai-m12

[Moxa](https://www.moxa.com/en/products/industrial-edge-connectivity/serial-device-servers/industrial-device-servers/nport-5000ai-m12-series#resources) 
offers several firmwares without hassle. 

- Vendor: Moxa
- Product: NPort 5250AI-M12
- Firmware version: 2.0
- Filename: moxa-nport-5250ai-m12-models-firmware-v2.0.rom
- Download date: 2026-01-06

Why?

- Representative of a standard industrial gateway with M12 connectors (common in OT networks)
- Runs network services (TCP/IP, Modbus/TCP, SNMP, etc.)
- Size and complexity manageable for lab analysis.
- Publicly available firmware; no login required.

### Vertiv / Liebert IS-UNITY-DP card

[Vertiv](https://www.vertiv.com/nl-emea/support/software-download/monitoring/liebert-intellislot-communications-interface-cards/) 
also offers firmwares without hassle. 

- Vendor: Vertiv / Liebert
- Product: IS-UNITY-DP card (used in Liebert AC Power and Liebert iCOM v4 Thermal Management units)
- Firmware Version: 8.4.7.0
- Release Date: November 2025
- Release Notes / Reference: IS-UNITY_8.4.7.0
- Protocols: Web, Velocity Protocol, SN Sensor, LIFE™ Services, SNMP, SMTP, SMS, Telnet
- Compliance: California IoT Security Law, UL2900-1, IEC 62443-4-2

Why:

- Embedded industrial firmware (OT/ICS domain)
- Contains network services, management protocols, and web interface — perfect for artefact extraction
- Versioned with release notes and checksums (important for integrity & reproducibility)
- Publicly listed on Vertiv support site, downloadable for registered users

## Acquire from companion mobile apps (very common)

Android (APK):

```bash
apktool d vendor_app.apk
strings classes.dex | less
```

Also:

```bash
jadx-gui vendor_app.apk
```

Look for:

* Firmware URLs
* Update API paths
* MQTT topics
* Device identifiers
* TLS pinning material

Firmware downloads are often plain HTTPS blobs referenced in the app.

iOS (IPA):

```bash
unzip vendor_app.ipa
strings Payload/*.app/* | less
```

Use:

* Ghidra or Hopper for binaries
* MitM only offline, never against real cloud services

## Acquire via update interception (lab network)

### Setup

* Dedicated lab router or Linux box
* No internet forwarding
* Device connected only to lab LAN

Tools: `tcpdump`, `mitmproxy`, `ngrep`

Example:

```bash
tcpdump -i eth0 -w update_capture.pcap
```

Power device, trigger update via UI or app. Extract: Update URLs, Firmware blobs, Version metadata. Do not let device reach the real internet.

## Acquire via vendor engineering software

Very common for PLCs and industrial devices.

Typical tools: Siemens TIA Portal, Rockwell Studio 5000, Schneider Control Expert, Vendor-specific loaders

Procedure:

1. Install software in VM
2. Connect device on isolated LAN
3. Use read / backup / upload from device
4. Capture resulting firmware or backup files

Often stored in: ProgramData, AppData, temp directories. Monitor filesystem during operation.

## Acquire from removable media

Some devices support firmware via USB or SD.

Procedure:

1. Insert blank media
2. Trigger “export”, “backup”, or “update”
3. Capture resulting files

Inspect with:

```bash
binwalk
strings
hexdump -C
```

## Acquire via UART (very common, very effective)

Hardware: USB-TTL adapter (FTDI, CP2102, CH340), Jumper wires, Logic level confirmed (3.3V vs 5V)

Identify pins:

```text
TX RX GND VCC
```

Use multimeter or board silkscreen.

Connect and listen:

```bash
screen /dev/ttyUSB0 115200
```

Power device. Common bootloaders: U-Boot, RedBoot, Vendor custom shells.

Look for commands like `printenv`, `ls`, `dump`, `read`

Sometimes: `loady`, `loadb`, `tftp`

Capture output to file.

## Acquire via JTAG / SWD (destructive, last resort)

Tools: J-Link, ST-Link, OpenOCD.

Example:

```bash
openocd -f interface/jlink.cfg -f target/stm32f4x.cfg
```

Dump flash:

```bash
dump_image firmware.bin 0x08000000 0x100000
```

Only do this on sacrificial hardware.

## Acquire from flash chips directly

When everything else fails.

Hardware:

* SPI flash programmer (CH341A, Dediprog)
* SOIC clip

Steps:

1. Identify flash chip
2. Read contents
3. Verify dump consistency

```bash
flashrom -p ch341a_spi -r firmware.bin
flashrom -p ch341a_spi -v firmware.bin
```

## Integrity and verification

Make sure every artefact can be trusted, traced, and reproduced without argument. Firmware that cannot be proven to 
be unchanged is not evidence; it is gossip.

### Hashing and checksums for provenance

Immediately after acquisition, calculate cryptographic hashes before any analysis.

Minimum required:

```bash
sha256sum firmware.bin > firmware.bin.sha256
```

Recommended (for cross-tool comparison):

```bash
sha1sum firmware.bin >> firmware.bin.sha256
md5sum firmware.bin >> firmware.bin.sha256
```

Record hashes for:

* Raw firmware images
* Extracted partitions
* Companion software packages
* Decompiled binaries and artefact bundles

Hashes must be:

* Stored alongside the artefact
* Logged in the lab register
* Never recalculated over modified files

If a hash changes, the file is no longer the same artefact. Treat it as such.

### Version control and metadata tagging

Every artefact requires a minimum metadata record, regardless of perceived importance.

Required fields:

* Vendor
* Product / device model
* Firmware version (claimed and observed)
* Acquisition method (download, UART, JTAG, app extraction, etc.)
* Date and operator
* Source (URL, device serial, archive, regulator, etc.)
* Hash values

This metadata lives:

* In a structured metadata file (YAML or JSON)
* In the lab index
* In version control alongside notes and scripts

Firmware binaries themselves are not committed to Git.
Metadata, scripts, notes, and extracted artefact manifests are.

If you cannot say where a file came from, it does not exist.

## Storage and cataloguing

Make sure artefacts remain findable, comparable, and usable years later. Memory fades. Filing systems endure.

### Lab filing structure

Example baseline layout:

```text                                                                           
.
├── analysis
│   ├── moxa
│   │   └── nport
│   │       └── 5250ai-m12
│   │           └── 2.0
│   └── vertiv
│       └── liebert
│           └── is-unity
│               └── 8.4.7.0
├── artefacts
│   ├── moxa
│   │   └── nport
│   │       └── 5250ai-m12
│   │           └── 2.0
│   └── vertiv
│       └── liebert
│           └── is-unity
│               └── 8.4.7.0
├── firmwares
│   ├── extracted
│   │   ├── moxa
│   │   │   └── nport
│   │   │       └── 5250ai-m12
│   │   │           └── 2.0
│   │   └── vertiv
│   │       └── liebert
│   │           └── is-unity
│   │               └── 8.4.7.0
│   └── raw
│       ├── moxa
│       │   └── nport
│       │       └── 5250ai-m12
│       │           ├── 2.0
│       │           │   ├── moxa-nport-5250ai-m12-models-firmware-v2.0.rom
│       │           │   ├── moxa-nport-5250ai-m12-models-firmware-v2.0.rom.sha512
│       │           │   ├── notes.md
│       │           │   └── source.txt
│       │           └── moxa-nport-5250ai-m12-models-firmware-v2.0.rom.sha512
│       └── vertiv
│           └── liebert
│               └── is-unity
│                   └── 8.4.7.0
│                       └── is-unity_8.4.7.0_00166_appfwupdt.zip
├── lab-notes
└── reports
    ├── moxa
    │   └── nport
    │       └── 5250ai-m12
    │           └── 2.0
    └── vertiv
        └── liebert
            └── is-unity
                └── 8.4.7.0

48 directories, 6 files                         
```

Do not improvise directory names. Consistency beats creativity.

### Tagging and classification

Each firmware artefact can be tagged by:

* Vendor
* Device family
* Protocols present (Modbus, S7, HTTP, MQTT, etc.)
* Architecture (ARM, MIPS, PowerPC, etc.)
* Interface types (web UI, serial, fieldbus)
* Acquisition confidence (high / medium / uncertain)

Tags are stored in metadata, not filenames. Filenames remain boring on purpose.

```bash
nano source.txt
```

```text
Vendor: Moxa
Product: NPort 5250AI-M12
Firmware version: 2.0
Filename: moxa-nport-5250ai-m12-models-firmware-v2.0.rom
Source: Moxa support site (public firmware)
Acquired: YYYY-MM-DD
Analyst: <your initials>
Notes: No device interaction required
```

### Retention and immutability

* Raw firmware is read-only
* Extracted artefacts are derived, not replaced
* Notes reference artefacts by hash, not filename
* Deletions require supervisor sign-off

The vault is not a scratch directory. It is evidence storage.

### Importance

When the Fingerprint Forge asks: *“Which exact firmware did this come from?”*

There must be only one possible answer. Anything less is how mistakes happen, and the Patrician dislikes mistakes that make noise.



