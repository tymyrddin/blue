# Firmware acquisition

Getting firmware off a device, or out of a vendor's update bundle, using tools that exist and workflows that survive contact with reality. This is written as an internal laboratory standard and published as-is, on the theory that there is nothing here worth hiding and a fair amount worth borrowing. It assumes a controlled environment and cares more about provenance, repeatability, and evidence than about convenience.

Everything below happens on sacrificial hardware, on an isolated lab network. No production systems. No customer environments. No "just this once".

Acquisition is the first step in the Obsidian Desk workflow, and the one everything else leans on. If it is sloppy, everything downstream is fiction.

## Vendor packages, the baseline

The formats that turn up most often:

`.bin`, `.img`, `.upd`, `.pkg`, `.rom`, `.exe` / `.msi` (engineering tools), `.apk` / `.ipa` (mobile apps)

The baseline procedure is unglamorous:

1. Download the firmware or installer
2. Verify the checksum, where one is offered
3. Extract the contents
4. Record provenance immediately, before it evaporates

Vendor packages are the cleanest starting point when they are available. They are also the least representative of what actually runs on a deployed device, which has usually been patched, half-patched, or never touched since it left the warehouse. They are best treated as baseline artefacts. A few worked examples follow.

### Siemens SIMATIC S7-1212C (non-fail-safe), DC/DC/DC

Order number: 6ES7212-1AE40-0XB0

Intended acquisition path: Siemens tooling (TIA Portal)

Why this device:

* Extremely common in the wild: small plants, OEM panels, building automation, and budget-constrained environments.
* Non-fail-safe, which sidesteps the certification-heavy, legally sensitive F-CPU ecosystem.
* The DC/DC/DC variant has a simpler hardware profile and fewer relay-specific artefacts.
* Siemens documentation, tooling, and community material are strongest for the 1212C.
* A representative attack surface:
  * S7CommPlus
  * Embedded web server
  * Firmware update mechanism
* Known historical weaknesses (authentication, information disclosure, hardening gaps).

The catch, and why it is still worth the bother:

* Firmware is not handed over as a standalone binary.
* Access wants registration and tooling approval first.
* Firmware artefacts arrive indirectly through TIA Portal: cached, fragmented, and wrapped in internal package formats.

A note on expectations. Siemens firmware acquisition is toolchain archaeology. There is no neat `.bin` waiting at the end of it. Reproducibility depends on:

* TIA Portal version
* Installed device support packages
* The update workflow used

All of which is worth writing down. If the environment cannot be reproduced, neither can the artefact.

### Moxa NPort 5250AI-M12

Vendor: Moxa
Product: NPort 5250AI-M12
Firmware version: 2.0
Filename: `moxa-nport-5250ai-m12-models-firmware-v2.0.rom`
Download date: 2026-01-06

Why this device:

* A representative industrial serial-to-Ethernet gateway, common in OT networks.
* Exposes several network services (TCP/IP, Modbus/TCP, SNMP, HTTP).
* Manageable size and complexity for lab analysis.
* Firmware available publicly, no authentication required.

This is roughly what "good" vendor access looks like, and it is rarer than one would like.

### Vertiv / Liebert IS-UNITY-DP card

Vendor: Vertiv / Liebert
Product: IS-UNITY-DP card
Firmware version: 8.4.7.0
Release date: November 2025
Protocols: Web, Velocity Protocol, SN Sensor, LIFE™, SNMP, SMTP, SMS, Telnet
Compliance claims: California IoT Security Law, UL2900-1, IEC 62443-4-2

Why this device:

* Embedded industrial management firmware (OT/ICS).
* A rich network surface and a web interface.
* Versioned releases with notes and checksums.
* Publicly listed, downloadable for registered users.

Compliance claims are not security guarantees. They do tend to come with better documentation, which is its own small mercy.

## Companion mobile apps, very common

Mobile apps are leaky. They frequently carry firmware URLs, update logic, API paths, and device identifiers, all sitting in plain sight for anyone who unpacks them.

### Android (APK)

```bash
apktool d vendor_app.apk
strings classes.dex | less
jadx-gui vendor_app.apk
```

Worth looking for:

* Firmware download URLs
* Update API endpoints
* MQTT topics
* Device identifiers
* TLS pinning material

