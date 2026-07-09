# Wazuh alert tuning

Playbook for managing false positives and maintaining detection coverage in Wazuh. Alert
fatigue and missed detections are two sides of the same problem: too much noise trains the
response to treat all alerts as background, and the real event disappears into it. Angua
leads tuning decisions. Cheery owns the monthly review and documents every change in the
local rules commentary.

## Tuning or investigation?

The first question when a rule is generating unexpected volume is whether it is a tuning
problem or a security signal. Two patterns indicate which is which.

A rule firing frequently across many hosts, after a system change such as a package update
or a configuration deployment, is almost certainly capturing a legitimate change in system
state. The noise is the result of the environment diverging from the FIM baseline. This is
a tuning candidate.

A rule firing on a single host, at an unusual time, with no corresponding maintenance
activity, is more likely a real event. Investigating before tuning is the correct order.

The Wazuh dashboard's "Top 10 triggered rules" view, filtered to the last 24 hours, is the
starting point. Rules that dominate the count on days with known maintenance are usually
tuning candidates. Rules that dominate the count on quiet days deserve attention first.

## FIM noise management

FIM false positives cluster around a few well-understood sources.

Package manager operations leave temporary files under `/etc/` during installs and upgrades.
The base FIM configuration already ignores `.dpkg-old`, `.dpkg-new`, `.dpkg-tmp`,
`.ucf-old`, `.ucf-new`, and `.ucf-bak` via regex patterns in `<ignore type="sregex">`
entries. If new dpkg or ucf patterns appear after a distribution update, add them explicitly
to the agent group configuration in `/var/ossec/etc/shared/servers/agent.conf`:

```xml
<ignore type="sregex">/etc/.*\.dpkg-.*</ignore>
<ignore type="sregex">/etc/.*\.ucf-.*</ignore>
```

Unattended-upgrades runs on Sundays at 02:00. A burst of FIM alerts on Sunday mornings from
files modified in `/etc/`, `/usr/bin/`, and `/usr/sbin/` is expected and benign when the
timing aligns with the maintenance window and the files correspond to upgraded packages. To
reduce this noise without suppressing legitimate changes outside the maintenance window, add
a time-of-day filter to the Graylog high-severity FIM alert condition rather than modifying
the Wazuh rule. The Wazuh rule fires correctly; the notification channel is gated.

`/etc/resolv.conf` changes frequently on cloud instances. It is already in the base ignore
list. If a host is generating resolv.conf alerts, check that the agent group configuration
includes the ignore entry. Agents poll for updated group configuration automatically at
the next check-in interval (roughly 10 minutes). To apply the change immediately, restart
the agent on the target host:

```
systemctl restart wazuh-agent
```

Do not use `<auto_ignore>` to silence high-frequency paths. `auto_ignore` suppresses files
that change beyond a configured frequency without creating any audit record. Explicit
`<ignore>` entries are visible to Cheery in the quarterly audit and can be removed when the
reason for them no longer applies.

## Active response threshold adjustment

The SSH brute force active response (rule 5763: 10 attempts in 2 minutes) can fire on hosts
with multiple legitimate automated SSH connections, particularly deployment systems and
monitoring agents that reconnect frequently.

Before adjusting the threshold, check the Graylog Wazuh Active Response stream to see which
IP addresses are being blocked. If blocked IPs fall within the Headscale range, the Helsinki
or Nuremberg Hetzner ranges, or the Frankfurt monitor IP, the whitelist in `ossec.conf` is
incomplete. Fix the whitelist first:

```xml
<global>
  <white_list>100.64.0.0/10</white_list>
  <white_list>95.216.0.0/16</white_list>
  <white_list>116.203.0.0/16</white_list>
  <white_list>127.0.0.1</white_list>
</global>
```

Add the Frankfurt monitor IP explicitly if it is not covered by the Hetzner range. Test the
whitelist by confirming that SSH from the Frankfurt monitor does not trigger the active
response after a simulated high-frequency connection sequence.

If the threshold itself needs adjustment, override the composite brute force rule in
`/var/ossec/etc/rules/local_rules.xml` using the `overwrite="yes"` attribute on the rule
element. Increase the
attempt count to reflect the environment's legitimate access patterns. Test the adjusted
threshold with a controlled SSH retry sequence before deploying to all hosts.

## Rule level adjustment

Wazuh rule levels determine alert routing. Level 7 and below: logged to the indexer, no
notification. Level 8 and above: routed to the Graylog alert conditions. Level 12 and
above: fires the high-severity FIM alert condition immediately. Level 15: PagerDuty page.

A rule generating consistent noise that has been investigated and confirmed benign can be
lowered in level. Add an override to `/var/ossec/etc/rules/local_rules.xml`:

```xml
<!-- Lowered from 10 to 7: sshd informational reconnects on monitoring hosts -->
<!-- Reviewed: angua, 2026-03-15. Review date: 2026-09-15 -->
<rule id="5758" level="7" overwrite="yes">
  <if_sid>5756</if_sid>
  <description>SSH informational: level lowered per Angua review</description>
</rule>
```

Every level-down override requires a comment with the reason, reviewer, and a review date
no more than six months from the change. Cheery reviews expired comments during the
quarterly audit and either renews or removes them.

After modifying `local_rules.xml`, restart the manager to apply:

```
systemctl restart wazuh-manager
```

## Monthly review

At the start of each month, Cheery pulls the previous month's alert statistics from the
Wazuh dashboard and cross-references them with the DefectDojo findings queue.

Rules in the Wazuh top-10 list with zero corresponding findings in DefectDojo, and no
confirmed incidents in the incident register, are candidates for level reduction or
ignore-rule addition. A rule firing 800 times in a month with no security outcome is
generating noise.

Rules that appear in the DefectDojo queue and map to MITRE ATT&CK techniques visible in
current Zeek and Suricata detections are candidates for level increase. If a technique is
active in the environment, the corresponding Wazuh rule is likely to generate enough signal
to be noticed quickly.

Rules with zero matches over three consecutive months are checked for operational
correctness. Zero matches may mean the threat has not manifested; zero matches may also
mean the rule was broken by a configuration change. Test with a manual trigger: for FIM
rules, modify a monitored file on one host; for authentication rules, generate a deliberate
failed login sequence in a test account.

The monthly review produces a short entry in the `ansible-playbooks` repository under
`security/wazuh-review.md`: what changed, why, and what the previous month's alert volume
looked like. This record is useful context when an incident occurs, because it shows which
detection capability was in place and when.

## What does not get tuned down

Three custom rules are not candidates for level adjustment, suppression, or ignore-rule
additions:

Rule 100001: new `authorized_keys` file created in a user home directory. This rule exists
because the phishing incident that prompted the Wazuh deployment involved exactly this
event. A spike means multiple users are having keys added to their accounts. That is an
incident.

Rule 100002: log file deletion. Deleting log files is a standard technique for covering
activity after a compromise. High volume from this rule on a single host is an indicator,
not noise.

Rule 100003: `sudoers` file modification. Level 14, wakes Angua at 03:00 if necessary. If
it is firing frequently, the question is who is modifying sudoers and why.

If any of these three rules is generating unexpected volume, the volume is the
investigation.
Last updated: 29 May 2026
