# Inferred PoC validation paths for the Wolfbox cluster

Inferred, defensive validation paths that a CNA administrator most likely follows when validating the Wolfbox 
level-2 EV charger CVE cluster. The descriptions are reverse-engineered from advisories and an evenso 
speculative lab setup. Nothing here claims to be a verbatim log; each step is phrased as what is 
most likely done, observed or recorded. The focus is on deterministic observation, evidence collection and 
mitigation verification without providing (inferred) exploit code.

## Environment and prerequisites (most likely present)

* [Lab setup](../lab.md)
* Isolation: a dedicated VLAN and a managed switch with SPAN mirroring are configured to avoid producing side effects on production networks.
* Hardware likely present: Wolfbox level-2 charger (matching model/revision where possible), a dedicated lab PC running analysis tools, a Raspberry Pi to host stub services, a serial/TTL adapter for console capture, USB protocol dongles if needed, switched power strip and surge protection.
* Software examples that are installed in the analysis VM: `wireshark`, `tcpdump`, `nmap`, `nikto`, `curl`, `openssl`, `binwalk`, `ghidra`/`gdb`, `qemu`/`firmadyne`, `scapy` and `boofuzz` (the latter used only under strict constraints).
* A private evidence repository with naming and access controls is created to manage artefacts.

## Preparatory actions (most likely taken)

1. VLAN and SPAN setup: A VLAN dedicated to the test, with the charger port mirrored to the capture interface, is configured. A quick `ping` and `tcpdump -c 100` verification step is performed.
2. Power and serial connectivity: Serial console access is established where available (TTL 3.3 V typical) and boot logs are recorded to a file. The charger is powered from a switched, surge-protected strip.
3. Service stub on SBC (if required): A Raspberry Pi provides stubbed upstream services (HTTP, DNS) to avoid vendor cloud dependencies; `dnsmasq` and a minimal HTTP server are common choices.

## Baseline data collection (what is likely captured)

* Firmware hash: `sha256sum wolfbox_firmware.bin` is computed and recorded.
* Passive capture: `tcpdump` on the SPAN interface during boot and idle operation is saved as a baseline pcap.
* Serial capture: boot console output is captured via `screen`/`minicom` into a log file.
* Lightweight service discovery: restrained `nmap -sS -sV` scans and `curl -I` checks are run to enumerate ports and HTTP headers.
* HTTP inspection: raw requests/responses from the management UI are saved for forensic comparison.

These baseline artefacts are typically stored under an evidence path such as `/evidence/<labid>/baseline/`.

## Firmware extraction and static analysis (inferred activities)

* Binwalk extraction is run to unpack the firmware: `binwalk -e wolfbox_firmware.bin`.
* Filesystem traversal and string searches to find keywords (`password`, `auth`, `update`, `cgi`) are performed to identify candidate attack surfaces.
* Selected binaries are opened in Ghidra or a disassembler for light annotation to identify input parsing routines; deep reversing is deferred unless required to explain a crash.

Decision point: where update handlers or signature checks are apparent, the validation path prioritises observation of the update endpoint rather than attempting to flash unsigned images.

## Targeted reconnaissance and minimal reproducibility (inferred tests)

Testing is incremental and captured comprehensively. Each reproduction attempt uses strict stop conditions.

### Authentication and session checks

Observation of login flows, cookies and tokens with `curl` and isolated browser VMs to establish whether default credentials or missing forced-change policies exist. Auth attempts and responses are logged (no brute-force).

If advisory text suggests header or cookie manipulations could bypass auth, raw request/response pairs are collected to show an unauthenticated `200` or admin endpoint presence. Those raw captures serve as evidence without detailing payloads.

### Crash / DoS observation

The administrator replays benign or advisory-informed sequences incrementally while monitoring the serial console. A reproducible crash or reboot results in preserved PCAPs and console logs. Photographs of device indicators are taken when reboots occur.

### Bounded parsing checks

Incremental, low-intensity fuzzing around suspected parser boundaries is used to observe faults. Any detection of anomalous behaviour — crash, stack trace, reboot — causes immediate cessation of fuzzing and archiving of the captures.

### Web/CGI and update endpoint inspection

Enumeration with low-impact HTTP tools to identify endpoints accepting file uploads or POSTs is conducted. Metadata about update endpoints (presence of `sig` or `hash` parameters) is captured rather than attempting to upload arbitrary firmware.

## Evidence handling (probable conventions)

Files are named and stored following a strict pattern, for example:

* `labid_firmware_<ver>_<sha256>.bin`
* `labid_baseline_<timestamp>.pcap`
* `labid_trigger_<symptom>_<timestamp>.pcap`
* `labid_console_<event>_<timestamp>.log`
* `labid_http_<endpoint>_<timestamp>.txt`
* `labid_ui_<page>_<timestamp>.png`
* `labid_notes_<step>_<timestamp>.md`

Each artefact is committed to a private repo with restricted access and an audit trail.

## Mitigation verification (likely procedure)

Vendor patches or documented mitigations are obtained, checksummed and applied in the isolated environment.

The same minimal reproduction steps are re-executed post-patch. Pre- and post-patch PCAPs and console logs are compared to demonstrate remediation or residual issues.

