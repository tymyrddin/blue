# Remediation workflows

Playbook for responding to configuration drift and OpenSCAP compliance failures. When a server deviates from the baseline defined in the Ansible playbooks, or when an OpenSCAP scan reports a failed control, the remediation workflow brings the host back into compliance. The response depends on whether the drift is simple (resolvable by re-running the playbook) or complex (requires investigation before remediation).

## Drift detection

Configuration drift is detected in two ways:

Daily Ansible check mode runs compare live host state against the playbook definitions. Any task that would change if applied is reported as drift. The check mode run does not modify hosts; it only reports what differs.

Weekly OpenSCAP scans detect configuration that has drifted from the CIS benchmark profile, including settings that Ansible does not explicitly manage.

The daily drift check runs from the GitLab CI schedule in the `ansible-playbooks` repository:

```
drift-check:
  stage: audit
  tags:
    - ansible
  script:
    - ansible-playbook --check --diff site.yml 2>&1 | tee drift-report.txt
    - |
      if grep -q "changed=" drift-report.txt; then
        echo "DRIFT DETECTED - review drift-report.txt"
        exit 1
      fi
  artifacts:
    when: always
    paths:
      - drift-report.txt
    expire_in: 90 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
```

When this job fails (drift detected), GitLab sends an alert to the `#infra-alerts` channel and creates a Graylog event. Cheery triages the alert the same day.

## Simple remediation

Simple drift covers cases where a setting has changed from the intended value but there is no indication of malicious activity or complex interdependency. Examples: a configuration file was manually edited, a package was installed outside the playbook, a sysctl value was changed by a kernel update.

For simple drift, re-run the relevant playbook role against the affected host:

```
ansible-playbook site.yml --limit <hostname>
```

This resets the host to the desired state. The subsequent drift check run should report no changes.

Document the remediation in the drift register (see below). If the same drift recurs on the same host, investigate the cause rather than just re-applying.

## Complex remediation

Complex drift requires investigation before remediation. Examples: an unexpected process is running, a user account was created outside Ansible, a service configuration file has been modified in a way that suggests intentional tampering.

Do not re-run the playbook immediately. Instead:

1. Capture the current state for forensic record before making any changes. Save the full file listing, running processes, and open network connections:

```
ss -tulnp > /tmp/connections-$(hostname)-$(date +%Y%m%d%H%M).txt
ps auxf > /tmp/processes-$(hostname)-$(date +%Y%m%d%H%M).txt
find /etc /usr/local /opt -newer /var/lib/dpkg/info -ls > /tmp/modified-files-$(hostname)-$(date +%Y%m%d%H%M).txt
```

2. Check the Graylog audit stream for the affected host for the period since the last clean scan. Look for authentication events, sudo usage, and file modification events from Wazuh FIM.

3. If the investigation suggests the drift is benign (for example, a developer ran a manual command and forgot to update the playbook), update the playbook to capture the change, merge it, and then re-apply.

4. If the investigation is inconclusive or suggests a potential security event, escalate to Ludmilla and treat as a security incident. Do not remediate until the incident scope is understood.

## Drift register

Maintain a drift register in the `ansible-playbooks` repository at `drift/register.md`. Each entry records:

```
| Date       | Host                   | Finding                            | Classification | Resolution                          | Resolved   |
|------------|------------------------|------------------------------------|----------------|-------------------------------------|------------|
| 2026-03-10 | gitlab.golemtrust.am   | sshd MaxSessions changed to 10     | Simple         | Re-applied ssh-hardening role       | 2026-03-10 |
| 2026-03-15 | vault-02.golemtrust.am | Unknown user account 'tmpuser'     | Complex        | Account removed; Graylog reviewed   | 2026-03-16 |
```

The drift register is reviewed monthly by Cheery and quarterly by Ludmilla. Recurring simple drift on the same host may indicate a process or application that is fighting the Ansible configuration; this requires a playbook fix rather than repeated manual remediation.

## OpenSCAP failure remediation

OpenSCAP failures imported into DefectDojo are triaged in the weekly DefectDojo review. Each finding is classified as one of:

Accepted: the control is not applicable or is covered by a compensating control. Add the rule to the OpenSCAP tailoring file with a comment and Ludmilla's approval.

Playbook gap: the Ansible playbooks do not enforce this control. Add a task to the relevant role, test in staging, merge, and re-apply. The finding will resolve at the next weekly scan.

Actual drift: the host was in compliance at the last scan but has drifted since. Follow the simple or complex remediation workflow above.

## Auto-remediation

For a small set of well-understood, low-risk drift categories, automatic remediation is configured. When the daily drift check detects drift in one of these categories, the CI pipeline proceeds immediately to apply the fix without waiting for human triage:

- `sysctl` values changed (kernel hardening parameters)
- `unattended-upgrades` configuration modified
- MOTD file changed

The auto-remediation pipeline job runs `ansible-playbook` with specific tags rather than the full site playbook:

```
auto-remediate:
  stage: remediate
  tags:
    - ansible
  script:
    - ansible-playbook site.yml --tags sysctl,unattended-upgrades,motd
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
      when: on_failure
```

Auto-remediation actions are logged to Graylog and recorded in the drift register automatically via a post-task hook in the relevant roles. Otto Chriek requires that all auto-remediation events are visible in the audit log.

Changes to SSH configuration, firewall rules, user accounts, or installed packages are never auto-remediated. These require human review.
