# Firmware acquisition

Concrete, reproducible methods to acquire firmware and related artefacts from devices and software, using tools that actually exist and workflows that survive contact with reality.

Positioning: This document is written as an internal laboratory standard (SOP) and published externally for transparency and reuse. It assumes a controlled research environment and prioritises provenance, repeatability, and evidentiary integrity over convenience.

Laboratory context: All procedures below are conducted on sacrificial hardware within an isolated lab network. No production systems. No customer environments. No “just this once”.

The first step in the Obsidian Desk workflow, providing verified binaries for structured research. If acquisition is sloppy, everything downstream is fiction.

## Acquire from vendor packages (baseline)

Typical formats include:

`.bin`, `.img`, `.upd`, `.pkg`, `.rom`, `.exe` / `.msi` (engineering tools), `.apk` / `.ipa` (mobile apps)

Baseline procedure:

1. Download firmware or installer
2. Verify checksum (if provided)
3. Extract contents
4. Record provenance immediately

Vendor packages are the cleanest starting point, when available. They are also the least representative of what actually runs on deployed devices. Treat them as baseline artefacts. Examples below.

### Siemens SIMATIC S7-1212C (non-fail-safe), DC/DC/DC

Order number: 6ES7212-1AE40-0XB0

Intended acquisition path: Siemens tooling (TIA Portal)

Why this device?

* Extremely common in the wild: small plants, OEM panels, building automation, and budget-constrained environments.
* Non-fail-safe: avoids the certification-heavy, legally sensitive F-CPU ecosystem.
* DC/DC/DC variant has a simpler hardware profile and fewer relay-specific artefacts.
* Siemens documentation, tooling, and community material are strongest for the 1212C.
* Representative attack surface:
  * S7CommPlus
  * Embedded web server
  * Firmware update mechanism
* Known historical weaknesses (authentication, information disclosure, hardening gaps).

Why this is painful (and still useful)?

* Firmware is not provided as a standalone binary.
* Access requires registration and tooling approval.
* Firmware artefacts are accessed indirectly via TIA Portal, cached, fragmented, and wrapped in internal package formats.

Expectation management: Siemens firmware acquisition is toolchain archaeology, not a download. You will not get a neat `.bin`. Reproducibility depends on:

* TIA Portal version
* Installed device support packages
* Update workflow used

Record all of this. If you cannot reproduce the environment, you cannot reproduce the artefact.

### Moxa NPort 5250AI-M12

Vendor: Moxa
Product: NPort 5250AI-M12
Firmware version: 2.0
Filename: `moxa-nport-5250ai-m12-models-firmware-v2.0.rom`
Download date: 2026-01-06

Why this device?

* Representative industrial serial-to-Ethernet gateway (common in OT networks).
* Exposes multiple network services (TCP/IP, Modbus/TCP, SNMP, HTTP).
* Manageable size and complexity for lab analysis.
* Firmware publicly available without authentication.

This is what “good” vendor access looks like.

### Vertiv / Liebert IS-UNITY-DP card

Vendor: Vertiv / Liebert
Product: IS-UNITY-DP card
Firmware version: 8.4.7.0
Release date: November 2025
Protocols: Web, Velocity Protocol, SN Sensor, LIFE™, SNMP, SMTP, SMS, Telnet
Compliance claims: California IoT Security Law, UL2900-1, IEC 62443-4-2

Why?

* Embedded industrial management firmware (OT/ICS).
* Rich network surface and web interface.
* Versioned releases with notes and checksums.
* Publicly listed, downloadable for registered users.

Compliance claims are not security guarantees, but they do improve documentation quality.

## Acquire from companion mobile apps (very common)

Mobile apps frequently embed firmware URLs, update logic, API paths, and device identifiers.

### Android (APK)

```bash
apktool d vendor_app.apk
strings classes.dex | less
jadx-gui vendor_app.apk
```

Look for:

* Firmware download URLs
* Update API endpoints
* MQTT topics
* Device identifiers
* TLS pinning material

