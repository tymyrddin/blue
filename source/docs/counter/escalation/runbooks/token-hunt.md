# Token impersonation and Potato variant detection

Two hunts: unexpected SeImpersonatePrivilege assignments outside the expected set of
service identities, and process tree anomalies where service accounts produce interactive
shells or SYSTEM-level processes consistent with a successful impersonation chain.

## Unexpected SeImpersonatePrivilege assignments

Hypothesis: an account outside the expected set of service identities holds
SeImpersonatePrivilege, creating the precondition for Potato-family escalation.

Data source: local security policy, enumerated via secedit.

The expected holders are narrow: NT AUTHORITY\SYSTEM, NT AUTHORITY\LOCAL SERVICE,
NT AUTHORITY\NETWORK SERVICE, NT AUTHORITY\SERVICE, IIS application pool identities
(SID prefix S-1-5-82), and named service accounts for software that explicitly requires
it (SQL Server, print spooler services, and equivalents).

```powershell
$right    = 'SeImpersonatePrivilege'
$tempFile = [System.IO.Path]::GetTempFileName()

secedit /export /areas USER_RIGHTS /cfg $tempFile | Out-Null

$lines    = Get-Content $tempFile
$privLine = $lines | Where-Object { $_ -match "^$right\s*=" }
Remove-Item $tempFile -Force

if ($privLine) {
    $holders = ($privLine -split '=', 2)[1].Trim() -split ','

    $expected = @(
        '*S-1-5-18',   # SYSTEM
        '*S-1-5-19',   # LOCAL SERVICE
        '*S-1-5-20',   # NETWORK SERVICE
        '*S-1-5-6',    # SERVICE
        '*S-1-5-82*'   # IIS APPPOOL identities
    )

    foreach ($holder in $holders) {
        $holder = $holder.Trim()
        $isExpected = $false
        foreach ($exp in $expected) {
            if ($holder -like $exp) { $isExpected = $true; break }
        }
        if (-not $isExpected) {
            Write-Output "Unexpected holder: $holder"
        }
    }
} else {
    Write-Output "$right not explicitly assigned in local policy"
}
```

Named service accounts for legitimate software appear alongside the expected SIDs. The
flag is an account outside the known set: an interactive user account, a domain account
without a clear service function, or an entry absent from a previous baseline. The query
is worth running on both workstations and servers; workstations rarely have a legitimate
reason to have any SeImpersonatePrivilege holders beyond SYSTEM and the service SIDs.

## Service account spawning interactive shells

Hypothesis: an attacker holding SeImpersonatePrivilege under a service account has
escalated via a Potato variant and produced a shell running as SYSTEM.

Data sources: `Sysmon Event ID 1` (ProcessCreate).

```powershell
$startTime = (Get-Date).AddHours(-24)

$servicePatterns = @(
    'iis apppool\\',
    'nt authority\\network service',
    'nt authority\\local service',
    'mssql',
    'sqlserver'
)

$shells = @('cmd.exe', 'powershell.exe', 'pwsh.exe', 'wscript.exe', 'cscript.exe',
            'mshta.exe')

Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 1
    StartTime = $startTime
} | ForEach-Object {
    $xml   = [xml]$_.ToXml()
    $data  = $xml.Event.EventData.Data

    $image     = ($data | Where-Object Name -eq 'Image').'#text'
    $user      = ($data | Where-Object Name -eq 'User').'#text'
    $parent    = ($data | Where-Object Name -eq 'ParentImage').'#text'
    $integrity = ($data | Where-Object Name -eq 'IntegrityLevel').'#text'

    $imageName  = Split-Path $image -Leaf
    $fromService = $servicePatterns | Where-Object { $user -imatch $_ }
    $isShell     = $shells -contains $imageName

    if ($fromService -and $isShell) {
        [PSCustomObject]@{
            Time      = $_.TimeCreated
            Shell     = $image
            User      = $user
            Parent    = $parent
            Integrity = $integrity
        }
    }
} | Sort-Object Time
```

A shell spawned under an IIS app pool identity or SQL service account is anomalous in
almost all production environments. The parent process is worth attention: w3wp.exe spawning
cmd.exe is a known webshell indicator independent of the privilege escalation context;
after escalation the chain often shows a service process spawning a System-integrity
shell that is not the direct webshell parent.

## Named pipe server from low-privilege process

Hypothesis: an attacker is staging a Potato-family attack by creating a named pipe to
capture a SYSTEM token connection from a coerced service.

Data sources: `Sysmon Events 17 and 18` (Pipe Created, Pipe Connected); requires Sysmon
PipeEvent logging enabled.

The pattern: a service account process creates a named pipe, and within a short window a
SYSTEM-context process connects to it.

```powershell
$startTime = (Get-Date).AddMinutes(-60)

$pipeEvents = Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = @(17, 18)
    StartTime = $startTime
} | ForEach-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data

    [PSCustomObject]@{
        Time     = $_.TimeCreated
        EventId  = $_.Id
        PipeName = ($data | Where-Object Name -eq 'PipeName').'#text'
        Image    = ($data | Where-Object Name -eq 'Image').'#text'
    }
}

$created   = $pipeEvents | Where-Object EventId -eq 17
$connected = $pipeEvents | Where-Object EventId -eq 18

foreach ($c in $created) {
    $match = $connected | Where-Object {
        $_.PipeName -eq $c.PipeName -and
        $_.Time -gt $c.Time -and
        ($_.Time - $c.Time).TotalSeconds -lt 30 -and
        $_.Image -ne $c.Image
    }
    if ($match) {
        [PSCustomObject]@{
            PipeName    = $c.PipeName
            Created     = $c.Time
            CreatedBy   = $c.Image
            Connected   = $match.Time
            ConnectedBy = $match.Image
        }
    }
}
```

A pipe created by a service account process and connected to within seconds by a SYSTEM
process (spoolsv.exe, a SYSTEM-context svchost.exe, or a COM surrogate running as SYSTEM)
is the Potato-family indicator. Random-looking or short hexadecimal pipe names from
unexpected creator processes narrow the field; legitimate named pipes from known services
appear consistently from the same image paths.
