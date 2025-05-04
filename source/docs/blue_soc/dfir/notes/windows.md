# Windows analysis

## OS queries

### Domain

Get Fully Qualified Domain Name (FQDN):

    ([System.Net.Dns]::GetHostByName(($env:computerName))).Hostname

Get just domain name:

    (Get-WmiObject -Class win32_computersystem).domain

### OS

Print hostname, OS build info, and powershell version:

```powershell
$Bit = (get-wmiobject Win32_OperatingSystem).OSArchitecture ; 
$V = $host | select-object -property "Version" ; 
$Build = (Get-WmiObject -class Win32_OperatingSystem).Caption ; 
write-host "$env:computername is a $Bit $Build with Pwsh $V"
```

### Hardware

Get processor info:

	gcim -ClassName Win32_Processor | fl caption, Name, SocketDesignation;

Computer Model:

	gcim -ClassName Win32_ComputerSystem | fl Manufacturer, Systemfamily, Model, SystemType

Disk space in Gigs:

	gcim  -ClassName Win32_LogicalDisk | Select -Property DeviceID, DriveType, @{L='FreeSpaceGB';E={"{0:N2}" -f ($_.FreeSpace /1GB)}}, @{L="Capacity";E={"{0:N2}" -f ($_.Size/1GB)}} | fl

### Time

Human-readable time:

    Get-Date -UFormat "%T %a %d-%b-%Y UTC:%Z"

Comparisons between two strings of time:

    [Xml.XmlConvert]::ToString((Get-Date).ToUniversalTime(), [System.Xml.XmlDateTimeSerializationMode]::Utc)

Compare UTC time with local time:

```powershell
$Local = get-date;$UTC = (get-date).ToUniversalTime();
write-host "LocalTime is: $Local";write-host "UTC is: $UTC"
```

### Updates

Show all patch IDs with installation date:

```powershell
get-hotfix|
select-object HotFixID,InstalledOn|
Sort-Object  -Descending -property InstalledOn|
format-table -autosize
```

Why an update failed:

```powershell
$Failures = gwmi -Class Win32_ReliabilityRecords;
$Failures | ? message -match 'failure'  | Select -ExpandProperty message 
```

Recursively look for `SomeFile.dll`:

```powershell
$file = 'SomeFile.dll'; $directory = 'C:\windows' ;
gci -Path $directory -Filter $file -Recurse -force|
sort-object  -descending -property LastWriteTimeUtc | fl *
```

## Account queries

### Enumerating

Enabled local user accounts:

     Get-LocalUser | ? Enabled -eq "True"

All users currently logged in:

    qwinsta

To find all users logged in across the entire AD, use YossiSassi's [Get-UserSession.ps1](https://github.com/YossiSassi/Get-UserSession/blob/master/Get-UserSession.ps1) and [Get-RemotePSSession.ps1](https://github.com/YossiSassi/Get-RemotePSSession/blob/master/Get-RemotePSSession.ps1).

### Logging out

To force user logout, target their session id:

    logoff <session id> /v

### Changing passwords

Force a new user password for AD:

```powershell
$user = "username" ; 
$newPass = "Hard to guess new password";
Set-ADAccountPassword -Identity $user -Reset -NewPassword (ConvertTo-SecureString -AsPlainText "$newPass" -Force) -verbose
```

For local non-domain joined machines:

```powershell
net user username "Hard to guess new password"
```

### Disabling

To disable an AD Account, use the `SAMAccountName`:

```powershell
$user = "username"; 
Disable-ADAccount -Identity "$user"
```

Check it is disabled:

```powershell
(Get-ADUser -Identity $user).enabled
```

To re-enable the account:

```powershell
Enable-ADAccount -Identity "$user" -verbose
```

To disable a local account, list accounts with `Get-LocalUser`.

```powershell
Disable-LocalUser -name "name"
```

To quickly eject an account from a specific group, like administrators or remote management:

```powershell
$user = "username"
remove-adgroupmember -identity Administrators -members $User -verbose -confirm:$false
```

### Device accounts

Adversaries like to use accounts that have a `$`.

To show machine accounts which are a part of interesting groups:

```powershell
Get-ADComputer -Filter * -Properties MemberOf | ? {$_.MemberOf}
```

Reset password for a machine account:

```powershell
Reset-ComputerMachinePassword
```

## Service queries

### Enumerating

All the services:

```powershell
get-service|Select Name,DisplayName,Status|
sort status -descending | ft -Property * -AutoSize|
Out-String -Width 4096
```

Show the executable supporting a service:

```powershell
Get-WmiObject win32_service |? State -match "running" |
select Name, DisplayName, PathName, User | sort Name |
ft -wrap -autosize
```

Info on a specific service (`eventlog`):

```powershell
$Name = "eventlog"; 
gwmi -Class Win32_Service -Filter "Name = '$Name' " | fl *
```

