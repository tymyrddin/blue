# PowerShell honeyport (Windows)

```powershell
# honeyport.ps1
$port = 2222
$logFile = "C:\honeyport.log"
$firewallRuleName = "HONEYPORT Block"

function Write-Log {
    param($ip)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - Connection from $ip" | Out-File -Append $logFile
}

function Block-IP {
    param($ip)
    if (-not (Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName $firewallRuleName -Direction Inbound -Action Block -RemoteAddress $ip
    } else {
        $existingIPs = (Get-NetFirewallRule -DisplayName $firewallRuleName).RemoteAddress
        Set-NetFirewallRule -DisplayName $firewallRuleName -RemoteAddress @($existingIPs + $ip)
    }
}

$listener = [System.Net.Sockets.TcpListener]$port
$listener.Start()
Write-Host "[*] Fake SSH running on port $port"

while ($true) {
    $client = $listener.AcceptTcpClient()
    $ip = $client.Client.RemoteEndPoint.Address
    Write-Host "[!] Probe from $ip"
    Write-Log $ip
    Block-IP $ip
    
    # Fake SSH banner
    $stream = $client.GetStream()
    $writer = New-Object System.IO.StreamWriter($stream)
    $writer.WriteLine("SSH-2.0-OpenSSH_for_Windows_8.1")
    Start-Sleep -Seconds 2
    $writer.WriteLine("Protocol mismatch.")
    $writer.Flush()
    $client.Close()
}
```

## Windows integration

1. Run as Hidden Service

```powershell
# Install as persistent service
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -File C:\honeyport.ps1"
Register-ScheduledTask -TaskName "Honeyport" -Action $action -RunLevel Highest -StartupType AtStartup
```

2. Event log monitoring (Optional)

Use Windows Event Forwarding to monitor `$logFile` and trigger alerts in SIEM tools.