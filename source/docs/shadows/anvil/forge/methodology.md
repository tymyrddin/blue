# Fingerprint creation methodology

Create deterministic detection logic for specific vulnerable firmware versions using only static artefacts from the Obsidian Desk.

Input: Obsidian Desk's Vulnerability Report and Artefact List for a specific firmware version (e.g., `VendorX-DeviceY-Firmware-v2.1.4-sha256:abc123`).

Output: A `fingerprint.yaml` specification that can be implemented in a scanner.

## Overview

Fingerprint creation is a design and logic task. You are an engineer drafting a precise blueprint from static evidence. 
Coding comes next, guided entirely by these blueprints. This separation keeps the process clean, testable, and 
tool-agnostic.

## Process flow

```
                   +------------------------+
                   | Obsidian desk analysis |
                   +------------------------+
                             |
                             v
                   +-------------------+
                   | Artefact extraction|
                   +-------------------+
                             |
                             v
                   +-------------------+
                   |   Probe design    |
                   +-------------------+
                             |
                             v
                   +-----------------------+
                   | Match logic definition|
                   +-----------------------+
                             |
                             v
                   +-------------------+
                   | Static validation |
                   +-------------------+
                             |
                             v
                        +----------+
                        | Specific?|
                        +----------+
                             |
                       +-----+-----+
                       |           |
                  No<--+           +-->Yes
                       |           |
                       v           v
                +-------------+  +---------------------+
                |  Refine &   |  | YAML Specification  |
                |  Loop Back  |  | (fingerprint.yaml)  |
                +-------------+  +---------------------+
                                             |
                                             v
                                    +-------------------------+
                                    | Scanner Implementation  |
                                    +-------------------------+
```

## Phase 1: Translating artefacts into probes

The raw material is the *Artefact List*. Ignore anything that requires state, authentication, or behavioural 
interaction (logins, configuration changes). Focus only on publicly observable items.

For each artefact, write a Probe Definition in plain language. Each probe defines a single, self-contained check.

### Examples

| Desk Artefact                                    | Probe Definition                                                                                                                                   |
|--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| `HTTP Server Header: "DeviceOS/2.1.4 (VendorX)"` | "Open TCP connection to port 80. Send `GET / HTTP/1.0\r\n\r\n`. Confirm response headers include exact string `Server: DeviceOS/2.1.4 (VendorX)`." |
| `TLS Certificate Serial: "1234-ABCD"`            | "Perform TLS handshake on port 443. Extract certificate serial number. Compare against exact value `1234-ABCD`."                                   |
| `SSH Banner: "SSH-2.0-OpenSSH_8.4p1"`            | "Connect to port 22. Read initial banner. Match regex `^SSH-2\.0-OpenSSH_8\.4p1`."                                                                 |
| `HTML Title: "Device Admin v2.1.4"`              | "HTTP GET on port 80, path `/login.html`. Search response body for `<title>Device Admin v2.1.4</title>`."                                          |

Key Insight: Not every artefact is unique. Some may be shared across versions. Focus on static, version-specific strings.

## Phase 2: Defining match logic

A Fingerprint is one or more Probe Definitions combined with match logic. Decide what constitutes a positive match for the exact firmware version.

### Logic table example

| Target Firmware Version | Probe 1: HTTP Banner       | Probe 2: TLS Cert Serial | Match Logic                                       |
|-------------------------|----------------------------|--------------------------|---------------------------------------------------|
| VendorX Switch v2.1.4   | `"Server: SwitchOS/2.1.4"` | `"1234-ABCD"`            | Match if: (Probe 1 is TRUE)                       |
| VendorX Switch v2.1.5   | `"Server: SwitchOS/2.1.5"` | `"1234-ABCD"`            | Match if: (Probe 1 is TRUE)                       |
| VendorX Router v2.1.4   | `"Server: RouterOS/2.1.4"` | `"5678-EFGH"`            | Match if: (Probe 1 is TRUE) AND (Probe 2 is TRUE) |

### Decision rules

1. Single Unique Probe: If one probe uniquely identifies the firmware, use it alone
2. Combination Required: If multiple probes needed for uniqueness, combine with AND logic
3. Insufficient Data: If no combination is unique, fingerprint cannot be created (need more artefacts)
4. Avoid OR Logic: Reduces specificity; use only when absolutely necessary

## Phase 3: Static validation

Validation occurs before any code is written. This is logic checking, not live scanning.

### Positive check

Confirm every artefact in the Probe Definitions exists in the Desk's `analysis/` files (e.g., `rootfs` dump, `strings` 
output). This proves the probe is valid.

### Negative check (False positives)

Use analysis of other firmware versions (v2.1.5, v2.0.0). Run thw match logic against artefacts from these versions. 
A v2.1.4 fingerprint must *not* match any other version.

All validation uses static files only. No emulators. No live scanning.

## Phase 4: The Fingerprint Specification

The deliverable is a specification document, not code. It is a blueprint for the scanner.

### Example `fingerprint.yaml`

```yaml
fingerprint_id: "FP-2026-001"
target: "VendorX DeviceY Firmware v2.1.4"
source_hash: "sha256:abc123..."
probes:
  - protocol: "tcp/http"
    port: 80
    send: "GET / HTTP/1.0\r\nHost: {{target}}\r\n\r\n"
    receive_match: "Server: DeviceOS/2\\.1\\.4 \\(VendorX\\)"
match_logic: "probes[0].receive_match == true"
author: "@forge"
date_validated: "2026-01-14"
validation_note: "Logic passes positive check against rootfs dump. Does not match string data from v2.1.5 or v2.0.0."
confidence: "high"
```

### Field definitions

| Field            | Purpose                          | Example                                                 |
|------------------|----------------------------------|---------------------------------------------------------|
| `fingerprint_id` | Unique identifier                | `"FP-2026-001"`                                         |
| `target`         | Human-readable description       | `"VendorX DeviceY Firmware v2.1.4"`                     |
| `source_hash`    | Reference to source analysis     | `"sha256:abc123..."`                                    |
| `probes`         | List of probe definitions        | (see above)                                             |
| `match_logic`    | Boolean expression for match     | `"probes[0].receive_match and probes[1].receive_match"` |
| `confidence`     | Likelihood of accurate detection | `"high"`, `"medium"`, `"low"`                           |

This methodology produces blueprints. Implementation comes next, guided by these precise specifications.
