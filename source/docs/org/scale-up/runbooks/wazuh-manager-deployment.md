# Wazuh manager deployment

Runbook for deploying the Wazuh security platform. Wazuh provides file integrity monitoring, security configuration assessment, vulnerability detection, active response, and SIEM capabilities. The manager receives events from agents on every managed host. The indexer stores and indexes events. The dashboard provides the analyst interface. All three components run on a dedicated Hetzner instance.

## Instance specification

Wazuh's indexer component is memory-intensive. Run all three components on a Hetzner CX52 instance (16 vCPU, 32GB RAM, 360GB SSD) at `wazuh.golemtrust.am` (Headscale private network, no public IP). Attach a 1TB Hetzner volume at `/var/ossec/logs` for event storage.

The Wazuh indexer is an OpenSearch fork maintained by the Wazuh project. It is separate from the OpenSearch cluster used by Graylog; both coexist on the same private network but are independent.

## Installation

Wazuh provides a guided installation script that deploys all components:

```
curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh
curl -sO https://packages.wazuh.com/4.x/config.yml
```

Edit `config.yml` before running the installer:

```
nodes:
  indexer:
    - name: wazuh-indexer
      ip: "100.64.0.30"
  server:
    - name: wazuh-manager
      ip: "100.64.0.30"
  dashboard:
    - name: wazuh-dashboard
      ip: "100.64.0.30"
```

Replace `100.64.0.30` with the Headscale IP of the Wazuh instance.

Run the installer:

```
bash wazuh-install.sh -a
```

The `-a` flag installs all components. The installer generates passwords for the indexer, manager API, and dashboard. Save these immediately; they are displayed only once. Store them in Vaultwarden (collection: Infrastructure, item: Wazuh).

After installation, the dashboard is available at `https://wazuh.golemtrust.am`. Log in with the `admin` credentials generated during installation.

## TLS configuration

The installer generates self-signed certificates. Replace them with proper certificates from the Golem Trust internal CA (managed via the Vault PKI secrets engine):

```
vault write pki/issue/internal-servers \
  common_name="wazuh.golemtrust.am" \
  alt_names="wazuh.golemtrust.am" \
  ttl="8760h" \
  > /tmp/wazuh-cert.json

cat /tmp/wazuh-cert.json | jq -r '.data.certificate' > /etc/wazuh-indexer/certs/wazuh.golemtrust.am.pem
cat /tmp/wazuh-cert.json | jq -r '.data.private_key' > /etc/wazuh-indexer/certs/wazuh.golemtrust.am-key.pem
cat /tmp/wazuh-cert.json | jq -r '.data.issuing_ca' > /etc/wazuh-indexer/certs/root-ca.pem
```

Apply equivalent certificates to the manager and dashboard. Restart all services after replacing certificates:

```
systemctl restart wazuh-indexer wazuh-manager wazuh-dashboard
```

## Keycloak SSO integration

Connect the Wazuh dashboard to Keycloak so Angua and other security team members use their existing Golem Trust identity.

In Keycloak, create a `wazuh` client in the `golemtrust-internal` realm with:
- Client protocol: SAML
- Valid redirect URIs: `https://wazuh.golemtrust.am/*`
- Attribute mapper: map the `groups` claim to `Roles`

In the Wazuh dashboard, navigate to Security, then Authentication Backends, then SAML. Configure with the Keycloak SAML metadata URL:

```
https://auth.golemtrust.am/realms/golemtrust-internal/protocol/saml/descriptor
```

Map Keycloak groups to Wazuh roles:

- `security` group: `all_access` Wazuh role
- `sysadmin` group: `readall` Wazuh role

## Manager configuration

The main Wazuh manager configuration is at `/var/ossec/etc/ossec.conf`. Key global settings:

```
<ossec_config>
  <global>
    <email_notification>no</email_notification>
    <alerts_log>yes</alerts_log>
    <jsonout_output>yes</jsonout_output>
    <logall>no</logall>
    <logall_json>no</logall_json>
    <memory_size>1024</memory_size>
  </global>

  <remote>
    <connection>secure</connection>
    <port>1514</port>
    <protocol>tcp</protocol>
    <queue_size>131072</queue_size>
  </remote>
```

`logall` and `logall_json` are disabled to avoid filling the indexer with low-value events. Only alerts (rule matches) are indexed. Raw logs are forwarded to Graylog instead (see the Graylog integration runbook).

## Event retention

Configure the indexer retention policy. Navigate to the Wazuh dashboard, then Index Management, then Policies. Create a policy that:

- Moves indices older than 30 days to cold storage (no replicas, read-only)
- Deletes indices older than 365 days

For ISO 27001 compliance, security events must be retained for 12 months. The 365-day deletion policy satisfies this while preventing unbounded disk growth. Otto Chriek confirmed this retention period is sufficient for audit purposes.

## Verification

Confirm all services are running:

```
systemctl status wazuh-manager wazuh-indexer wazuh-dashboard
```

Check the manager log for errors:

```
tail -100 /var/ossec/logs/ossec.log
```

Log into the dashboard and confirm the Overview page loads without errors. The agent count will be zero until agents are deployed.
Last updated: 20 March 2026
