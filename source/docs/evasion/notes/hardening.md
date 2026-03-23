# Hardening against evasion

Hardening reduces the techniques available to an attacker and forces them toward
noisier alternatives. It is not a detection strategy; it is an attack surface
reduction strategy. A hardened environment is not uncompromisable, but it is one
where the attacker must make more noise to achieve the same result.

## HVCI and Secure Boot

Hypervisor-Protected Code Integrity (HVCI) uses hardware virtualisation to enforce
that only code signed with a trusted certificate can run in kernel mode. It is the
direct counter to BYOVD: a driver not on the UEFI trust store cannot load even if
an attacker has administrator privileges.

```powershell
# check HVCI status
Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard' |
  Select-Object EnableVirtualizationBasedSecurity, HypervisorEnforcedCodeIntegrity

# enable HVCI via WDAC policy (requires reboot, hardware support)
# requires: UEFI Secure Boot, TPM 2.0, VT-d/AMD-Vi
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard' `
  -Name EnableVirtualizationBasedSecurity -Value 1

# enable via Windows Security > Device Security > Core isolation > Memory integrity
```

Enforce via Group Policy in domain environments. Report compliance via Intune or
SCCM. Treat HVCI non-compliance as a critical finding.

## Windows Defender Application Control

WDAC allows only specified applications to run. An attacker cannot drop and execute
an arbitrary binary on a WDAC-enforced host.

Key configuration: allow only signed binaries from trusted publishers, block known
vulnerable drivers (Microsoft's recommended block list), and define exceptions for
specific applications.

```powershell
# generate a base policy from reference system (audit mode first)
New-CIPolicy -ScanPath 'C:\' -Level Publisher -Fallback Hash -FilePath 'C:\BasePolicy.xml' -UserPEs

# convert to enforced policy after audit period
Set-RuleOption -FilePath 'C:\BasePolicy.xml' -Option 3 -Delete  # remove audit mode
ConvertFrom-CIPolicy 'C:\BasePolicy.xml' 'C:\BasePolicy.bin'

# deploy via GPO or Intune
```

WDAC significantly raises the bar for dropping and executing payloads, but does not
prevent LoLbin abuse or script-based attacks. Pair with constrained language mode
for PowerShell.

## PowerShell constrained language mode and logging

Constrained Language Mode (CLM) restricts PowerShell to a limited subset that
prevents direct .NET type access, COM object creation, and other capabilities used
by most PowerShell-based attacks.

```powershell
# check current language mode
$ExecutionContext.SessionState.LanguageMode
# FullLanguage = no restriction; ConstrainedLanguage = restricted

# CLM is enforced automatically when AppLocker or WDAC is active
# or set per-session for testing:
$ExecutionContext.SessionState.LanguageMode = 'ConstrainedLanguage'
```

Enable all PowerShell logging:

```powershell
# via Group Policy: Computer Configuration > Administrative Templates > Windows Components > Windows PowerShell
# Script Block Logging: Enabled
# Module Logging: Enabled (log all modules)
# Transcription: Enabled (log all output to a central share)

# or directly via registry:
Set-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' -Name EnableScriptBlockLogging -Value 1
Set-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging' -Name EnableModuleLogging -Value 1
```

Script block logging captures the decoded content of encoded commands (Event ID 4104)
and is the primary detective control for PowerShell-based attacks. Collect these logs
centrally.

## Removing LoLbin capability

High-risk LoLbins that have no legitimate use in the specific environment can be
removed or restricted:

```text
# restrict mshta.exe via AppLocker or WDAC
# mshta.exe has no legitimate use in most enterprise environments

# restrict certutil from making network connections via Windows Firewall:
netsh advfirewall firewall add rule name="Block certutil outbound" `
  dir=out program="C:\Windows\System32\certutil.exe" action=block

# restrict wmic.exe via AppLocker if WMI management is done via PowerShell instead
```

Document which LoLbins are actively used by IT operations before restricting them.
Restricting a LoLbin that SCCM or a management tool relies on creates operational
problems. Build the exclusion list from evidence, not assumption.

## Credential protections

Credential Guard uses virtualisation to protect NTLM hashes and Kerberos tickets
from extraction by tools like Mimikatz. With Credential Guard enabled, LSASS
process memory no longer contains extractable credential material.

```powershell
# enable Credential Guard
Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa' -Name LsaCfgFlags -Value 1

# check status
(Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard').SecurityServicesRunning
# 1 = Credential Guard running

# verify via WMIC
wmic /namespace:\\root\Microsoft\Windows\DeviceGuard path MSFT_DeviceGuardStatus get SecurityServicesRunning
```

Requiring MFA for all privileged operations and using short-lived Kerberos tickets
(reduce TGT lifetime from the default 10 hours) limits the value of credential theft.

## Driver signing enforcement

Beyond HVCI, enforce that only drivers on the approved list can load:

```text
# Windows Defender Application Control block policy for vulnerable drivers
# Microsoft maintains the recommended block list:
# https://aka.ms/VulnerableDriverBlockList

# deploy as a supplemental WDAC policy
# this blocks the most commonly abused vulnerable drivers by hash and publisher
```

Monitor driver load events actively (System Event ID 7045, Sysmon Event ID 6).
A driver loading from a non-standard path or under a service name that does not match
any known installed software is an immediate alert.

## Attack surface reduction rules

Microsoft Defender's Attack Surface Reduction (ASR) rules block specific high-risk
behaviours:

```powershell
# enable key ASR rules via PowerShell
$rules = @(
    'BE9BA2D9-53EA-4CDC-84E5-9B1EEEE46550',  # Block executable content from email/webmail
    '3B576869-A4EC-4529-8536-B80A7769E899',  # Block Office apps from creating executable content
    'D4F940AB-401B-4EFC-AADC-AD5F3C50688A',  # Block Office apps from creating child processes
    '9E6C4E1F-7D60-472F-BA1A-A39EF669E4B2',  # Block credential stealing from lsass
    '01443614-cd74-433a-b99e-2ecdc07bfc25',  # Block untrusted/unsigned processes from USB
    'b2b3f03d-6a65-4f7b-a9c7-1c7ef74a9ba4',  # Block untrusted and unsigned processes from USB
    '26190899-1602-49e8-8b27-eb1d0a1ce869',  # Block Office communication apps from creating child processes
    '7674ba52-37eb-4a4f-a9a1-f0f9a1619a2c'   # Block Adobe Reader from creating child processes
)

foreach ($rule in $rules) {
    Add-MpPreference -AttackSurfaceReductionRules_Ids $rule -AttackSurfaceReductionRules_Actions Enabled
}
```

Run in audit mode first to identify false positives before switching to block.
