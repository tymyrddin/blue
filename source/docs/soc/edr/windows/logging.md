# Persistence and logging

## WMI Subscription Monitoring

Detects malicious WMI event subscriptions (e.g., __EventFilter).

Finds APT29 implants that use WMI for persistence.

Script:

```
Get-WmiObject -Namespace root\Subscription -Class __EventFilter
```

## Windows Event Forwarding (WEF)

Centralizes logs (Security, Sysmon, PowerShell Operational).

Essential for threat hunting (e.g., detecting Invoke-Mimikatz).

Deploy:

```
wecutil qc /q
```
