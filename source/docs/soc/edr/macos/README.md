# macOS EDR techniques

## What?

macOS endpoint protection combines Apple's built-in security frameworks (Endpoint Security API, XProtect, MRT) with 
third-party EDR solutions. Modern macOS EDR focuses on monitoring ESF events (process executions, file operations, 
mount events), analysing notarisation and Gatekeeper decisions, and tracking suspicious entitlement usage. Special 
attention is given to emerging attack vectors like abuse of AppleScript, JXA (JavaScript for Automation), and 
Swift-based payloads. macOS-specific challenges include detecting abuse of legitimate developer tools, analysing 
signed-but-malicious applications, and monitoring for persistence through launch agents/daemons or TCC database 
manipulation. The increasing prevalence of macOS in enterprise environments has driven significant advancement in 
Apple-specific threat detection methodologies.

## Why?

* Macs are high-value targets: Attacks rose 300%+ in 2023 (Malwarebytes).
* Apple’s defences aren’t enough: SIP/XProtect miss fileless attacks, adware, and zero-days.
* Organisational risk: Macs in organisational networks need zero-trust controls.

## How?

* [Process monitoring](process.md)
* [Memory protection](memory.md)
* [Behavioural detection](behavioural.md)
* [Network hardening](network.md)