# Vulnerability research

The part where a firmware image stops being a blob and starts being a list of specific, named problems. The work investigates artefacts in the lab, writes the findings down properly, and hands the Fingerprint Forge something it can act on.

It is conducted by the Obsidian Desk, after acquisition, triage, and extraction have produced a workspace. All of it is static and non-intrusive, inside a controlled, isolated lab on sacrificial hardware or emulated systems. No live devices. No production networks.

Non-intrusive, here, means no modification of firmware artefacts, no exploitation against live targets, and nothing that alters device state outside an emulated or sacrificial context.

## Analysis workspace

Research starts from the populated `analysis/` directory the extraction step left behind. The inputs it leans on:

* The mounted filesystem (`analysis/<vendor>/<device>/<version>/extracted/rootfs/`).
* Extracted binaries from the interesting services (web server, management daemon) under `analysis/<vendor>/<device>/<version>/extracted/binaries/`.
* The triage log (`analysis/<vendor>/<device>/<version>/triage.log`) with the initial `binwalk`, `file`, and `strings` output.
* The source metadata (`artefacts/<vendor>/<device>/<version>/source.yaml`) tying every finding back to one firmware version and hash.

## Static analysis and artefact examination

The first pass examines the firmware's components without running any of it.

### Filesystem and configuration

* Boot process: the init scripts (`/etc/init.d/`, `/etc/rc.d/`, inittab) tend to give up insecure service startup, hardcoded paths, and credentials passed in the clear.
* Configuration files: `/etc/` and the application config directories are where plaintext passwords, default keys, loose settings, and the occasional backdoor account live.
* Web interface: the web server files (CGI, PHP, JS) repay an inventory. Hidden debug endpoints, unprotected admin functions, and client-side secrets are common finds.

### Binary inspection and strings

* Hardcoded secrets: `strings`, `grep`, and the patterns from tools like `BinAbsInspector` or `truffleHog` turn up passwords, API keys, cryptographic seeds, and certificates often enough to be worth the first hour.
* Dependencies: linked libraries (`ldd`, `readelf -d`) reveal the outdated and vulnerable versions. Custom, proprietary network daemons are the ones worth opening up next.

### Network services

* Service identification: the configs and binaries between them list what the device speaks (HTTP/HTTPS, SSH, Telnet, proprietary industrial protocols on their ports). The absence of an expected service is itself a data point, and goes in the record.
* Protocol inspection: for custom protocols, the parsing routines in the related binaries are where input-validation flaws tend to hide.

## Controlled, lab-only emulation

When static analysis needs behavioural context, the firmware or a component can be run, in a place where running it cannot hurt anything.

### Keeping emulation safe

* Complete isolation: the emulation host has no outbound connectivity. Traffic stays inside a virtual lab network.
* Sacrificial basis: emulation only happens on firmware extracted from hardware the lab owns.
* Tooling: `qemu-system` for full-system emulation (ARM, MIPS, and friends), or `unicorn` / `qemu-user` for individual binaries.

### The emulation pass

1. Setup: launch the image or binary in the right emulator (`qemu-system-arm -kernel <kernel> -hda <rootfs>`).
2. Network simulation: `Firmadyne` or custom `qemu` bridging lets the emulated device believe it is on a network, while every packet stays captured internally.
3. Interaction: prod the services (web UI, SSH) the way a user would, to trigger and observe error conditions, map the network-facing interfaces, and confirm a static hypothesis where behavioural confirmation is safe and actually needed. Not every finding earns this step; unambiguous static evidence often stands on its own.
4. Traffic capture: `tcpdump` on the virtual bridge catches the traffic, which is where proprietary protocols and undocumented API calls give themselves away.

## Vulnerability identification and documentation

Findings recorded with precision are the difference between a finding someone can verify and a story someone has to take on trust. This is also the core of the hand-off to the Forge.

### The vulnerability report

Each issue gets a structured entry:

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

### Fingerprint artefacts

Alongside the report, the research picks out the network-visible signatures of this specific vulnerable version. These are the outputs the Forge actually wants:

* Service banners: the exact HTTP `Server:` header, Telnet/SSH login banners, FTP welcome messages.
* HTTP elements: specific cookies (`Cookie: SESSIONID=StaticValue`), response headers (`X-Powered-By: VendorOS/2.1.4`), hidden paths (`/legacy_admin.php`).
* Protocol behaviours: distinctive responses to non-standard probes, such as a unique error on a malformed MODBUS packet.
* String artefacts: any other unique string that surfaces in network traffic or service responses (`"Build_Number: 2025A_Release"`).

A note on what counts. An artefact earns fingerprint status only once it is verified as version-specific; vendor-wide or reused identifiers are noted, but not mistaken for a vulnerability fingerprint. The lot is documented in `analysis/<vendor>/<device>/<version>/notes.md`, with hashes for provenance.

## Hand-off to the Fingerprint Forge

Research is finished when two things are ready:

1. The vulnerability report: the flaw, its location, its impact, and the evidence.
2. The artefact list: a clean list of the network-visible identifiers (banners, strings, behaviours) for this vulnerable version.

Both go to the Forge, which crafts detection signatures from the artefact list and, under the approved protocols, scans for vulnerable deployments and runs the disclosure.

The thread that has to stay unbroken: every finding, every piece of evidence, every artefact traces back to the original firmware hash in `artefacts/<vendor>/<device>/<version>/source.yaml`. The chain from acquisition to vulnerability is the thing that makes the rest of it stand up.
Last updated: 01 June 2026
