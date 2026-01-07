# Artefact extraction

Extract stable, passive identifiers from firmware and related artefacts so that the Fingerprint Forge can later recognise devices on the internet **without ever speaking to them**.

This is not vulnerability research. This is not scanning. This is careful, clerical theft of facts the firmware has already volunteered.

## Types of artefacts

Artefacts are **static identifiers** embedded in firmware or companion software. They must be:

* Extractable offline
* Observable without interaction
* Stable across deployments of the same firmware

### Banner strings and protocol constants

These include:

* Service banners (HTTP, FTP, Telnet, SNMP)
* Protocol identifiers and magic constants
* Device or platform identifiers embedded in binaries

**Moxa example**

From the extracted filesystem:

```bash
grep -Rni "NPort" .
grep -Rni "MOXA" .
grep -Rni "5250" .
```

Common findings include:

* Product names hardcoded into binaries
* SNMP `sysDescr` strings
* Protocol identifiers used in Modbus or proprietary services

These strings are ideal fingerprints because they are:

* Consistent
* Boring
* Forgotten by vendors

Which makes them reliable.

### Web UI assets, HTTP headers, embedded frameworks

Most industrial gateways ship with a small web server. It is rarely original.

Artefacts include:

* HTML titles and footers
* JavaScript filenames and comments
* Embedded web frameworks (Boa, GoAhead, lighttpd)
* Static image assets (logos, icons, CSS)

**Moxa example**

```bash
find . -iname "*.html" -o -iname "*.js" -o -iname "*.css"
```

Then:

```bash
sha256sum web/images/*.png
sha256sum web/js/*.js
```

A single PNG hash reused across thousands of devices is a gift from the gods.

Headers (server strings, cookies) are noted here *only if visible in firmware defaults*, not tested live.

### TLS certificates, serial numbers, cryptographic fingerprints

Common sins include:

* Vendor‑signed certificates reused across devices
* Predictable serial formats
* Embedded CA certificates
* Hardcoded private keys (yes, really)

**Moxa example**

```bash
find . -iname "*.crt" -o -iname "*.pem" -o -iname "*.key"
openssl x509 -in device.crt -noout -subject -issuer -dates -serial
```

Even when keys are unique, **issuer patterns and validity quirks** often are not. These are prime Forge material.

### API endpoints, default configurations, companion software paths

Artefacts also live in configuration and glue code:

* REST or proprietary API paths
* Default config files
* MQTT topics
* Update endpoints
* Cloud relay hostnames

**Moxa example**

```bash
grep -Rni "/api/" .
grep -Rni "http://" .
grep -Rni "https://" .
```

Paths and hostnames that never change across installs are fingerprints wearing false moustaches.

## Extraction methods

Extraction is mechanical. Interpretation comes later.

### Offline string scanning and regex search

The workhorse:

```bash
strings -a binaryfile | grep -Ei "moxa|nport|http|snmp"
```

Use regex sparingly. The goal is **repeatability**, not cleverness.

Anything found must be:

* Locatable again
* Extractable by another analyst
* Explainable without hand‑waving

### Checksum hashing

Used for:

* Static web assets
* Embedded binaries
* Certificates

Example:

```bash
sha256sum web/js/app.js > app.js.sha256
```

Hashes are stored verbatim. Do not rename files to “interesting.js”. That way lies madness. I know.

### Safe disassembly (read-only)

Disassembly is used to:

* Confirm strings are actually referenced
* Locate protocol constants
* Identify embedded service logic

It is **not** used to execute code.

Ghidra, radare2, or objdump are acceptable.

If disassembly reveals behaviour that would require execution to confirm, stop and note it. That is a different page.

### Emphasis on reproducibility

Every artefact must answer three questions:

1. Where did it come from?
2. How was it extracted?
3. Can someone else extract it again?

If the answer to any is “probably”, it does not leave the Desk.

## Metadata tagging

Artefacts without context are just trivia.

### Unsafe or sensitive artefacts

Some artefacts are dangerous to mishandle:

* Credentials
* Keys
* Instructions affecting physical processes

These are:

* Retained
* Clearly marked
* Never forwarded to the Forge unlabelled

Example tag:

```
SENSITIVE: embedded private key
DO NOT DEPLOY AS FINGERPRINT
```

The Forge does not need surprises.

### Versioned artefact maps

Artefacts are recorded with:

* Vendor
* Device family
* Exact firmware version
* File path and offset (where applicable)

For example:

```
Vendor: Moxa
Device: NPort 5250AI-M12
Firmware: 2.0
Artefact: HTTP server banner string
Location: /usr/sbin/httpd (offset 0x01A3F2)
```

This allows correlation across versions later, when patterns emerge. They always do.

### Correlation to device types and vendors

Artefacts are grouped so the Forge can later ask:

* “Which devices share this string?”
* “Which firmware introduced this header?”
* “Which vendors reuse this framework?”

The Desk does not answer those questions. It merely ensures they can be asked.

### Closing note (written in pencil, not ink)

If an artefact would only be visible *after* sending a packet, logging in, or pressing a button:

It does not belong here. Put it back on the shelf, label it “interesting”, and walk away. The city remains standing because clerks know when to stop.
