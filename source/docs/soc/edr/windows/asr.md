# Attack Surface Reduction (ASR)

## ASR rules

Native Windows Defender rules to block:

* Office macro execution (D4F940AB-401B-4EFC-AADC-AD5F3C50688A)
* LOLBins abuse (5BEB7EFE-FD9A-4556-801D-275E5FFC04CC)

Stops Emotet (macros) and Living-off-the-Land attacks.

Enable:

```
Set-MpPreference -AttackSurfaceReductionRules_Ids <RuleGUID> -AttackSurfaceReductionRules_Actions Enabled
```

## WDAC (Windows Defender Application Control)

Allowlists signed executables (CI/CD pipelines only) to block unsigned malware (e.g., ransomware droppers).

Deploy:

```
ConvertFrom-CIPolicy -XmlFilePath .\Policy.xml -BinaryFilePath .\Policy.bin
```