## Forks in the road — decision points and alternatives (explicit)

### Hardware versus emulation

* Most likely chosen: physical hardware for final verification because watchdogs, hardware timings and power behaviour can affect crash reproducibility.  
* Alternative: emulation first (QEMU/Firmadyne) to accelerate iteration and avoid mains; emulation may miss hardware-specific failure modes.  
  * How this shifts the workflow: emulation-first moves initial iteration into a fast cycle — firmware extraction, binwalk and quick launch in QEMU, then scripted reproduction attempts against the emulated firmware. Evidence collection focuses on emulation logs, virtual serial output and captured traffic generated by the emulated network stack. If the emulation reproduces the symptom, the lab records the emulated run (pcap, qemu serial logs) and escalates to hardware for final confirmation; if emulation does not reproduce the symptom, hardware testing is scheduled to verify hardware-dependent behaviours (watchdog resets, power sequencing). Firmware flashing and checksum verification still occur, but boot-time artefacts are first examined via the emulated environment before engaging risky mains-powered tests.

### Static analysis depth

* Most likely chosen: light static analysis to find interfaces and parsers.  
* Alternative: deep reverse engineering to identify exact root cause; this costs time and increases exposure to exploit knowledge.  
  * How this shifts the workflow: deep reversing adds a sustained phase of binary slicing and control-flow tracing in Ghidra/IDA, producing annotated call trees and exact input-parsing offsets. Lab evidence expands to include annotated disassembly snippets and hypotheses about vulnerable functions. These artifacts support a more surgical test plan (targeted inputs rather than blind fuzzing) and make mitigation recommendations (patch diff points) more precise. The trade-off is time-to-report: deep reversing delays vendor contact but strengthens patch guidance.

### Active probing intensity

* Most likely chosen: incremental, bounded active tests with immediate stop on anomalies.  
* Alternative: aggressive fuzzing for discovery of additional bugs; this risks bricking hardware and producing noisy, less actionable data.  
  * How this shifts the workflow: aggressive fuzzing introduces a discovery phase that runs long, parallelised fuzz jobs against suspected parsers, producing many crash artefacts. Triage becomes heavier: crash deduplication, stack trace correlation, and stability checks on emulation are required. The evidence set grows large (many pcaps, crash logs) and the lab must implement automated minimisation to extract a minimal triggering case for vendor reporting. Recovery procedures (reimaging, hardware replacement) must be planned up front because aggressive fuzzing often leaves devices unusable.

### Local stub versus vendor cloud

* Most likely chosen: local stub services to avoid vendor cloud dependence.  
* Alternative: coordinated tests with vendor test clouds when permitted.  
  * How this shifts the workflow: using local stubs puts all observable behaviour under lab control — DNS redirection, stub HTTP responses and deterministic timing — so reproducibility focuses on device-to-stub interactions and local pcap evidence. Coordinated cloud tests require out-of-band scheduling, authenticated test accounts, and cloud-side logs; evidence must include both lab captures and cloud provider logs, and the report must reference cloud access tokens and coordination records. Cloud tests allow full end-to-end verification of server-mediated flows but demand stricter change control and communication with the vendor.

### Tool placement and isolation

* Most likely chosen: run analysis tools in controlled VMs separate from the packet capture host to reduce risk of toolchain compromise.  
* Alternative: run some tools on the capture host for convenience.  
  * How this shifts the workflow: keeping tools in isolated VMs enforces an evidence-preservation pipeline — raw pcaps land on a write-once capture host, analysis VMs mount read-only copies, and any derived artefacts (extracted firmware, disassembly notes) are pushed to the repo from the analysis VM. Running tools directly on the capture host collapses that pipeline: captures are at risk if an analysis tool crashes or is compromised, and evidence handling must add extra integrity checks (hashes and immediate backups). The VM-first approach increases friction but yields stronger chain-of-custody and less risk of contaminating primary evidence.

## Possible technical caveats

* Firmware naming/version inconsistencies often require both device-reported version and binary checksum to be recorded.
* Serial consoles are sometimes disabled or protected; locating UART pads or using JTAG may be necessary, which changes the validation path.
* Extraction may require format-specific tools (`unsquashfs`, `jefferson` for JFFS2); multiple extraction attempts are common.
* Toolchain vulnerabilities are a risk; running Wireshark and other parsers in patched VMs is standard practice.

## Classification outcomes

* Reproducible — full: deterministic reproduction with PCAP + console + firmware hash.
* Reproducible — partial: subset reproduced (for example crash but not RCE); limitations documented.
* Not reproducible: environment or variant mismatch; exact steps and evidence of attempts recorded.
* Not reproducible — claim unsupported: steps attempted did not produce claimed effect; discrepancy analysis provided.

## Closing remarks

* This reconstruction suggests the CNA validation emphasises deterministic, timestamped captures and serial evidence over exploit demonstrations. That approach supports defensible disclosure and regulatory obligations.
* Emulation accelerates iteration but hardware testing is still necessary to confirm watchdogs, power behaviour and hardware timers.
* Where uncertainty exists, the validation path prefers conservative evidence collection and vendor coordination rather than speculative exploitation.
