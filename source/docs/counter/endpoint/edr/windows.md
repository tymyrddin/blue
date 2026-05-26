# Windows endpoint detection and response

Windows EDR works through deep instrumentation of the Windows API, kernel callbacks, and event logging.
Modern Windows environments use process creation monitoring via ETW, file system minifilter drivers, registry
callbacks, and AMSI integration for script scanning. The main detection challenges are living-off-the-land
binaries (LOLBins) and fileless attacks, which bypass signature-based detection entirely.

## Process and behaviour monitoring

### Kernel callbacks

Hooks into the Windows kernel (via ETW or MiniFilter) to monitor:

- Process creation (`PsSetCreateProcessNotifyRoutineEx`)
- Thread creation (`PsSetCreateThreadNotifyRoutine`)
- Image/DLL loading (`PsSetLoadImageNotifyRoutine`)

Detects process hollowing (malware spawning `svchost.exe` then hollowing it) and reflective DLL injection (Cobalt Strike).

Tools: Microsoft Defender for Endpoint (uses ETW), Sysmon with SwiftOnSecurity configs.

### User-mode hooking

Injects hooks into APIs such as `CreateRemoteThread` (blocks thread injection) and `WriteProcessMemory`
(stops code injection). Catches fileless attacks including PowerShell scripts and WMI persistence.

```c
// Detecting thread injection
if (lpStartAddress == "C:\Windows\System32\amsi.dll") {
  BlockExecution();
}
```

## Memory protection

### Credential Guard

Uses virtualisation-based security (VBS) to isolate LSASS, preventing Mimikatz-style attacks
(`sekurlsa::logonpasswords`).

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName "VirtualizationBasedSecurity" -All
```

### Arbitrary Code Guard (ACG)

Blocks non-signed code execution in memory, stopping PowerShell exploits and shellcode injection.

```powershell
Set-ProcessMitigation -PolicyFilePath .\ACG_Config.xml
```

## Attack surface reduction

### ASR rules

Native Windows Defender rules to block Office macro execution and LOLBins abuse. Effective against
Emotet (macros) and living-off-the-land attacks.

```powershell
Set-MpPreference -AttackSurfaceReductionRules_Ids <RuleGUID> -AttackSurfaceReductionRules_Actions Enabled
```

Key rule GUIDs:

- Block Office applications from creating child processes: `D4F940AB-401B-4EFC-AADC-AD5F3C50688A`
- Block execution of potentially obfuscated scripts: `5BEB7EFE-FD9A-4556-801D-275E5FFC04CC`

### WDAC (Windows Defender Application Control)

Allowlists signed executables (CI/CD pipelines only) to block unsigned malware such as ransomware droppers.

```powershell
ConvertFrom-CIPolicy -XmlFilePath .\Policy.xml -BinaryFilePath .\Policy.bin
```

## Network threat detection

### SMB/NetBIOS auditing

Logs lateral movement via `NetSessionEnum` (detects BloodHound reconnaissance) and `DsGetDCName`
(flags Golden Ticket attacks). Critical for Active Directory environments.

```batch
auditpol /set /subcategory:"Network Share" /success:enable /failure:enable
```

### RDP and suspicious port monitoring

Alerts on unexpected RDP connections (Event ID 4624) and high-volume SMB traffic (potential ransomware).

Tools: Azure Sentinel for cloud-native correlation, Zeek for network metadata.

## Persistence and logging

### WMI subscription monitoring

Detects malicious WMI event subscriptions (e.g., `__EventFilter`). Finds APT29 implants that use
WMI for persistence.

```powershell
Get-WmiObject -Namespace root\Subscription -Class __EventFilter
```

### Windows Event Forwarding (WEF)

Centralises logs (Security, Sysmon, PowerShell Operational). Worth deploying for threat hunting,
particularly for detecting `Invoke-Mimikatz`.

```batch
wecutil qc /q
```

## Response

| Threat | Response action | Command |
|--------|----------------|---------|
| Ransomware | Isolate host, kill `mshta.exe` | `Stop-Process -Name mshta -Force` |
| LSASS dumping | Enable Credential Guard, reboot | `Set-ItemProperty -Path HKLM:\...` |
| Lateral movement | Block SMB/RDP at firewall | `New-NetFirewallRule -Action Block` |
