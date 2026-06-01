# Fingerprint creation methodology

Turning the Obsidian Desk's static evidence into deterministic detection logic for one specific vulnerable firmware version. No live traffic, no guesswork, just the artefacts and the logic that tells them apart.

Input: the Desk's vulnerability report and artefact list for a given version (`VendorX-DeviceY-Firmware-v2.1.4-sha256:abc123`).

Output: a `fingerprint.yaml` a scanner can implement.

## The shape of it

This is a design task before it is a coding task. The work here is drafting a precise blueprint from static evidence; the code comes afterwards and follows the blueprint without improvising. Keeping the two apart is what makes the whole thing testable and tool-agnostic.

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

## Phase 1: artefacts into probes

The raw material is the artefact list. Anything that needs state, authentication, or behavioural interaction (logins, configuration changes) gets set aside; the focus stays on what is publicly observable without poking anything.

Each artefact becomes a probe definition, written in plain language, each one a single self-contained check.

| Desk Artefact                                    | Probe Definition                                                                                                                                   |
|--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| `HTTP Server Header: "DeviceOS/2.1.4 (VendorX)"` | "Open TCP connection to port 80. Send `GET / HTTP/1.0\r\n\r\n`. Confirm response headers include exact string `Server: DeviceOS/2.1.4 (VendorX)`." |
| `TLS Certificate Serial: "1234-ABCD"`            | "Perform TLS handshake on port 443. Extract certificate serial number. Compare against exact value `1234-ABCD`."                                   |
| `SSH Banner: "SSH-2.0-OpenSSH_8.4p1"`            | "Connect to port 22. Read initial banner. Match regex `^SSH-2\.0-OpenSSH_8\.4p1`."                                                                 |
| `HTML Title: "Device Admin v2.1.4"`              | "HTTP GET on port 80, path `/login.html`. Search response body for `<title>Device Admin v2.1.4</title>`."                                          |

The thing to watch: not every artefact is unique. Some are shared across versions, and a fingerprint built on one of those will cheerfully match the wrong firmware. The static, version-specific strings are the ones that earn their keep.

## Phase 2: match logic

A fingerprint is one or more probe definitions plus the logic that says what counts as a hit for the exact version.

| Target Firmware Version | Probe 1: HTTP Banner       | Probe 2: TLS Cert Serial | Match Logic                                       |
|-------------------------|----------------------------|--------------------------|---------------------------------------------------|
| VendorX Switch v2.1.4   | `"Server: SwitchOS/2.1.4"` | `"1234-ABCD"`            | Match if: (Probe 1 is TRUE)                       |
| VendorX Switch v2.1.5   | `"Server: SwitchOS/2.1.5"` | `"1234-ABCD"`            | Match if: (Probe 1 is TRUE)                       |
| VendorX Router v2.1.4   | `"Server: RouterOS/2.1.4"` | `"5678-EFGH"`            | Match if: (Probe 1 is TRUE) AND (Probe 2 is TRUE) |

The rules of thumb that tend to hold:

1. One unique probe: if a single probe identifies the firmware on its own, it can stand alone.
2. Combination required: where uniqueness needs more than one, AND-logic ties them together.
3. Insufficient data: if no combination is unique, the fingerprint cannot be made yet, and the answer is more artefacts, not looser logic.
4. OR-logic is a last resort: it widens the net and costs specificity, so it earns its place only when nothing else will do.

## Phase 3: static validation

Validation happens before a line of code is written. This is logic checking, not live scanning.

The positive check: confirm every artefact in the probe definitions actually exists in the Desk's `analysis/` files (the `rootfs` dump, the `strings` output). That proves the probe is grounded in something real.

The negative check: run the match logic against artefacts from other versions (v2.1.5, v2.0.0). A v2.1.4 fingerprint that matches any of them is a false-positive generator, and goes back for refinement.

All of it runs on static files. No emulators, no live scanning.

## Phase 4: the fingerprint specification

The deliverable is a specification, not code. A blueprint the scanner reads.

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

| Field            | Purpose                          | Example                                                 |
|------------------|----------------------------------|---------------------------------------------------------|
| `fingerprint_id` | Unique identifier                | `"FP-2026-001"`                                         |
| `target`         | Human-readable description       | `"VendorX DeviceY Firmware v2.1.4"`                     |
| `source_hash`    | Reference to source analysis     | `"sha256:abc123..."`                                    |
| `probes`         | List of probe definitions        | (see above)                                             |
| `match_logic`    | Boolean expression for match     | `"probes[0].receive_match and probes[1].receive_match"` |
| `confidence`     | Likelihood of accurate detection | `"high"`, `"medium"`, `"low"`                           |

What comes out of all this is a blueprint. The implementation follows it, which is the easy part once the thinking is done.
