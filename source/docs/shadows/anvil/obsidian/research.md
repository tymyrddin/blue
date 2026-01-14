# Vulnerability research

Purpose: To systematically investigate firmware artefacts in a laboratory setting to identify security vulnerabilities, document findings, and provide actionable intelligence for the Fingerprint Forge.

Context: This work is conducted by the Obsidian Desk. It follows the successful acquisition, triage, and extraction of a firmware binary. All analysis is static and non-intrusive, performed within a controlled, isolated lab environment on sacrificial hardware or emulated systems. No testing is performed against live devices or production networks. *Non-intrusive means no modification of firmware artefacts, no exploitation against live targets, and no actions that would alter device state outside emulated or sacrificial contexts.*

## Workflow Input: The Analysis Workspace

Research begins with the populated `analysis/` directory structure, as created by the Firmware Acquisition and Initial Triage process. The primary inputs are:

* The mounted filesystem (`analysis/<vendor>/<device>/<version>/extracted/rootfs/`).
* Extracted binaries from key services (e.g., web server, management daemon) located under `analysis/<vendor>/<device>/<version>/extracted/binaries/`.
* The triage log (`analysis/<vendor>/<device>/<version>/triage.log`) containing initial `binwalk`, `file`, and `strings` output.
* The source metadata (`artefacts/<vendor>/<device>/<version>/source.yaml`) linking all findings to a specific firmware version and hash.

## 1. Static Analysis & Artefact Examination

The first phase involves examining the firmware's components without execution.

### Filesystem and Configuration Analysis

* Boot Process: Examine initialisation scripts (`/etc/init.d/`, `/etc/rc.d/`, inittab) for insecure service startup, hardcoded paths, or credential passing.
* Configuration Files: Audit files in `/etc/` and application-specific config directories for plaintext passwords, default keys, insecure settings, or backdoor accounts.
* Web Interface: Inventory and examine all web server files (CGI, PHP, JS). Look for hidden debug endpoints, unprotected administrative functions, and client-side secrets.

### Binary Inspection and String Analysis

* Hardcoded Secrets: Use `strings`, `grep`, and tools like `BinAbsInspector` or `truffleHog` patterns to search binaries and libraries for passwords, API keys, cryptographic seeds, and certificates.
* Dependency Analysis: Check linked libraries (`ldd`, `readelf -d`) for outdated, vulnerable versions. Identify custom, proprietary network daemons for deeper inspection.

### Network Service Mapping

* Service Identification: From configs and binaries, list all network services the device runs (e.g., HTTP/HTTPS, SSH, Telnet, proprietary industrial protocols on specific ports). The absence of an expected service is itself a data point and must be recorded.
* Protocol Inspection: For custom protocols, analyse related binaries for parsing routines to identify potential input validation flaws.

## 2. Controlled, Lab-Only Emulation

When static analysis requires behavioural context, firmware or specific components can be run in a safe, isolated environment.

### Principles of Safe Emulation

* Complete Isolation: The emulation host has no outbound network connectivity. All traffic is contained within a virtual lab network.
* Sacrificial Basis: Emulation is only performed on firmware extracted from hardware owned by the lab.
* Tooling: Use `qemu-system` (for full system emulation of ARM, MIPS, etc.) or `unicorn`/`qemu-user` (for individual binary emulation).

### Emulation Process

1. Setup: Launch the firmware image or binary in the appropriate emulator (e.g., `qemu-system-arm -kernel <kernel> -hda <rootfs>`).
2. Network Simulation: Use tools like `Firmadyne` or custom `qemu` network bridging to allow the emulated device to think it is on a network, while ensuring all traffic is captured internally.
3. Interaction: Interact with the device's services (web UI, SSH) as a user would. This is used to:

   * Trigger and observe error conditions.
   * Map the full functionality of network-accessible interfaces.
   * Confirm hypotheses from static analysis where behavioural confirmation is safe and necessary. *Not all findings require emulated verification; static evidence alone may be sufficient where impact is unambiguous.*
4. Traffic Capture: Use `tcpdump` on the virtual bridge to capture network traffic for analysis of proprietary protocols or to identify undocumented API calls.

## 3. Vulnerability Identification & Documentation

Findings must be recorded with precision to enable both verification and operational use.

### Creating the Vulnerability Report

For each identified issue, create a structured entry. This will form the core of the hand-off to the Fingerprint Forge.

```markdown
## ANVIL-RES-2026-001: Vendor X Device Y - Hardcoded Credential in Web API
Status: CONFIRMED
Vulnerability Type: CWE-798: Use of Hardcoded Credentials.
Severity: High
Affected Version: Firmware v2.1.4 (hash: sha256:abc123...).
Location: Binary: `analysis/<vendor>/<device>/<version>/extracted/binaries/web_server`. Function: `auth_check()` at offset `0x12345`.
Description: The web server's administrative API authenticates using a username and password string (`"admin:SuperS3cret2025!"`) compiled directly into the binary.
Static Evidence: String present in `web_server` binary. Confirmed via `strings` and disassembly in Ghidra.
Behavioural Evidence (if emulated): Successfully authenticated to `/admin.cgi` endpoint in lab emulation using the credential.
Potential Impact: Full compromise of device administrative interface.
```

### Extracting Fingerprint Artefacts

Concurrently, the research must identify the unique, network-visible signatures of the *specific vulnerable firmware version*. These are the key outputs for the Forge.

* Network Service Banners: Exact HTTP `Server:` header, Telnet/SSH login banners, FTP welcome messages.
* Unique HTTP Elements: Specific cookies (`Cookie: SESSIONID=StaticValue`), response headers (`X-Powered-By: VendorOS/2.1.4`), or hidden paths (`/legacy_admin.php`).
* Protocol Behaviours: Specific responses to non-standard probes (e.g., a unique error on a malformed MODBUS packet).
* Binary/String Artefacts: Any other unique string that appears in network traffic or service responses (e.g., `"Build_Number: 2025A_Release"`).

*Artefacts must be verified as version-specific; vendor-wide or reused identifiers are noted but not treated as vulnerability fingerprints.* These artefacts are documented in the `analysis/<vendor>/<device>/<version>/notes.md` file alongside hashes for provenance.

## 4. Hand-off to the Fingerprint Forge

Research is complete when two artefacts are ready:

1. The Vulnerability Report: A complete, technical document detailing the flaw, its location, impact, and evidence.
2. The Artefact List: A clean list of the network-visible identifiers (banners, strings, behaviours) for the specific vulnerable firmware version.

These are passed to the Fingerprint Forge. The Forge's responsibility is to craft operational detection signatures from the artefact list and, following approved protocols, scan for vulnerable deployments and manage responsible disclosure.

Integrity: All findings, evidence, and artefacts must be meticulously linked back to the original firmware hash in the canonical `artefacts/<vendor>/<device>/<version>/source.yaml` metadata. The chain of evidence from acquisition to vulnerability must remain unbroken.
