# Ansible control node setup

Runbook for deploying the Ansible control node from which all configuration management is applied. Ansible is agentless: it connects to managed hosts over SSH and applies configuration in place. The control node is the only machine from which playbooks are run against production infrastructure. Running playbooks from developer laptops is not permitted; it bypasses the audit trail and risks applying untested changes.

## Control node specification

Ansible runs on a dedicated Hetzner CX22 instance (4 vCPU, 8GB RAM) at `ansible.golemtrust.am` on the Headscale private network. It has no public IP. All access is via Teleport. Playbooks are stored in a GitLab repository (`golemtrust/ansible-playbooks`), cloned to the control node and run from there.

## Installation

```
apt update && apt install -y ansible ansible-lint python3-pip git
pip3 install boto3 botocore passlib jmespath
```

Verify: `ansible --version`

Install community collections used in Golem Trust playbooks:

```
ansible-galaxy collection install \
  ansible.posix \
  community.general \
  community.crypto \
  devsec.hardening
```

The `devsec.hardening` collection provides the SSH and OS hardening roles that underpin the CIS benchmark playbooks.

## SSH authentication

The control node authenticates to managed hosts using a dedicated SSH key pair. Generate the key pair on the control node:

```
ssh-keygen -t ed25519 -C "ansible@golemtrust.am" -f /etc/ansible/ansible_ed25519 -N ""
```

The private key lives at `/etc/ansible/ansible_ed25519` with permissions `0600`, owned by the `ansible` service account. The public key is distributed to all managed hosts via the `common` role's `authorized_keys` task.

Store a copy of the private key in Vault at `kv/golemtrust/ansible-ssh-key` as a backup. If the control node is rebuilt, the same key pair can be restored so that all host `authorized_keys` entries remain valid.

## Inventory

The inventory is stored as a YAML file in the `ansible-playbooks` repository at `inventory/hosts.yml`:

```
all:
  children:
    infrastructure:
      hosts:
        gitlab.golemtrust.am:
        vault-01.golemtrust.am:
        vault-02.golemtrust.am:
        vault-03.golemtrust.am:
        harbor.golemtrust.am:
        ansible.golemtrust.am:
      vars:
        ansible_user: ansible
        ansible_ssh_private_key_file: /etc/ansible/ansible_ed25519
        ansible_python_interpreter: /usr/bin/python3

    kubernetes:
      hosts:
        k8s-01.golemtrust.am:
        k8s-02.golemtrust.am:
        k8s-03.golemtrust.am:
      vars:
        ansible_user: ansible
        ansible_ssh_private_key_file: /etc/ansible/ansible_ed25519
```

Group variables are stored in `inventory/group_vars/` and host-specific overrides in `inventory/host_vars/`. Sensitive variables (passwords, tokens) are encrypted with Ansible Vault before being committed to the repository.

## Ansible Vault for secrets

Ansible Vault encrypts sensitive variables so they can be committed to the git repository without exposing plaintext secrets.

Create an encrypted variables file:

```
ansible-vault create inventory/group_vars/all/vault.yml
```

Reference encrypted variables in playbooks normally. When running playbooks, provide the vault password:

```
ansible-playbook --vault-password-file /etc/ansible/vault-password site.yml
```

The vault password file is stored at `/etc/ansible/vault-password` on the control node with permissions `0400`, owned by `ansible`. The password itself is stored in Vault (the HashiCorp kind) at `kv/golemtrust/ansible-vault-password`.

## GitLab runner integration

Playbooks can also be triggered from GitLab CI pipelines, enabling automatic remediation when drift is detected. The GitLab runner on the control node connects back to GitLab and runs playbooks in response to pipeline triggers.

Register a GitLab runner on the control node tagged `ansible`:

```
gitlab-runner register \
  --url https://gitlab.golemtrust.am \
  --token <registration-token> \
  --executor shell \
  --description "ansible-control-node" \
  --tag-list ansible \
  --run-untagged false
```

The `shell` executor runs jobs directly on the control node, which is necessary for Ansible since it needs local access to the inventory and SSH keys. The runner is locked to the `golemtrust/ansible-playbooks` project only.

## ansible.cfg

Create `/etc/ansible/ansible.cfg` as the global configuration:

```
[defaults]
inventory = /opt/ansible/inventory/hosts.yml
remote_user = ansible
private_key_file = /etc/ansible/ansible_ed25519
host_key_checking = True
retry_files_enabled = False
stdout_callback = yaml
callbacks_enabled = timer, profile_tasks
log_path = /var/log/ansible/ansible.log

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
pipelining = True
```

`pipelining = True` reduces the number of SSH connections per task and significantly speeds up playbook runs against large inventories.

The Ansible log at `/var/log/ansible/ansible.log` is shipped to Graylog as the authoritative record of what was applied to which host and when. Otto Chriek considers this log part of the ISO 27001 audit trail.
Last updated: 20 March 2026
