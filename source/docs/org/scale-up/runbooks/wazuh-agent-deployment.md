# Agent deployment at scale

Runbook for deploying Wazuh agents to all managed hosts and developer workstations. The agent is a lightweight daemon that sends security events to the Wazuh manager. It runs FIM, vulnerability detection, security configuration assessment, and log collection on each host. Deployment is managed via Ansible for servers; developer workstations use a distribution package.

## Agent registration overview

Agents register with the manager using a pre-shared secret or via the manager's authd daemon. Golem Trust uses authd with a registration password so that agents self-register when deployed, without requiring manual approval for each host.

The authd daemon listens on port 1515 on the manager. The agent connects, presents the registration password, and receives a unique agent ID and encryption key. Subsequent communication uses port 1514 with the per-agent key.

## Ansible role for server deployment

The `wazuh-agent` Ansible role handles installation and registration on all servers. The role is in the `golemtrust/ansible-playbooks` repository.

Key tasks in `roles/wazuh-agent/tasks/main.yml`:

Add the Wazuh repository:

```
- name: Add Wazuh repository key
  ansible.builtin.apt_key:
    url: https://packages.wazuh.com/key/GPG-KEY-WAZUH
    state: present

- name: Add Wazuh repository
  ansible.builtin.apt_repository:
    repo: "deb https://packages.wazuh.com/4.x/apt/ stable main"
    state: present
    filename: wazuh
```

Install the agent:

```
- name: Install Wazuh agent
  ansible.builtin.apt:
    name: wazuh-agent
    state: present
    update_cache: yes
```

Configure the agent to point to the manager:

```
- name: Configure Wazuh agent
  ansible.builtin.template:
    src: ossec.conf.j2
    dest: /var/ossec/etc/ossec.conf
    owner: root
    group: wazuh
    mode: '0640'
  notify: restart wazuh-agent
```

The `ossec.conf.j2` template sets the manager address from a group variable:

```
<ossec_config>
  <client>
    <server>
      <address>{{ wazuh_manager_ip }}</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
    <config-profile>{{ ansible_os_family | lower }}, {{ ansible_distribution | lower }}, {{ ansible_distribution | lower }}{{ ansible_distribution_major_version }}</config-profile>
    <notify_time>10</notify_time>
    <time-reconnect>60</time-reconnect>
    <auto_restart>yes</auto_restart>
    <crypto_method>aes</crypto_method>
  </client>
```

Register the agent with the manager:

```
- name: Register agent with Wazuh manager
  ansible.builtin.shell: |
    /var/ossec/bin/agent-auth \
      -m {{ wazuh_manager_ip }} \
      -p 1515 \
      -P "{{ wazuh_registration_password }}" \
      -A "{{ inventory_hostname }}"
  args:
    creates: /var/ossec/etc/client.keys
  notify: restart wazuh-agent
```

The `creates: /var/ossec/etc/client.keys` makes this task idempotent: if the agent is already registered (keys file exists), the registration step is skipped.

The `wazuh_registration_password` variable is stored in the Ansible Vault encrypted variables file and retrieved from HashiCorp Vault at `kv/golemtrust/wazuh-registration-password`.

Enable and start the agent:

```
- name: Enable and start Wazuh agent
  ansible.builtin.systemd:
    name: wazuh-agent
    enabled: yes
    state: started
```

Apply the role to all hosts:

```
ansible-playbook site.yml --tags wazuh-agent
```

## Developer workstation deployment

Developer workstations are not managed by Ansible. Distribute the agent as a Debian package via an internal package repository, or provide a simple installation script.

Installation script for developer workstations (`install-wazuh-agent.sh`):

```
#!/bin/bash
set -euo pipefail

MANAGER="100.64.0.30"
REG_PASSWORD="$(vault kv get -field=password kv/golemtrust/wazuh-registration-password)"

curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add -
echo "deb https://packages.wazuh.com/4.x/apt/ stable main" > /etc/apt/sources.list.d/wazuh.list
apt update && apt install -y wazuh-agent

/var/ossec/bin/agent-auth -m "$MANAGER" -p 1515 -P "$REG_PASSWORD" -A "$(hostname)"
systemctl enable --now wazuh-agent
echo "Wazuh agent installed and registered."
```

New developers run this script during workstation setup. The script requires the developer to have Vault access (they must be logged in via `vault login`).

## Verifying agent registration

From the Wazuh manager, list connected agents:

```
/var/ossec/bin/agent_control -l
```

Or via the Wazuh API:

```
curl -s -k -X GET "https://wazuh.golemtrust.am:55000/agents?status=active" \
  -H "Authorization: Bearer $WAZUH_API_TOKEN" \
  | jq '.data.affected_items[] | {id, name, status, lastKeepAlive}'
```

In the dashboard, navigate to Agents to see all registered agents, their status, and last check-in time. Agents that have not checked in within 10 minutes are shown as disconnected.

## Agent groups

Assign agents to groups to apply different configuration profiles. Navigate to Management, then Groups in the Wazuh dashboard, and create:

- `servers`: all production and infrastructure servers
- `kubernetes-nodes`: Kubernetes nodes (additional container FIM rules)
- `developer-workstations`: developer machines (less aggressive FIM, additional process monitoring)
- `vault-nodes`: Vault servers (strict FIM on `/opt/vault/`, `/etc/vault.d/`)

Assign agents to groups:

```
/var/ossec/bin/agent_groups -a -i <agent-id> -g servers
```

Group-specific configuration files are stored on the manager at `/var/ossec/etc/shared/<group-name>/`. When an agent checks in, it downloads the configuration for its assigned group.
