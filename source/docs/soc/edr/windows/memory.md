# Memory protection

## Credential Guard

Uses virtualisation-based security (VBS) to isolate LSASS -> Prevents Mimikatz-style attacks (e.g., sekurlsa::logonpasswords).

Enable:

```
Enable-WindowsOptionalFeature -Online -FeatureName "VirtualizationBasedSecurity" -All
```

## Arbitrary Code Guard (ACG)

Blocks non-signed code execution in memory -> Stops PowerShell exploits and shellcode injection.

Deploy:

```
Set-ProcessMitigation -PolicyFilePath .\ACG_Config.xml
```

