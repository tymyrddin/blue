# Windows EDR techniques

## What?

Endpoint Detection and Response (EDR) solutions for Windows environments focus on monitoring system activities 
through deep instrumentation of the Windows API, kernel callbacks, and event logging. Modern Windows EDR leverages 
process creation monitoring (via ETW), file system minifilter drivers, registry callbacks, and AMSI integration 
for script scanning. Advanced solutions employ user-mode hooking and kernel telemetry to detect sophisticated 
attacks like process hollowing, LSASS dumping, and CLM bypass attempts. Key challenges include balancing performance 
impact with visibility while maintaining detection efficacy against living-off-the-land binaries (LOLBins) and 
fileless attacks.

## Why?

* #1 targeted OS: 90% of malware attacks focus on Windows.
* Native tools aren’t enough: Defender misses fileless attacks and LOLBins.
* Regulatory demands: Needed for HIPAA, GDPR, and FedRAMP compliance.

## How?

* [Process & behaviour monitoring](process.md)
* [Memory protection](memory.md)
* [Attack Surface Reduction (ASR)](asr.md)
* [Network threat detection](network.md)
* [Persistence and logging](logging.md)
* [Response techniques](response.md)