The firmware itself is often a plain HTTPS blob, referenced directly in the app.

### iOS (IPA)

```bash
unzip vendor_app.ipa
strings Payload/*.app/* | less
```

Tools that earn their place here:

* Ghidra or Hopper for the binaries
* MitM only in an offline lab, never against live cloud services

If pinning has to be broken to see what the app does, that fact belongs in the notes.

## Update interception on the lab network

### Setup

* A dedicated lab router or Linux box
* No internet forwarding
* The device connected only to the lab LAN

Tools: `tcpdump`, `mitmproxy`, `ngrep`

```bash
tcpdump -i eth0 -w update_capture.pcap
```

Trigger an update from the UI or app, and capture:

* Update URLs
* Firmware blobs
* Version metadata

The one rule that does not bend: the device does not reach the real internet.

### Common blockers, all of them normal

* TLS certificate pinning
* Encrypted firmware payloads
* Vendor VPN tunnels
* Hardcoded IPs or DoH
* Delta or patch-based updates

If nothing appears on the wire, that is a result, not a failure. It also goes in the notes.

## Vendor engineering software

Common for PLCs and industrial devices.

Typical tools:

* Siemens TIA Portal
* Rockwell Studio 5000
* Schneider Control Expert
* Vendor-specific loaders

The shape of it:

1. Install the software in a VM
2. Connect the device on an isolated LAN
3. Perform read / backup / upload operations
4. Watch the filesystem while it happens

Firmware artefacts have a habit of turning up in:

* `ProgramData`
* `AppData`
* Temporary directories
* Vendor cache folders

Watching the filesystem beats guessing where the tool left things.

## Removable media

Some devices will export or update firmware over USB or SD, which is obliging of them.

1. Insert blank media
2. Trigger "export", "backup", or "update"
3. Capture whatever lands

Then inspect it:

```bash
binwalk
strings
hexdump -C
```

An exported backup is not guaranteed to be complete, or unencrypted. Pleasant when it is.

## UART, very common and very effective

Hardware:

* A USB-TTL adapter (FTDI, CP2102, CH340)
* Jumper wires
* The logic level confirmed first (3.3 V vs 5 V), because getting this wrong is how a board becomes a paperweight

Identify the pins: `TX`, `RX`, `GND`, `VCC`. The silkscreen or a multimeter will tell you.

```bash
screen /dev/ttyUSB0 115200
```

Power the device. Common boot environments:

* U-Boot
* RedBoot
* Vendor shells

The interesting verbs to reach for are `printenv`, `bdinfo`, `ls`, `dump`, `read`, `loady`, `loadb`, `tftp`, and capturing all output to a file saves repeating the séance later.

### From console to binary

1. Interrupt the boot. A break sent during startup reaches the bootloader.

2. Map the memory. Flash layout shows up through:
   * `printenv`
   * `bdinfo`
   * `/proc/mtd` (if a Linux shell is available)

3. Dump the memory.

   * Bootloader: `md.b`, `dump`, or the local equivalent; the terminal capture can be scripted.
   * OS shell: `dd` on `/dev/mtd*`, then exfiltrate over serial or lab-only networking.

4. Reconstruct. The partitions (bootloader, kernel, rootfs) combine into a full image for analysis.

UART often yields more than JTAG, with fewer regrets.

## JTAG and SWD, destructive, last resort

Tools: J-Link, ST-Link, OpenOCD

```bash
openocd -f interface/jlink.cfg -f target/stm32f4x.cfg
```

```bash
dump_image firmware.bin 0x08000000 0x100000
```

A decision point worth pausing at. If read-out protection is enabled, stopping here may be the sensible move. Pressing on can:

* Permanently lock the device
* Cross a legal or contractual line
* Burn a lot of time for very little

Stopping is not a technical failure. It is a judgement call, and usually the right one.

## Flash chips, directly

When everything else has failed, there is always hardware:

* An SPI programmer (CH341A, Dediprog)
* A SOIC clip

```bash
flashrom -p ch341a_spi -r firmware.bin
flashrom -p ch341a_spi -v firmware.bin
```

Sanity checks before trusting the dump:

* Read it more than once; the hashes want to match
* Look for all-`0xFF` / all-`0x00` regions, which usually mean a bad read
* Compare the dump size against the expected flash size

Confidence comes from repetition, not hope.
