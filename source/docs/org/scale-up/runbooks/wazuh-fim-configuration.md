# FIM configuration

Runbook for configuring Wazuh File Integrity Monitoring. FIM watches specified directories and files for changes: additions, modifications, deletions, and permission changes. When a monitored file changes, Wazuh generates an alert with the before and after state, the user that made the change, and the process responsible. The incident that prompted Wazuh deployment was a legitimate file modification that went unnoticed; FIM would have surfaced it immediately with full context.

## How FIM works

Wazuh FIM operates in two modes:

Real-time: uses Linux inotify to detect changes as they happen. Low latency (seconds). Higher resource usage. Used for the most sensitive directories.

Scheduled: scans directories on a configurable interval and compares checksums against a stored baseline. Lower resource usage. Used for directories where immediate alerting is less critical.

FIM records a baseline hash of each monitored file on first scan. Subsequent scans compare the current hash against the baseline. A change generates a `syscheck` alert.

## Base FIM configuration

The base FIM configuration applies to all servers via the `servers` agent group. It is defined in `/var/ossec/etc/shared/servers/agent.conf` on the manager:

```
<agent_config>
  <syscheck>
    <frequency>43200</frequency>
    <scan_on_start>yes</scan_on_start>
    <alert_new_files>yes</alert_new_files>
    <auto_ignore frequency="10" timeframe="3600">no</auto_ignore>

    <!-- Real-time monitoring for critical paths -->
    <directories realtime="yes" check_all="yes" report_changes="yes">/etc</directories>
    <directories realtime="yes" check_all="yes" report_changes="yes">/usr/bin</directories>
    <directories realtime="yes" check_all="yes" report_changes="yes">/usr/sbin</directories>
    <directories realtime="yes" check_all="yes">/boot</directories>

    <!-- Scheduled monitoring for application directories -->
    <directories check_all="yes" report_changes="yes">/var/www</directories>
    <directories check_all="yes">/opt</directories>

    <!-- SSH key monitoring (real-time, all users) -->
    <directories realtime="yes" check_all="yes" report_changes="yes">/root/.ssh</directories>
    <directories realtime="yes" check_all="yes" report_changes="yes">/home</directories>

    <!-- Exclusions: directories that change frequently by design -->
    <ignore>/etc/mtab</ignore>
    <ignore>/etc/hosts.deny</ignore>
    <ignore>/etc/mail/statistics</ignore>
    <ignore>/etc/random-seed</ignore>
    <ignore>/etc/adjtime</ignore>
    <ignore>/etc/resolv.conf</ignore>
    <ignore type="sregex">/etc/.*\.dpkg-.*</ignore>
    <ignore type="sregex">/etc/.*\.ucf-.*</ignore>

    <!-- Alert on new files in these locations -->
    <nodiff>/etc/ssl/private</nodiff>
  </syscheck>
</agent_config>
```

`report_changes="yes"` includes a unified diff of text file changes in the alert. For the `merchants-guild-app-03` incident that prompted this deployment, `report_changes` would have shown exactly what changed in the configuration file, not just that it changed.

`auto_ignore` is disabled. This prevents Wazuh from silently ignoring files that change frequently. Legitimate frequent changes (cron job outputs, lock files) are handled via explicit `<ignore>` entries.

## Vault node FIM configuration

Vault nodes receive additional FIM rules via the `vault-nodes` group configuration at `/var/ossec/etc/shared/vault-nodes/agent.conf`:

```
<agent_config>
  <syscheck>
    <directories realtime="yes" check_all="yes" report_changes="yes">/opt/vault</directories>
    <directories realtime="yes" check_all="yes" report_changes="yes">/etc/vault.d</directories>
    <directories realtime="yes" check_all="yes">/etc/systemd/system/vault.service.d</directories>

    <!-- Vault audit log directory: alert on deletion only, not modification -->
    <directories realtime="yes" check_owner="yes" check_perm="yes">/var/log/vault</directories>
  </syscheck>
</agent_config>
```

Any change to Vault's binary, configuration files, or systemd unit generates an immediate alert. Permission changes to the audit log directory are also alerted; log deletion or permission relaxation is a common attacker technique to cover tracks.

## Developer workstation FIM configuration

Developer workstations get a focused configuration via the `developer-workstations` group. Full `/etc` scanning on workstations generates excessive noise from package updates. The focus is on credential and key files:

```
<agent_config>
  <syscheck>
    <frequency>3600</frequency>

    <!-- SSH key monitoring -->
    <directories realtime="yes" check_all="yes" report_changes="yes">/home/<user>/.ssh</directories>

    <!-- GPG keyring (for git commit signing) -->
    <directories check_all="yes">/home/<user>/.gnupg</directories>

    <!-- Shell history (detect commands run, e.g. curl to unusual IPs) -->
    <directories realtime="yes" check_all="yes">/home/<user>/.bash_history</directories>
    <directories realtime="yes" check_all="yes">/home/<user>/.zsh_history</directories>
  </syscheck>
</agent_config>
```

The phishing incident caught two weeks after Wazuh deployment was detected by FIM on the developer's workstation: an `~/.ssh/authorized_keys` file was created (new file alert, real-time) at a time when the developer was not working. The alert fired within seconds.

## Custom FIM rules

FIM alerts use Wazuh's built-in rules (rule IDs 550-580). Add custom rules for Golem Trust-specific scenarios in `/var/ossec/etc/rules/local_rules.xml`:

```
<!-- Alert when authorized_keys is added to any user's home directory -->
<rule id="100001" level="12">
  <if_sid>554</if_sid>
  <field name="file" type="pcre2">\.ssh/authorized_keys$</field>
  <description>New authorized_keys file created in user home directory</description>
  <mitre>
    <id>T1098.004</id>
  </mitre>
</rule>

<!-- Alert on deletion of log files -->
<rule id="100002" level="12">
  <if_sid>553</if_sid>
  <field name="file" type="pcre2">/var/log/.*\.log$</field>
  <description>Log file deleted - possible evidence tampering</description>
  <mitre>
    <id>T1070.002</id>
  </mitre>
</rule>

<!-- Alert on modification of sudoers -->
<rule id="100003" level="14">
  <if_sid>550</if_sid>
  <field name="file" type="pcre2">/etc/sudoers</field>
  <description>sudoers file modified</description>
  <mitre>
    <id>T1548.003</id>
  </mitre>
</rule>
```

Rule level 12 and above generate immediate alerts. Rule level 14 (sudoers modification) wakes Angua at 03:00 if necessary. `<mitre>` tags map the alert to MITRE ATT&CK technique IDs, which the Wazuh dashboard uses to populate the threat intelligence view.

## Verifying FIM is active

From the Wazuh dashboard, navigate to an agent, then Integrity Monitoring. The last scan time and monitored file count are displayed. A count of zero indicates the agent is not performing FIM scans; check the agent configuration and restart the agent.

Test FIM manually by creating a file in a monitored directory:

```
touch /etc/wazuh-fim-test-$(date +%s)
```

An alert should appear in the dashboard within a few seconds under Integrity Monitoring events. Delete the test file after confirming:

```
rm /etc/wazuh-fim-test-*
```
