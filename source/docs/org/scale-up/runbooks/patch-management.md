# Patch management

Runbook for applying security patches to Golem Trust infrastructure. Unattended-upgrades handles routine security package updates automatically. This runbook covers the cases that require human involvement: emergency patches for critical vulnerabilities, kernel updates that require a reboot, and the staged rollout procedure for changes that carry operational risk.

## Patch categories

Routine security updates: applied automatically by unattended-upgrades within 24 hours of appearing in the `debian-security` repository. These require no manual intervention. The weekly OpenSCAP scan and Prometheus alert for pending updates confirm that unattended-upgrades is functioning.

Kernel updates: the unattended-upgrades configuration applies kernel packages automatically but does not trigger a reboot. Reboots are applied during the Sunday 02:00 maintenance window via cron. Any reboot pending for more than seven days triggers a Prometheus alert.

Emergency patches: critical CVEs (CVSS 9.0+) in packages that unattended-upgrades does not cover, or that require a coordinated update across multiple services, follow the emergency patch procedure below.

Major version upgrades (for example, Debian 12 to 13, PostgreSQL 16 to 17): treated as infrastructure changes, applied via Ansible playbook updates, and follow the playbook development and merge request process.

## Checking patch status

View pending updates on all hosts via Ansible:

```
ansible all -m ansible.builtin.apt -a "update_cache=yes" --check
ansible all -m ansible.builtin.shell -a "apt-get -s upgrade 2>/dev/null | grep '^Inst'"
```

View the reboot-required status:

```
ansible all -m ansible.builtin.stat -a "path=/var/run/reboot-required" \
  | grep -A2 "exists.*true"
```

Prometheus monitors pending security updates via the `apt` collector in the node exporter. Alert rule:

```
- alert: SecurityUpdatesPending
  expr: apt_upgrades_pending{origin="*-security"} > 0
  for: 24h
  labels:
    severity: warning
  annotations:
    summary: "Security updates pending on {{ $labels.instance }}"
    description: >
      {{ $labels.instance }} has {{ $value }} security updates pending for more than 24 hours.
      Check unattended-upgrades status: systemctl status unattended-upgrades
```

## Emergency patch procedure

For critical vulnerabilities requiring immediate action outside the automatic update cycle:

1. Verify the vulnerability affects Golem Trust infrastructure. Check the affected package and version against the installed version:

```
ansible all -m ansible.builtin.shell \
  -a "dpkg-query -W -f='\${Package} \${Version}\n' <package-name> 2>/dev/null"
```

2. Confirm a patched version is available in the Debian security repository:

```
apt-cache policy <package-name>
```

3. Apply the patch to one staging host first. Monitor for 30 minutes:

```
ansible <staging-host> -m ansible.builtin.apt \
  -a "name=<package-name> state=latest update_cache=yes"
```

4. If staging is clean, apply to one production host and monitor for one hour:

```
ansible <first-production-host> -m ansible.builtin.apt \
  -a "name=<package-name> state=latest update_cache=yes"
```

5. Apply to remaining production hosts:

```
ansible all -m ansible.builtin.apt \
  -a "name=<package-name> state=latest update_cache=yes" \
  --limit 'all:!<first-production-host>'
```

6. If the patch requires a reboot, schedule reboots during the next available maintenance window, or immediately for Critical severity with Ludmilla's approval. Reboot one host at a time to maintain service availability:

```
ansible <hostname> -m ansible.builtin.reboot \
  -a "reboot_timeout=300 post_reboot_delay=60"
```

7. Run OpenSCAP and the drift check after patching to confirm no configuration was disrupted.

8. Record the emergency patch in the patch register (see below).

## Staged rollout

For patches that are not emergencies but carry meaningful risk (database engine patches, web server patches, authentication service patches), use the staged rollout procedure:

Stage 1: apply to staging environment and run the full test suite. Allow 24 hours for monitoring.

Stage 2: apply to one production instance. For clustered services (Vault, Kubernetes nodes), apply to one replica and confirm the cluster remains healthy before proceeding.

Stage 3: apply to remaining production instances, one at a time, with a minimum of one hour between each application.

The `patch.yml` playbook supports staged rollout via serial limits:

```
- hosts: infrastructure
  serial:
    - 1
    - "20%"
    - "100%"
  tasks:
    - name: Apply security updates
      ansible.builtin.apt:
        upgrade: safe
        update_cache: yes
```

The `serial` directive applies the playbook to one host first, then 20% of remaining hosts, then all remaining hosts. If any host in a batch fails, the playbook stops before proceeding to the next batch.

## Patch register

Maintain a patch register in the `ansible-playbooks` repository at `patch/register.md`. Each manually applied patch is recorded:

```
| Date       | CVE(s)                        | Package         | Hosts affected | Applied by          | Notes                            |
|------------|-------------------------------|-----------------|----------------|---------------------|----------------------------------|
| 2026-03-15 | CVE-2026-NNNNN (Critical)     | libssl3         | all            | ludmilla            | Emergency procedure; reboot not required |
| 2026-03-01 | CVE-2026-MMMMM (High)         | postgresql-16   | db hosts       | cheery              | Staged rollout; 2h between stages |
```

Routine unattended-upgrades activity is not recorded in the patch register; it is visible in the `unattended-upgrades` logs shipped to Graylog. Only manually applied patches and emergency procedures are recorded here.

Otto Chriek reviews the patch register quarterly and cross-references it against the CVE disclosure dates to verify that response time targets (48 hours for Critical, 7 days for High) were met.
Last updated: 20 March 2026
