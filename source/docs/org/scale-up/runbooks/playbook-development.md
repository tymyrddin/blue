# Playbook development

Runbook for writing, testing, and deploying Ansible playbooks. Playbooks define the desired state of Golem Trust infrastructure. Every change to server configuration must be expressed as a playbook change and merged through the standard review process. Ad-hoc Ansible commands against production hosts are not permitted except during active incident response, and must be documented in the incident record.

## Repository structure

The `golemtrust/ansible-playbooks` repository is structured as follows:

```
ansible-playbooks/
  inventory/
    hosts.yml
    group_vars/
      all/
        common.yml
        vault.yml          (Ansible Vault encrypted)
      infrastructure/
        hardening.yml
    host_vars/
  roles/
    common/                (applied to all hosts)
    ssh-hardening/
    firewall/
    unattended-upgrades/
    log-shipping/
    monitoring-agent/
    cis-debian/
  site.yml                 (applies all roles to all hosts)
  hardening.yml            (applies hardening roles only)
  patch.yml                (applies security updates)
  drift-check.yml          (check mode run; no changes applied)
```

The `site.yml` playbook applies every role to every host in the inventory. It is the authoritative declaration of what all Golem Trust servers should look like.

## Role structure

Each role follows the standard Ansible role layout:

```
roles/common/
  tasks/
    main.yml
  handlers/
    main.yml
  templates/
    motd.j2
    sshd_config.j2
  files/
  vars/
    main.yml
  defaults/
    main.yml
  meta/
    main.yml
```

Roles are self-contained. The `common` role installs baseline packages, sets the MOTD, configures NTP, and ensures the `ansible` service account is present with the correct SSH key. Every host receives the `common` role.

## Writing tasks

Tasks should be idempotent: running a task twice must produce the same result as running it once. Use Ansible modules rather than shell commands wherever possible. Modules handle idempotency; shell commands usually do not.

Preferred:

```
- name: Ensure chrony is installed
  ansible.builtin.package:
    name: chrony
    state: present
```

Avoid:

```
- name: Install chrony
  ansible.builtin.shell: apt-get install -y chrony
```

When a shell command is unavoidable, use `creates` or `changed_when` to make the task idempotent:

```
- name: Initialise Vault
  ansible.builtin.shell: vault operator init -key-shares=5 -key-threshold=3
  args:
    creates: /etc/vault.d/.initialised
  register: vault_init
  changed_when: vault_init.rc == 0
```

## Testing playbooks

Test all playbook changes in the staging environment before applying to production. The staging inventory mirrors the production host list but points to staging instances.

Run a syntax check first:

```
ansible-playbook --syntax-check site.yml
```

Run `ansible-lint` to catch common mistakes:

```
ansible-lint site.yml
```

Run in check mode against staging (reports what would change, applies nothing):

```
ansible-playbook --check --diff -i inventory/staging/hosts.yml site.yml
```

Apply to staging:

```
ansible-playbook -i inventory/staging/hosts.yml site.yml
```

Review the output. Any task reporting `changed` should be examined. Tasks that are expected to be idempotent (already applied in a previous run) should report `ok`, not `changed`. Repeated `changed` results on re-runs indicate a non-idempotent task that should be fixed before applying to production.

## Merge request requirements

Playbook changes follow the same merge request process as application code. The `ansible-playbooks` repository is configured with:

- Two approvals required for merges to `main`
- A CI pipeline that runs `ansible-lint` and `ansible-playbook --syntax-check` on every merge request
- Ludmilla as a required code owner for changes to `roles/cis-debian/` and `roles/ssh-hardening/`

The CI pipeline uses the `ansible` tagged runner on the control node. It runs check mode against the staging inventory to confirm the playbook applies cleanly.

## Applying changes to production

After a change merges to `main` on the `ansible-playbooks` repository, apply it to production manually from the control node. Automatic production deploys are not configured; a human must initiate each production run and verify the output.

Pull the latest changes on the control node:

```
cd /opt/ansible && git pull
```

Run check mode against production first to preview what will change:

```
ansible-playbook --check --diff site.yml
```

Review the diff carefully. If the output is as expected, apply:

```
ansible-playbook site.yml
```

For changes that affect a single role, limit the run to that role:

```
ansible-playbook site.yml --tags firewall
```

For changes that affect a single host:

```
ansible-playbook site.yml --limit gitlab.golemtrust.am
```

## Variables and secrets

Non-sensitive variables go in `group_vars/` or `host_vars/` as plaintext YAML. Sensitive variables (passwords, API tokens, private keys) go in encrypted files managed with Ansible Vault.

Retrieve the vault password from HashiCorp Vault before running playbooks that include encrypted variables:

```
export ANSIBLE_VAULT_PASSWORD=$(vault kv get -field=password kv/golemtrust/ansible-vault-password)
echo "$ANSIBLE_VAULT_PASSWORD" > /tmp/vault-pass
ansible-playbook --vault-password-file /tmp/vault-pass site.yml
rm /tmp/vault-pass
```

Never leave the vault password on disk after a playbook run.
