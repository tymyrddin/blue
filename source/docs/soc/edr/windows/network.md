# Network threat detection

## SMB/NetBIOS auditing

Logs lateral movement via:

* NetSessionEnum (detects BloodHound reconnaissance)
* DsGetDCName (flags Golden Ticket attacks)

Critical for Active Directory environments.

Enable:

```
auditpol /set /subcategory:"Network Share" /success:enable /failure:enable
```

## RDP/Suspicious Port Monitoring

Alerts on:

* Unexpected RDP connections (Event ID 4624)
* High-volume SMB traffic (potential ransomware)

Tools:

* Azure Sentinel (cloud-native SIEM)
* [Zeek](https://nta.tymyrddin.dev/docs/zeek/readme) (for network metadata)