# Vault SSH secrets engine configuration

Runbook for configuring Vault's SSH secrets engine to issue short-lived SSH certificates. Teleport handles most infrastructure access, but some automated processes (deployment scripts, cron jobs, application-to-application connections) need SSH credentials without a human in the loop. Vault's SSH secrets engine issues certificates valid for one hour. After that, they are gone. `MaintenancePass123` is not mentioned here because it does not exist anymore.

## Overview

The Vault SSH secrets engine operates as a certificate authority. It holds a signing key and issues signed SSH certificates to callers that present valid Vault credentials. The signed certificate grants SSH access to servers that trust the CA. No password is involved at any step.

Two modes are available: signed certificates (used here) and one-time passwords (not used; certificates are cleaner). Signed certificates work with standard OpenSSH; no special client is required beyond presenting the certificate alongside the corresponding private key.

## Enabling the secrets engine

On the Vault cluster, authenticate as an admin and enable the engine:

```
export VAULT_ADDR="https://vault.golemtrust.am:8200"
vault login -method=userpass username=carrot.ironfoundersson
vault secrets enable -path=ssh ssh
```

## Configuring the CA

Generate the CA signing key. Vault stores the private key internally; only the public key is exported:

```
vault write ssh/config/ca generate_signing_key=true
```

Export the public key for distribution to servers:

```
vault read -field=public_key ssh/config/ca > /tmp/vault-ssh-ca.pub
```

## Distributing the CA public key

Every server that should accept Vault-signed certificates must trust the CA. Copy the public key to each server and configure OpenSSH to trust it:

```
cp /tmp/vault-ssh-ca.pub /etc/ssh/vault-ssh-ca.pub
chmod 644 /etc/ssh/vault-ssh-ca.pub
```

Add to `/etc/ssh/sshd_config`:

```
TrustedUserCAKeys /etc/ssh/vault-ssh-ca.pub
```

Reload SSH:

```
systemctl reload sshd
```

Repeat on every server that should accept Vault-issued certificates.

## Creating roles

Define roles for each use case. A role specifies which Linux users the certificate may be used to log in as, the certificate TTL, and any key type requirements.

Role for deployment scripts (restricted to the `deploy` Linux user, short TTL):

```
vault write ssh/roles/deploy \
  key_type=ca \
  allowed_users=deploy \
  default_user=deploy \
  ttl=1h \
  max_ttl=4h \
  allow_user_certificates=true
```

Role for golem operators (Mr. Pump and his team; restricted to the `golem-operator` Linux user):

```
vault write ssh/roles/golem-operator \
  key_type=ca \
  allowed_users=golem-operator \
  default_user=golem-operator \
  ttl=1h \
  max_ttl=1h \
  allow_user_certificates=true
```

Role for emergency admin access (restricted to `root`, MFA required at the Vault level via an MFA method bound to this role, TTL 1 hour, not renewable):

```
vault write ssh/roles/emergency-admin \
  key_type=ca \
  allowed_users=root \
  default_user=root \
  ttl=1h \
  max_ttl=1h \
  allow_user_certificates=true
```

## Vault policies for certificate issuance

Create policies that permit callers to sign certificates using specific roles:

```
vault policy write ssh-deploy - << 'EOF'
path "ssh/sign/deploy" {
  capabilities = ["create", "update"]
}
EOF

vault policy write ssh-golem-operator - << 'EOF'
path "ssh/sign/golem-operator" {
  capabilities = ["create", "update"]
}
EOF
```

Assign the `ssh-deploy` policy to the `deploy-agent` AppRole. Assign `ssh-golem-operator` to the golem authentication token (see the golem authentication runbook for how golem identities are managed in Keycloak; Vault authentication for golems uses a separate AppRole).

## Requesting a certificate

A script or application requests a certificate by generating an SSH key pair locally, submitting the public key to Vault, and receiving a signed certificate back:

```
ssh-keygen -t ed25519 -f /tmp/deploy-key -N ""

vault write ssh/sign/deploy \
  public_key=@/tmp/deploy-key.pub \
  valid_principals=deploy
```

The response contains a `signed_key` field. Write it to a file:

```
vault write -field=signed_key ssh/sign/deploy \
  public_key=@/tmp/deploy-key.pub \
  valid_principals=deploy > /tmp/deploy-key-cert.pub
```

Connect using the key and certificate:

```
ssh -i /tmp/deploy-key -i /tmp/deploy-key-cert.pub deploy@auth.golemtrust.am
```

The private key and certificate are temporary; delete them after use:

```
rm /tmp/deploy-key /tmp/deploy-key.pub /tmp/deploy-key-cert.pub
```

Automated scripts should generate a fresh key pair on each invocation, request a certificate, connect, complete their work, and clean up. The one-hour TTL is the outer bound; a well-written script holds the certificate for seconds, not minutes.

## Verification

Generate a test certificate using the `deploy` role and attempt to connect to a server:

```
ssh-keygen -t ed25519 -f /tmp/test-key -N "" -q
vault write -field=signed_key ssh/sign/deploy \
  public_key=@/tmp/test-key.pub > /tmp/test-key-cert.pub
ssh-keygen -L -f /tmp/test-key-cert.pub
```

The `ssh-keygen -L` output shows the certificate's principals, valid-after, valid-before, and CA fingerprint. Confirm that the principals match the role's `allowed_users` and that the validity window is correct.

Attempt an SSH connection. It should succeed without a password prompt and be rejected after the certificate expires.

## Audit

Every certificate issuance is recorded in the Vault audit log. To see recent SSH certificate requests:

```
grep "ssh/sign" /opt/vault/logs/audit.log | tail -20
```

Each entry includes the Vault token that made the request, the role used, and the timestamp. This provides a complete record of who requested which certificate and when, even if the certificate itself has long since expired.
