# Autoruns and OS persistence hunting

Systematically enumerating all persistence mechanisms on Windows and Linux endpoints to identify implanted entries.

## Windows: Sysinternals Autoruns

Autoruns is the most comprehensive Windows autorun enumerator. It covers
scheduled tasks, services, registry run keys, startup folders, browser
extensions, drivers, codecs, and more.

```text
# run as administrator for full visibility
# from command line (headless, outputs to CSV)
autorunsc.exe -accepteula -a * -c -h -s > autoruns-output.csv

# flags:
#   -a *    all entry types
#   -c      CSV output
#   -h      show file hashes (SHA-256)
#   -s      check VirusTotal (requires internet)
```

Review the output for:
- Entries with no publisher signature (`(not verified)`)
- Entries pointing to unusual paths (temp directories, user profiles, AppData)
- Entries with base64-encoded command lines
- Entries whose hash appears on VirusTotal

Compare against a known-good baseline from a clean system image. New entries
since the last known-good state are the highest priority.

```powershell
# PowerShell: compare two Autoruns CSV exports
$baseline = Import-Csv baseline-autoruns.csv
$current  = Import-Csv current-autoruns.csv

# entries in current that were not in the baseline
$current | Where-Object {
    $entry = $_
    -not ($baseline | Where-Object { $_.ImagePath -eq $entry.ImagePath })
} | Select-Object 'Entry Location', 'Entry', 'Image Path', 'Launch String'
```

## Windows: scheduled tasks

```powershell
# all enabled tasks with their execute actions and authors
Get-ScheduledTask | Where-Object { $_.State -ne 'Disabled' } |
  ForEach-Object {
    $t = $_
    $actions = $t.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)" }
    [PSCustomObject]@{
        Path    = $t.TaskPath + $t.TaskName
        Actions = $actions -join '; '
        Author  = $t.Author
        RunAs   = ($t.Principal | Select-Object -ExpandProperty UserId)
    }
  } | Where-Object {
    # flag tasks with PowerShell, encoded content, or unusual run-as accounts
    $_.Actions -match 'powershell|cmd|wscript|cscript|mshta|regsvr32' -or
    $_.Actions -match '-enc|-encoded|-e ' -or
    $_.Actions -match 'Temp|AppData|Users\\[^\\]+\\' -or
    ($_.RunAs -eq 'SYSTEM' -and $_.Author -notmatch 'Microsoft|Windows')
  } | Format-List
```

```powershell
# check task XML for hidden flags
Get-ScheduledTask | ForEach-Object {
    $xml = [xml](Export-ScheduledTask -TaskName $_.TaskName -TaskPath $_.TaskPath)
    if ($xml.Task.Settings.Hidden -eq 'true') {
        Write-Output "HIDDEN TASK: $($_.TaskPath)$($_.TaskName)"
    }
}
```

## Windows: WMI subscriptions

```powershell
# enumerate all three required objects
Write-Output "=== Event Filters ==="
Get-WMIObject -Namespace root\subscription -Class __EventFilter |
  Select-Object Name, Query | Format-Table -AutoSize

Write-Output "=== CommandLine Consumers ==="
Get-WMIObject -Namespace root\subscription -Class CommandLineEventConsumer |
  Select-Object Name, CommandLineTemplate | Format-Table -AutoSize

Write-Output "=== Script Consumers ==="
Get-WMIObject -Namespace root\subscription -Class ActiveScriptEventConsumer |
  Select-Object Name, ScriptText | Format-Table -AutoSize

Write-Output "=== Bindings ==="
Get-WMIObject -Namespace root\subscription -Class __FilterToConsumerBinding |
  Select-Object Filter, Consumer | Format-Table -AutoSize
```

Any WMI subscription not associated with a known endpoint management product
(SCCM, endpoint protection) is worth treating as suspicious. Most systems have
zero legitimate WMI subscriptions.

## Windows: services

```powershell
# services with automatic start and non-standard binary paths
Get-WmiObject Win32_Service |
  Where-Object { $_.StartMode -eq 'Auto' -and $_.State -eq 'Running' } |
  Where-Object {
    $_.PathName -notmatch '^"?C:\\Windows\\' -and
    $_.PathName -notmatch '^"?C:\\Program Files'
  } |
  Select-Object Name, DisplayName, PathName, StartName | Format-List
```

## Linux: cron

```bash
# check all cron locations for all users
for user in $(cut -f1 -d: /etc/passwd); do
    crontab -l -u "$user" 2>/dev/null | grep -v '^#' |
      awk -v u="$user" 'NF {print u": "$0}'
done

cat /etc/crontab
for f in /etc/cron.d/*; do
    echo "=== $f ==="; grep -v '^#' "$f" | grep -v '^$'
done
```

Look for:
- `curl | bash` or `wget | sh` patterns
- References to unusual paths (user home directories in system cron)
- Scripts placed in directories consistent with attacker naming (see checklist)

## Linux: systemd

```bash
# all enabled services and timers
systemctl list-units --type=service --state=enabled --no-pager
systemctl list-timers --all --no-pager

# check unit files for suspicious content
for f in /etc/systemd/system/*.service; do
    if grep -qE 'curl|wget|bash.*http|python.*-c' "$f" 2>/dev/null; then
        echo "SUSPICIOUS: $f"
        cat "$f"
    fi
done

# show recently modified unit files (last 30 days)
find /etc/systemd/system /lib/systemd/system -name '*.service' -newer /etc/passwd -ls
```

## Linux: SSH keys

```bash
# check authorized_keys for all users with home directories
while IFS=: read -r user _ uid _ _ homedir _; do
    [[ $uid -ge 1000 || $user == "root" ]] || continue
    keyfile="$homedir/.ssh/authorized_keys"
    if [[ -f "$keyfile" ]]; then
        echo "=== $user ($keyfile) ==="
        cat "$keyfile"
    fi
done < /etc/passwd
```

Compare every key against an organisation's authorised key inventory. Any
unrecognised key is a finding.

## Velociraptor (at scale)

For fleet-wide hunting, Velociraptor provides artefact-based collection:

```yaml
# collect Windows.Sysinternals.Autoruns across all endpoints
# from Velociraptor server UI or using velociraptor query:
SELECT * FROM Artifact.Windows.Sysinternals.Autoruns()
WHERE NOT Signer =~ 'Microsoft'
  AND NOT Signer =~ 'Windows'
  AND Enabled = 'true'
```

```yaml
# hunt for WMI subscriptions fleet-wide
SELECT * FROM Artifact.Windows.Persistence.PermanentWMIEvents()
```

Results from multiple endpoints can be correlated: an identical WMI subscription
name appearing on many endpoints is likely a managed entry; one appearing on a
single endpoint is suspicious.
