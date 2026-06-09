# CIS hardening procedures

Runbook for applying Centre for Internet Security (CIS) Debian Linux benchmark hardening to Golem Trust servers. The CIS benchmarks are a widely adopted set of security configuration recommendations. Compliance with CIS Level 1 is a baseline requirement for ISO 27001 certification; Level 2 controls are applied where they do not conflict with operational requirements.

## Hardening role

The `cis-debian` role applies CIS benchmark controls via Ansible. It uses the `devsec.hardening` collection as a foundation and adds Golem Trust-specific configuration on top.

Install the collection on the control node if not already present:

```
ansible-galaxy collection install devsec.hardening
```

The role is applied via the `hardening.yml` playbook:

```
ansible-playbook hardening.yml
```

This playbook targets all hosts in the `infrastructure` and `kubernetes` inventory groups.

## SSH hardening

The SSH hardening role configures `sshd_config` to CIS Level 1 standards. Key settings applied:

```
Protocol 2
PermitRootLogin no
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 0
MaxAuthTries 3
MaxSessions 4
AllowGroups ssh-users ansible
PermitEmptyPasswords no
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com,aes256-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
```

`PasswordAuthentication no` means all SSH access requires a key. This is the single most impactful change from default Debian configuration and the primary control that was missing from server 2 during Cheery's audit.

`AllowGroups ssh-users ansible` restricts SSH access to members of those two Unix groups. The `ssh-users` group is populated by the `common` role based on the user list in `group_vars`. Service accounts that do not need SSH access are not members of this group.

`ClientAliveInterval 300` and `ClientAliveCountMax 0` disconnect idle sessions after five minutes. This reduces the window for an unattended terminal to be misused.

## Firewall hardening

The `firewall` role configures `nftables` with a default-deny policy. Rules are defined per host group in `group_vars/`:

```
nftables_input_rules:
  - comment: "Allow established connections"
    state: [established, related]
    action: accept
  - comment: "Allow loopback"
    iif: lo
    action: accept
  - comment: "Allow SSH from Headscale network"
    protocol: tcp
    dport: 22
    saddr: 100.64.0.0/10
    action: accept
  - comment: "Allow Teleport node port from Headscale"
    protocol: tcp
    dport: 3022
    saddr: 100.64.0.0/10
    action: accept
```

Service-specific rules are added to host group variables. For example, the `gitlab` host group includes an additional rule allowing HTTPS from any source:

```
nftables_input_rules_extra:
  - comment: "Allow HTTPS"
    protocol: tcp
    dport: 443
    action: accept
```

The default output policy is `accept`. Outbound traffic is not restricted at the firewall level; network-level restrictions are handled by Headscale ACLs.

## Kernel hardening

The `cis-debian` role applies `sysctl` parameters from the CIS benchmark:

```
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv6.conf.all.disable_ipv6 = 1
kernel.randomize_va_space = 2
fs.suid_dumpable = 0
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
```

IPv6 is disabled (`net.ipv6.conf.all.disable_ipv6 = 1`) on all hosts except those with a specific operational need for it. Golem Trust's current infrastructure uses IPv4 internally; IPv6 exposure increases the attack surface without benefit.

## Automatic security updates

The `unattended-upgrades` role configures Debian's unattended-upgrades daemon to apply security updates automatically:

```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
```

`Automatic-Reboot "false"` means kernel updates are applied but the reboot is not triggered automatically. Reboots are scheduled during the maintenance window (Sundays 02:00) via a separate cron job that checks whether a reboot is pending:

```
0 2 * * 0 test -f /var/run/reboot-required && reboot
```

This balances security (kernel patches applied promptly) against availability (reboots are planned, not spontaneous).

## CIS controls not applied

Some CIS Level 2 controls are not applied because they conflict with operational requirements. These exceptions are documented and reviewed as part of ISO 27001 risk acceptance:

`fs.protected_hardlinks` and `fs.protected_symlinks`: enabled (Level 1, applied).

`aide` (filesystem integrity monitoring): not deployed. Wazuh FIM (File Integrity Monitoring) is used instead, which provides equivalent functionality with Graylog integration. Duplicate tooling is avoided.

`auditd`: the Wazuh agent handles audit log collection. The `auditd` daemon's raw log files are redundant and are not configured separately.

Ludmilla reviews the exceptions list quarterly and confirms the compensating controls remain in place.

## The defender's view

Hardening narrows the attack surface; it does not tell you when someone tests what remains. The cloud recon, initial-access, and misconfiguration-abuse patterns this baseline is meant to deny are catalogued from the hunting side in [cloud attack detection](../../../counter/cloud/detection.md).