### Responses

Kill a service:

```powershell
Get-Service -DisplayName "service" | Stop-Service -Force -Confirm:$false -verbose
```

To identify a [service install](https://twitter.com/Alh4zr3d/status/1580925761996828672?s=20&t=3IV0LmMvw-ThCCj_kgpjwg) which is hiding Windows services:

```text
sc sdset evilsvc "D:(D;;DCLCWPDTSD;;;IU)(D;;DCLCWPDTSD;;;SU)(D;;DCLCWPDTSD;;;BA)(A;;CCLCSWLOCRRC;;;IU)(A;;CCLCSWLOCRRC;;;SU)(A;;CCLCSWRPWPDTLOCRRC;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)S:(AU;FA;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;WD)"
```

Deploy:

```powershell
Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\services\*" | 
ft PSChildName, ImagePath -autosize | out-string -width 800
```

Grep results from System32:

```powershell
Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\services\*" | 
where ImagePath -notlike "*System32*" | 
ft PSChildName, ImagePath -autosize | out-string -width 800
```

## Network queries

### TCP connections

```powershell
Get-NetTCPConnection |
select LocalAddress,localport,remoteaddress,remoteport,state,@{name="process";Expression={(get-process -id $_.OwningProcess).ProcessName}}, @{Name="cmdline";Expression={(Get-WmiObject Win32_Process -filter "ProcessId = $($_.OwningProcess)").commandline}} | 
sort Remoteaddress -Descending | ft -wrap -autosize
```

Search for/filter `anypattern`:

```powershell
Get-NetTCPConnection |
select LocalAddress,localport,remoteaddress,remoteport,state,@{name="process";Expression={(get-process -id $_.OwningProcess).ProcessName}}, @{Name="cmdline";Expression={(Get-WmiObject Win32_Process -filter "ProcessId = $($_.OwningProcess)").commandline}} |
Select-String -Pattern 'anypattern';
```

### Established connections

Established connections, sorted by `creationtime` (change to whatever sorting parameter):

```powershell
Get-NetTCPConnection -AppliedSetting Internet |
select-object -property remoteaddress, remoteport, creationtime |
Sort-Object -Property creationtime |
format-table -autosize
```

Unique remote IP connections:

```powershell
(Get-NetTCPConnection).remoteaddress | Sort-Object -Unique 
```

Investigating a suspicious IP:

```powershell
Get-NetTCPConnection |
? {($_.RemoteAddress -eq "1.2.3.4")} |
select-object -property state, creationtime, localport,remoteport | ft -autosize
```

### UDP connections

```powershell
Get-NetUDPEndpoint | select local*,creationtime, remote* | ft -autosize
```

### Kill a connection

```powershell
stop-process -verbose -force -Confirm:$false (Get-Process -Id (Get-NetTCPConnection -RemoteAddress "1.2.3.4" ).OwningProcess)
```

### Check Hosts file

```powershell
gci "C:\Windows\System32\Drivers\etc\hosts"
```

To check whether timestamps were recently altered:

```powershell
gci "C:\Windows\System32\Drivers\etc\hosts" | fl *Time*
```

### DNS Cache

Collect the DNS cache on an endpoint:

```powershell
Get-DnsClientCache | out-string -width 1000
```

Using regex (second line):

```powershell
Get-DnsClientCache | 
? Entry -NotMatch "workstation|server|kerb|ocsp" |
out-string -width 1000 
```

### IPv6 

Windows OS prioritises IPv6 over IPv4 making [on-path-attacks](https://www.youtube.com/watch?v=zzbIuslB58c) easier.

Get IPv6 addresses and networks:

```powershell
Get-NetIPAddress -AddressFamily IPv6  | ft Interfacealias, IPv6Address
```

Check if a machine prioritises IPv6:

```powershell
ping $env:COMPUTERNAME -n 4 
```

Changing reg to de-prioritise IPv6:

```powershell
New-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters\" -Name "DisabledComponents" -Value 0x20 -PropertyType "DWord"
```

If this reg already exists and has values, change the value:

```powershell
Set-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters\" -Name "DisabledComponents" -Value 0x20
```

Restart the computer for this to take effect

### BITS

```powershell
Get-BitsTransfer| 
fl DisplayName,JobState,TransferType,FileList, OwnerAccount,BytesTransferred,CreationTime,TransferCompletionTime
```

Filter out common bits jobs in the local environment (below is just an example): 

```powershell
Get-BitsTransfer|
? displayname -notmatch "WU|Office|MachineName|configjson" |
fl DisplayName,JobState,TransferType,FileList, OwnerAccount,BytesTransferred,CreationTime,TransferCompletionTime
```

Hunt down BITS transfers that are UPLOADING (indicator of data exfiltration):

```powershell
Get-BitsTransfer| 
? TransferType -match "Upload" | 
fl DisplayName,JobState,TransferType,FileList, OwnerAccount,BytesTransferred,CreationTime,TransferCompletionTime
```

## Remoting queries

### Enumerating

Created Powershell sessions:

```powershell
Get-PSSession
```

WinRM sessions:

```powershell
get-wsmaninstance -resourceuri shell -enumerate | 
select Name, State, Owner, ClientIP, ProcessID, MemoryUsed, 
@{Name = "ShellRunTime"; Expression = {[System.Xml.XmlConvert]::ToTimeSpan($_.ShellRunTime)}},
@{Name = "ShellInactivity"; Expression = {[System.Xml.XmlConvert]::ToTimeSpan($_.ShellInactivity)}}
```

Remoting permissions:

```powershell
Get-PSSessionConfiguration | 
fl Name, PSVersion, Permission
```

Check constrained language:

```powershell
$ExecutionContext.SessionState.LanguageMode
```

### RDP settings

To check if RDP is allowed on an endpoint:

```powershell
if ((Get-ItemProperty "hklm:\System\CurrentControlSet\Control\Terminal Server").fDenyTSConnections -eq 0){write-host "RDP Enabled" } 
else { echo "RDP Disabled" }
```

To block RDP:

```powershell
Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 1
```

Firewall:

```powershell
Disable-NetFirewallRule -DisplayGroup "Remote Desktop"
```

## Firewall queries

### Enumerating

To list firewall profile names:

```powershell
(Get-NetFirewallProfile).name
```

Get enabled rules of a specific profile:

```powershell
Get-NetFirewallProfile -Name Public | Get-NetFirewallRule | ? Enabled -eq "true"
```

### Firewall rules

Show enabled firewall rules:

```powershell
Get-NetFirewallRule | ? Enabled -eq "true"
```

Firewall rules for inbound traffic:

```powershell
Get-NetFirewallRule | ? direction -eq "inbound"
```

Firewall rules for outbound traffic:

```powershell
Get-NetFirewallRule | ? direction -eq "outbound"
```

Stack filters:

```powershell
Get-NetFirewallRule -Enabled True -Direction Inbound
```

### Isolate endpoint

```powershell
New-NetFirewallRule -DisplayName "Block all outbound traffic" -Direction Outbound -Action Block | out-null; 
New-NetFirewallRule -DisplayName "Block all inbound traffic" -Direction Inbound -Action Block | out-null; 
$adapter = Get-NetAdapter|foreach { $_.Name } ; Disable-NetAdapter -Name "$adapter" -Confirm:$false; 
Add-Type -AssemblyName PresentationCore,PresentationFramework; 
[System.Windows.MessageBox]::Show('Your Computer has been Disconnected from the Internet for Security Reasons. Please do not try to re-connect to the internet. Contact Security. ',' Security Alert',[System.Windows.MessageBoxButton]::OK,[System.Windows.MessageBoxImage]::Information)
```

## SMB queries

### Enumerating

List shares:

```powershell
Get-SMBShare
```

List SMB connections:

```powershell
Get-SmbConnection |
select Dialect, Servername, Sharename | sort Dialect 
```

### Response
    
Remove an SMB share:

```powershell
Remove-SmbShare -Name ShareToBeRemoved -Confirm:$false -verbose
```

## Process queries

### Enumerating

Processes and TCP connections:

```powershell
Get-NetTCPConnection |
select LocalAddress,localport,remoteaddress,remoteport,state,@{name="process";Expression={(get-process -id $_.OwningProcess).ProcessName}}, @{Name="cmdline";Expression={(Get-WmiObject Win32_Process -filter "ProcessId = $($_.OwningProcess)").commandline}} | 
sort Remoteaddress -Descending | ft -wrap -autosize
```

Show all processes and their associated user:

```powershell
get-process * -Includeusername
```

### Hunting

Suspicious processes from users:

```powershell
gwmi win32_process | 
Select Name,@{n='Owner';e={$_.GetOwner().User}},CommandLine | 
sort Name -unique -descending | Sort Owner | ft -wrap -autosize
```

Get specific info about the full path binary that a process is running:

```powershell
gwmi win32_process | 
Select Name,ProcessID,@{n='Owner';e={$_.GetOwner().User}},CommandLine | 
sort name | ft -wrap -autosize | out-string
```

Get specific info a process is running:

```powershell
get-process -name "nc" | ft Name, Id, Path,StartTime,Includeusername -autosize 
```

Check whether a specific process is running or not:

```powershell
$process = "danger";
if (ps |  where-object ProcessName -Match "$process") {Write-Host "$process successfully installed on " -NoNewline ; hostname} else {write-host "$process absent from " -NoNewline ; hostname}
```

Get hash of a process:

```powershell
foreach ($proc in Get-Process | select path -Unique){try
{ Get-FileHash $proc.path -Algorithm sha256 -ErrorAction stop |
ft hash, path -autosize -HideTableHeaders | out-string -width 800 }catch{}}
```

List all DLLs loaded with a process:

```powershell
get-process -name "memestask" -module | fl 
```

Identify process CPU usage:

```powershell
(Get-Process -name "someupdate").CPU | fl 
```

Sort by least CPU-intensive processes:

```powershell
gps | Sort CPU |
Select -Property ProcessName, CPU, ID, StartTime | 
ft -autosize -wrap | out-string -width 800
```

### Response

Stop a process:

```powershell
Get-Process -Name "dangerousprocess" | Stop-Process -Force -Confirm:$false -verbose
```

## Recurring task queries

### Scheduled tasks

```powershell
schtasks /query /FO CSV /v | convertfrom-csv |
where { $_.TaskName -ne "TaskName" } |
select "TaskName","Run As User", Author, "Task to Run"| 
fl | out-string
```

A specific schtask:

```powershell
Get-ScheduledTask -Taskname "wifi*" | fl *
```

The commands a task is running:

```powershell
$task = Get-ScheduledTask | where TaskName -EQ "meme task"; 
$task.Actions
```

Stop a task:

```powershell
Get-ScheduledTask "dangeroustask" | Stop-ScheduledTask -Force -Confirm:$false -verbose
```

All schtask locations:

```text
HKLM\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\Tree
HKLM\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\Tasks
C:\Windows\System32\Tasks
C:\Windows\Tasks
C:\windows\SysWOW64\Tasks\
```

Check for tasks missing from the `C:\Windows` directories, but present in the Registry:

```powershell
$Reg=(Get-ItemProperty -path "HKLM:\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\tree\*").PsChildName
$XMLs = (ls C:\windows\System32\Tasks\).Name
Compare-Object $Reg $XMLs
```

Threat actors can manipulate scheduled tasks such that Task Scheduler no longer has visibility of the recuring task.
Querying the Registry locations `HKLM\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\Tree` and `HKLM\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\Tasks`, can reveal some of these sneaky tasks.

Loop and parse \Taskcache\Tasks Registry location for scheduled tasks, and parse Actions to show the underlying binary/commands for the schtask. Note: the Unicode string reduces the chances of getting invalid characters, and the regex will assist in stripping each string of junk.

```powershell
(Get-ItemProperty "HKLM:\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\Tasks\*").PSChildName | 
Foreach-Object {
  write-host "----Schtask ID is $_---" -ForegroundColor Magenta ;
  $hexstring = Get-ItemProperty "HKLM:\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\Tasks\$_" | Select -ExpandProperty Actions;
  $fixedstring = [System.Text.Encoding]::Unicode.GetString($hexstring) -replace '[^a-zA-Z0-9\\._\-\:\%\/\$ ]', ' ';
  write-host $fixedstring
}
```

Then, with a binary/one-liner that seems suspicious, query it in the other Registry location:

```powershell
$ID = "{XYZ}" ; 
get-itemproperty -path "HKLM:\Software\Microsoft\Windows NT\CurrentVersion\Schedule\Taskcache\Tree\*" | 
? Id -Match "$ID" | fl *Name,Id,PsPath
```

Then kill these Registry schtask entriesvia Regedit's GUI.

### Programs running at startup

```powershell
Get-CimInstance Win32_StartupCommand | Select-Object Name, command, Location, User | Format-List 
```

List the files in each user's startup folder:

```powershell
(gci "c:\Users\*\appdata\roaming\microsoft\windows\start menu\programs\startup\*").fullname
```

Extract from the path User, Exe, and print machine name:

```powershell
(gci "c:\Users\*\appdata\roaming\microsoft\windows\start menu\programs\startup\*").fullname | 
foreach-object {$data = $_.split("\\");write-output "$($data[2]), $($data[10]), $(hostname)"}
```

Check the first couple lines of files' contents:

```powershell
(gci "c:\Users\*\appdata\roaming\microsoft\windows\start menu\programs\startup\*").fullname | 
foreach-object {write-host `n$_`n; gc $_ -encoding byte| fhx |select -first 5}
```

### Programs at login

Create HKU drive:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

List all user's environments:

```powershell
(gp "HKU:\*\Environment").UserInitMprLogonScript
```

Collect SID of target user with related logon task:

```powershell
gp "HKU:\*\Environment" | FL PSParentPath,UserInitMprLogonScript
```

Insert SID and convert it into username

```powershell
gwmi win32_useraccount | 
select Name, SID | 
? SID -match "" #insert SID between quotes 
```

Confirm via `whatif` flag this is the right key:

```powershell
remove-itemproperty "HKU:\SID-\Environment\" -name "UserInitMprLogonScript" -whatif
```

Delete it:

```powershell
remove-itemproperty "HKU:\SID-\Environment\" -name "UserInitMprLogonScript" -verbose
```

### Programs at PowerShell

Adversaries can link their persistence mechanisms to a PowerShell profile, executing their code every time PowerShell is started.

Confirm the profile you are querying:

```powershell
echo $Profile
```

Show PowerShell profile contents:

```powershell
type $Profile
```

edit the profile and remove the persistence (`notepad $Profile`), or:

```powershell
(gci C:\Users\*\Documents\WindowsPowerShell\*profile.ps1, C:\Windows\System32\WindowsPowerShell\v1.0\*profile.ps1).FullName|
Foreach-Object {
  write-host "----$_---" -ForegroundColor Red ; 
  gc $_ | select-string -notmatch function
}
```

### Stolen links

Adversaries can insert their code into shortcuts. They can do it in clever ways, so that the application will still run but at the same time their code will also execute when you click on the application.

For example, query all shortcuts, sorting by the `LastModified` date, modified in the year 2022 onwards:

```powershell
Get-CimInstance Win32_ShortcutFile |
where-object {$_.lastmodified -gt [datetime]::parse("01/01/2022")} | 
sort LastModified -desc | fl FileName,Name,Target, LastModified
```

### Jobs

Find out what scheduled jobs are on the machine:

```powershell
Get-ScheduledJob | fl * 
```

Get details:

```powershell
Get-ScheduledJob | Get-JobTrigger | 
Ft -Property @{Label="ScheduledJob";Expression={$_.JobDefinition.Name}},ID,Enabled, At, frequency, DaysOfWeek
```

Kill job:

```powershell
Disable-ScheduledJob -Name evil_sched
```

```powershell
Unregister-ScheduledJob -Name eviler_sched
```

```powershell
Remove-Job -id <id>
```

Check with `Get-ScheduledJob` it was removed. If it persists, tack on `-Force -Confirm:$false -verbose` to `Unregister-ScheduledJob` or `Remove-Job`.

### WMI Persistence

```powershell
Get-CimInstance -Namespace root\Subscription -Class __FilterToConsumerBinding
Get-CimInstance -Namespace root\Subscription -Class __EventFilter
Get-CimInstance -Namespace root\Subscription -Class __EventConsumer
```

Removing it:

```powershell
gcim -Namespace root\Subscription -Class __EventFilter | 
? Name -eq "EVIL" | Remove-CimInstance -verbose
```

```powershell
gcim -Namespace root\Subscription -Class __EventConsumer| 
? Name -eq "EVIL" | Remove-CimInstance -verbose
```

It is easier to use `gwmi` here instead of `gcim`:

```powershell
gwmi -Namespace root\Subscription -Class __FilterToConsumerBinding | 
? Consumer -match "EVIL" | Remove-WmiObject -verbose
```

### Run Keys

Finding Run Evil with a `pwsh` for-loop can collect the contents of the four registry locations.

Create HKU drive:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

```powershell
(gci HKLM:\Software\Microsoft\Windows\CurrentVersion\Run, HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce, HKU:\*\Software\Microsoft\Windows\CurrentVersion\Run, HKU:\*\Software\Microsoft\Windows\CurrentVersion\RunOnce ).Pspath |
Foreach-Object {
  write-host "----Reg location is $_---" -ForegroundColor Magenta ; 
  gp $_ | 
  select -property * -exclude PS*, One*, vm* | #exclude results here
  FL
}
```

Removing Run Evil:

```powershell

```

Create HKU drive:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

List the malicious reg by path:

```powershell
get-itemproperty "HKU:\SID\Software\Microsoft\Windows\CurrentVersion\RunOnce" | select -property * -exclude PS* | fl
```

Pick the EXACT name of the Run entry to remove. Copy-paste it, include any `*` or `!`:

```powershell
Remove-ItemProperty -Path "HKU:\SID-\Software\Microsoft\Windows\CurrentVersion\RunOnce" -Name "*EvilerRunOnce" -verbose
```

Check:

```powershell
get-itemproperty "HKU:\*\Software\Microsoft\Windows\CurrentVersion\RunOnce" | select -property * -exclude PS* | fl
```

### Other malicious run locations

Folders can be the locations of persistence:

Create HKU drive:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

```powershell
$folders = @("HKU:\*\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders","HKU:\*\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders","HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders","HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders")
foreach ($folder in $folders) {
  write-host "----Reg key is $folder--- -ForegroundColor Magenta "; 
  get-itemproperty -path "$folder"  | 
  select -property * -exclude PS* | fl
}
```

`Svchost` startup persistence:

```powershell
get-itemproperty -path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Svchost"
```

`Winlogon` startup persistence:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

```powershell
(gci "HKU:\*\Software\Microsoft\Windows NT\CurrentVersion\Winlogon").PSPath | 
Foreach-Object {
  write-host "----Reg location is $_---" -ForegroundColor Magenta ; 
  gp $_ | 
  select -property * -exclude PS* |
  FL
}
```

For evidence of Run Key execution, query the `Microsoft-Windows-Shell-Core/Operational` log to find evidence if a registry run key was successful in executing:

```powershell
get-winevent -filterhashtable @{ logname = "Microsoft-Windows-Shell-Core/Operational" ; ID = 9707} |
select TimeCreated, Message, 
@{Name="UserName";Expression = {$_.UserId.translate([System.Security.Principal.NTAccount]).value}}  | 
sort TimeCreated -desc| fl
```

Screensaver persistence:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

```powershell
gp "HKU:\*\Control Panel\Desktop\" | select SCR* | fl
```

Then collect the `.scr` listed in the full path, and reverse engineer the binary.

To collect wallpaper info:

```powershell
gp "HKU:\*\Control Panel\Desktop\" | select wall* | fl
```

### Query Group Policy

Group policy can be leveraged and weaponised to propogate malware and even ransomware across the entire domain.

Query the changes made in the last X days:

```powershell
# collect the domain name as a variable to use later
$domain = (Get-WmiObject -Class win32_computersystem).domain; 
Get-GPO -All -Domain $domain | 
?{ ([datetime]::today - ($_.ModificationTime)).Days -le 10 } | sort
# Change the digit after -le to the number of days you want to go back for
```

### Query GPO Scripts

List all policies, and see where a policy contains a script or executable (change the `include` at the end to whatever is needed):

```powershell
$domain = (Get-WmiObject -Class win32_computersystem).domain;
gci -recurse \\$domain\\sysvol\$domain\Policies\ -file -include *.exe, *.ps1
```

To discover where GPO scripts live:

```powershell
$domain = (Get-WmiObject -Class win32_computersystem).domain;
gci -recurse \\$domain\\sysvol\*\scripts
```

## File queries

### Enumerating

Use the `tree` command to list the directories and files underneath the current working directory.

Use wildcard paths and files. For example, to list the pwsh scripts in their `\temp` directory:

```powershell
gci "C:\Users\*\AppData\Local\Temp\*" -Recurse -Force -File  -Include *.ps1, *.psm1, *.txt | 
ft lastwritetime, name -autosize | 
out-string -width 800
```

Check if a specific file or path is alive to quickly check for specific vulnerabilities. For example, for CVE-2021-21551:

```powershell
test-path -path "C:\windows\temp\DBUtil_2_3.Sys"
```

Test if files and directories are present or absent after for example, cleaning up:

```powershell
$Paths = "C:\windows" , "C:\temp", "C:\windows\system32", "C:\WhateverDir" ; 
if (Get-Process | where-object Processname -eq "explorer") {write "process working"} else {
foreach ($Item in $Paths){if (test-path $Item) {write "$Item present"}else{write "$Item absent"}}}
```

Query file contents:

```powershell
Get-item C:\Temp\Some.csv |
select-object -property @{N='Owner';E={$_.GetAccessControl().Owner}}, *time, versioninfo | fl 
```

### Alternate data streams

Show streams that aren't the normal `$DATA`:

```powershell
get-item evil.ps1 -stream "*" | where stream -ne ":$DATA"
```

Details:

```powershell
get-content evil.ps1 -steam "evil_stream"
```

Read hex of file:

```powershell
gc .\evil.ps1 -encoding byte | 
Format-Hex
```

### File types

Recursively look for particular file types, and once you find the files get their hashes:

```powershell
Get-ChildItem -path "C:\windows\temp" -Recurse -Force -File -Include *.aspx, *.js, *.zip|
Get-FileHash |
format-table hash, path -autosize | out-string -width 800
```

Compare two files' hashes:

```powershell
get-filehash "C:\windows\sysmondrv.sys" , "C:\Windows\HelpPane.exe"
```

### File manipulation

Copy multiple files to new location:

```powershell
copy-item "C:\windows\System32\winevt\Logs\Security.evtx", "C:\windows\System32\winevt\Logs\Windows PowerShell.evtx" -destination C:\temp
```

### Grep in Powershell

Change the string in the second line:

```powershell
ls C:\Windows\System32\* -include '*.exe', '*.dll' | 
select-string 'RunHTMLApplication' -Encoding unicode | 
select-object -expandproperty path -unique
```

With ascii:

```powershell
ls C:\Windows\System32\* -include '*.exe', '*.dll' | 
select-string 'RunHTMLApplication' -Encoding Ascii | 
select-object -expandproperty path -unique
```

## Registry queries

HKCU signifies Current User and results will be limited to the user you are. To see more results, you should change HKCU to HKU.

To set up HKU:

```powershell
New-PSDrive -PSProvider Registry -Name HKU -Root HKEY_USERS;
(Gci -Path HKU:\).name
```

### Enumerating

Show all registry keys:

```powershell
(Gci -Path Registry::).name
```

Show HK users:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS;(Gci -Path HKU:\).name
```

List the entries in the `HKEY_CURRENT_USER` subkey:

```powershell
(Gci -Path HKCU:\).name
```

Read a registry entry:

```powershell
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\SysmonDrv"
```

### Useful registry keys

Query timezone on an endpoint. Look for the `TimeZoneKeyName` value:

    HKLM\SYSTEM\CurrentControlSet\Control\TimeZoneInformation

Query the drives on the endpoint:

    HKLM\SYSTEM\MountedDevices

Query the services on this machine, and if you want to see more about one of the results just add it to the path:

    HKLM\SYSTEM\CurrentControlSet\Services
    HKLM\SYSTEM\CurrentControlSet\Services\ACPI

Query software on this machine:

    HKLM\Software
    HKLM\Software\PickOne

Query SIDs:

    HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList
    HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\[Long-SID-Number-HERE]

Query user's wallpaper. Once we know a user’s SID, we can go and look at these things:

    HKU\S-1-5-18\Control Panel\Desktop\

Query if credentials on a machine are being cached maliciously (network-wide):

```powershell
if ((Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest").UseLogonCredential -eq 1){write-host "Plain text credentials forced, likely malicious, on host: " -nonewline ;hostname } else { echo "/" }
```

### Response

Remediate:

```powershell
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest" /v UseLogonCredential /t REG_DWORD /d 0
```

To remove a registry entry, create HKU drive:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

Read the registry to make sure this is the entry to be removed:

```powershell
get-itemproperty -Path 'HKU:\*\Keyboard Layout\Preload\'
```

Remove it by piping it to `Remove-Item`:

```powershell
get-itemproperty -Path 'HKU:\*\Keyboard Layout\Preload\' | Remove-Item -Force -Confirm:$false -verbose
```

Check by trying to re-read it:

```powershell
get-itemproperty -Path 'HKU:\*\Keyboard Layout\Preload\'
```

If a Registry is under HKCU, it's not clear exactly WHO it can belong to. Get the SID of the user, and traverse to that as the path as HKU. For conversion:

```powershell
mount -PSProvider Registry -Name HKU -Root HKEY_USERS
```

## Driver queries

Bootkits and rootkits have been known to weaponise drivers.

You can utilise [Winbindex](https://winbindex.m417z.com/) to investigate drivers, and compare a local copy with the indexed info. Malicious copies may have a hash that doesn't match, or a file size that doesn't quite match.

### Printer drivers

Some legitimate drivers are not signed ; some malicious drivers sneak a signature.

```powershell
Get-PrinterDriver | fl Name, *path*, *file* 
```

### System drivers

Unsigned drivers:

```powershell
gci C:\Windows\*\DriverStore\FileRepository\ -recurse -include *.inf|
Get-AuthenticodeSignature | 
? Status -ne "Valid" | ft -autosize

gci -path C:\Windows\System32\drivers -include *.sys -recurse -ea SilentlyContinue | 
Get-AuthenticodeSignature | 
? Status -ne "Valid" | ft -autosize
```

Signed drivers:

```powershell
Get-WmiObject Win32_PnPSignedDriver | 
fl DeviceName, FriendlyName, DriverProviderName, Manufacturer, InfName, IsSigned, DriverVersion
```

Alternatives:

```powershell
gci -path C:\Windows\System32\drivers -include *.sys -recurse -ea SilentlyContinue | 
Get-AuthenticodeSignature | 
? Status -eq "Valid" | ft -autosize 
```

```powershell
gci C:\Windows\*\DriverStore\FileRepository\ -recurse -include *.inf|
Get-AuthenticodeSignature | 
? Status -eq "Valid" | ft -autosize
```

### Other Drivers

All 3rd party drivers:

```powershell
Get-WindowsDriver -Online -All | 
fl Driver, ProviderName, ClassName, ClassDescription, Date, OriginalFileName, DriverSignature 
```

### Drivers by Registry

Leverage the Registry to look at drivers. Knowing the driver, give the full path and wildcard the end:

```powershell
get-itemproperty -path "HKLM:\System\CurrentControlSet\Services\DBUtil*"
```

Not knowing the path, filter for drivers that have `\drivers\` in their ImagePath:

```powershell
get-itemproperty -path "HKLM:\System\CurrentControlSet\Services\*"  | 
? ImagePath -like "*drivers*" | 
fl ImagePath, DisplayName
```

### Drivers by time

To look for the drivers that exist via directory diving, focus on `.INF` and `.SYS` files, and sort by the time last written:

```powershell
gci C:\Windows\*\DriverStore\FileRepository\ -recurse -include *.inf | 
sort-object LastWriteTime -Descending |
ft FullName,LastWriteTime | out-string -width 850
```

```powershell
gci -path C:\Windows\System32\drivers -include *.sys -recurse -ea SilentlyContinue | 
sort-object LastWriteTime -Descending |
ft FullName,LastWriteTime | out-string -width 850
```

## DLL queries

### Enumerating

Get the DLLs involved with a specific process, their file location, their size, and if they have a company name:

```powershell
get-process -name "google*" | 
Fl @{l="Modules";e={$_.Modules | fl FileName, Size, Company | out-string}}
```

Details on the DLLs that a process may call on:

```powershell
(gps -name "google").Modules.FileName | Get-AuthenticodeSignature
```

As with drivers, if a DLL is signed or unsigned, it doesn't immediately signal malicious. There are plenty of official files on a Windows machine that are unsigned. Equally, malicious actors can get signatures for their malicious files too.

Get invalid DLL's:

```powershell
gci -path C:\Windows\*, C:\Windows\System32\*  -file -force -include *.dll |
Get-AuthenticodeSignature | ? Status -ne "Valid" 
```

Collect valid DLL's:

```powershell
gci -path C:\Windows\*, C:\Windows\System32\*  -file -force -include *.dll |
Get-AuthenticodeSignature | ? Status -eq "Valid" 
```

Details on a specific DLL:

```powershell
gci -path C:\Windows\twain_32.dll | get-filehash
gci -path C:\Windows\twain_32.dll | Get-AuthenticodeSignature 
```

## AV queries

If Defender is active, you can leverage PowerShell to query what threats the AV is facing:

```powershell
Get-MpThreatDetection | Format-List threatID, *time, ActionSuccess
```

Take the ThreatID and drill down further:

```powershell
Get-MpThreat -ThreatID
```

### Defender scan

Trigger Defender scan:

```powershell
Update-MpSignature; Start-MpScan
```

Full scan:

```powershell
Start-MpScan -ScanType FullScan
```

Specify path:

```powershell
Start-MpScan -ScanPath "C:\temp"
```

### Check if Defender has been manipulated

Adversaries enjoy simply turning off / disabling the AV. Query the status of Defender's detections:

```powershell
Get-MpComputerStatus | fl *enable*
```

And enjoy adding exclusions to AV (Note that some legitimate tooling and vendors ask that some directories and executables are placed on the exclusion list):

```powershell
Get-MpPreference | fl *Exclu*
```

### Responses

If some values have been disabled, re-enable with:

```powershell
Set-MpPreference -DisableRealtimeMonitoring $false -verbose
```

Get rid of the exclusions made by the adversary:

```powershell
Remove-MpPreference -ExclusionProcess 'velociraptor' -ExclusionPath 'C:\Users\IEUser\Pictures' -ExclusionExtension '.pif' -force -verbose
```

## Log queries

From a security perspective, you probably don't want to query logs on the endpoint itself. Endpoints after a malicious event can not be trusted. You're better to focus on the logs that have been forwarded from endpoints and centralised in your SIEM.

### Enumerating

Show logs that are enabled and whose contents are not empty:

```powershell
Get-WinEvent -ListLog *|
where-object {$_.IsEnabled -eq "True" -and $_.RecordCount -gt "0"} | 
sort-object -property LogName | 
format-table LogName -autosize -wrap
```

Details on a log:

```powershell
Get-WinEvent -ListLog Microsoft-Windows-Sysmon/Operational | Format-List -Property * 
```

Last time a log was written to:

```powershell
(Get-WinEvent -ListLog Microsoft-Windows-Sysmon/Operational).lastwritetime 
```

### Response

An adversary can evade endpoint logging. It's better to use logs that have been taken to a central point, to trust `EVENT ID`s from `Sysmon`, or trust network traffic if you have it.

## Powershell

### WhatIf

`-WhatIf` is quite a cool flag, as it will tell you what will happen if you run a command. So before you kill a vital process for example, if you include `-WhatIf` you'll gain some insight into the irreversible future!

### Clip

You can pipe straight to your clipboard. Then all you have to do is paste.

### Stop truncation

Powershell truncates stuff, even when it's really unhelpful and pointless for it to do so. To fix this, use `out-string` at the very end of whatever you're running and is getting truncated:

```text
| outstring -width 250
```

### Transcripts

Trying to report back what you ran, when you ran, and the results of your commands can become a chore. If you forget a pivotal screenshot, ... Instead, ask PowerShell to create a log of everything we run and see on the command line.

```powershell
Start-Transcript -path "C:\Malware_Analysis\$(Get-Date -UFormat "%Y_%b_%d_%a_UTC%Z")\PwSh_transcript.log" -noclobber -IncludeInvocationHeader
```

At the end of the analysis, stop all transcripts:

```powershell
Stop-transcript
```

You can open up your Powershell transcript with notepad.

## Resources

* [About DFIR/Tools & Artifacts > Windows](https://aboutdfir.com/toolsandartifacts/windows/)
* [DFIR Artifacts > Windows Artifact List](https://dfirartifacts.com/windows-artifacts/)
