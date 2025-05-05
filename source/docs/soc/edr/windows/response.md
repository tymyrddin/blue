# Response techniques

| Threat	           | Response action	                 | Command                           |
|-------------------|----------------------------------|-----------------------------------|
| Ransomware	       | Isolate host, kill `mshta.exe`	    | `Stop-Process -Name mshta -Force`  |
| LSASS Dumping	    | Enable Credential Guard, reboot	 | `Set-ItemProperty -Path HKLM:\...` |
| Lateral Movement	 | Block SMB/RDP at firewall	       | `New-NetFirewallRule -Action Block` |