Firmware downloads are often plain HTTPS blobs referenced directly in the app.

### iOS (IPA)

```bash
unzip vendor_app.ipa
strings Payload/*.app/* | less
```

Use:

* Ghidra or Hopper for binaries
* MitM only in an offline lab, never against live cloud services

If you break pinning to see what the app does, document that you did.

## Acquire via update interception (lab network)

### Setup

* Dedicated lab router or Linux box
* No internet forwarding
* Device connected only to the lab LAN

Tools: `tcpdump`, `mitmproxy`, `ngrep`

```bash
tcpdump -i eth0 -w update_capture.pcap
```

Trigger an update via UI or app. Capture:

* Update URLs
* Firmware blobs
* Version metadata

Do not let the device reach the real internet.

### Common blockers (this is normal)

* TLS certificate pinning
* Encrypted firmware payloads
* Vendor VPN tunnels
* Hardcoded IPs or DoH
* Delta or patch-based updates

If nothing appears on the wire, that is a result, not a failure. Record it.

## Acquire via vendor engineering software

Common for PLCs and industrial devices.

Typical tools:

* Siemens TIA Portal
* Rockwell Studio 5000
* Schneider Control Expert
* Vendor-specific loaders

Procedure

1. Install software in a VM
2. Connect device on isolated LAN
3. Perform read / backup / upload operations
4. Monitor filesystem activity

Firmware artefacts often appear in:

* `ProgramData`
* `AppData`
* Temporary directories
* Vendor cache folders

Filesystem monitoring beats guessing.

## Acquire from removable media

Some devices support firmware export or update via USB or SD.

Procedure

1. Insert blank media
2. Trigger “export”, “backup”, or “update”
3. Capture resulting files

Inspect with:

```bash
binwalk
strings
hexdump -C
```

Do not assume exported backups are complete or unencrypted.

## Acquire via UART (very common, very effective)

Hardware

* USB-TTL adapter (FTDI, CP2102, CH340)
* Jumper wires
* Logic level confirmed (3.3 V vs 5 V)

Identify pins: `TX`, `RX`, `GND`, `VCC`. Confirm with silkscreen or multimeter.

```bash
screen /dev/ttyUSB0 115200
```

Power the device. Common boot environments:

* U-Boot
* RedBoot
* Vendor shells

Look for `printenv`, `bdinfo`, `ls`, `dump`, `read`, `loady`, `loadb`, `tftp`. Capture all output to file.

### Procedure: from console to binary

1. Interrupt boot. Send break during startup to reach bootloader.

2. Map memory. Identify flash layout using:
   * `printenv`
   * `bdinfo`
   * `/proc/mtd` (if Linux shell available)

3. Dump memory.

   * Bootloader: use `md.b`, `dump`, or equivalent; script terminal capture.
   * OS shell: use `dd` on `/dev/mtd*`; exfiltrate via serial or lab-only networking.

4. Reconstruct. Combine partitions (bootloader, kernel, rootfs) into a full image for analysis.

UART often yields more than JTAG, with fewer regrets.

## Acquire via JTAG / SWD (destructive, last resort)

Tools: J-Link, ST-Link, OpenOCD

```bash
openocd -f interface/jlink.cfg -f target/stm32f4x.cfg
```

```bash
dump_image firmware.bin 0x08000000 0x100000
```

Decision point: If read-out protection is enabled, stopping here may be necessary. Continuing may:

* Permanently lock the device
* Cross legal or contractual boundaries
* Consume significant time for little gain

This is not a technical failure. It is a judgement call.

## Acquire from flash chips directly

When everything else fails, hardware:

* SPI programmer (CH341A, Dediprog)
* SOIC clip

```bash
flashrom -p ch341a_spi -r firmware.bin
flashrom -p ch341a_spi -v firmware.bin
```

Sanity checks:

* Perform multiple reads; hashes must match
* Check for all-0xFF / all-0x00 regions
* Compare dump size to expected flash size

Confidence comes from repetition, not hope.
