# Vault Transit engine setup

When Lord Downey signed the contract, Ponder's first task was ensuring that the Assassins' Guild's data would be genuinely inaccessible to Golem Trust staff, not merely policy-inaccessible. The Vault Transit secrets engine provides the technical foundation: it performs cryptographic operations on behalf of callers, but the keys themselves never leave Vault, and the plaintext never reaches Golem Trust's storage layer. This runbook covers enabling the Transit engine, creating per-customer encryption keys, scoping policies, configuring AppRole authentication for client applications, and verifying encrypt/decrypt operations via the Vault API.

## Prerequisites

- Vault 1.15 or later, unsealed and initialised (see the Vault cluster runbook)
- A Vault token with `sys/mounts` write access for the initial engine mount
- The `vault` CLI installed on the operator workstation, with `VAULT_ADDR` and `VAULT_TOKEN` set
- Customer names confirmed: `assassins-guild`, `royal-bank`, `patricians-office`

## Enable the Transit secrets engine

The Transit engine is not enabled by default. Mount it at the standard path:

```
vault secrets enable -path=transit transit
```

Confirm the mount is present:

```
vault secrets list
```

The output should show `transit/` in the list. If the organisation later requires a second Transit mount (for example, a separate mount for internal Golem Trust keys), it can be mounted at a different path such as `transit-internal/`.

## Create customer encryption keys

Each customer receives a dedicated named key. The key type `aes256-gcm96` provides authenticated encryption with a 256-bit AES key and a 96-bit nonce, which is Vault's default and the correct choice for general-purpose data encryption.

```
vault write -f transit/keys/assassins-guild-contracts-confidential \
  type=aes256-gcm96

vault write -f transit/keys/royal-bank-records-confidential \
  type=aes256-gcm96

vault write -f transit/keys/patricians-office-documents-confidential \
  type=aes256-gcm96
```

The naming convention is `{customer}-{data-type}-{classification}`. Keys must never be created with `exportable=true` or `allow_plaintext_backup=true` unless specifically approved by Ponder and documented in the change log.

Verify the key was created and inspect its metadata:

```
vault read transit/keys/assassins-guild-contracts-confidential
```

Note the `min_decryption_version` and `latest_version` fields. Both should be `1` immediately after creation.

## Configure key policies

Each customer's application may only use its own key. Three policy files are required, one per customer. The Assassins' Guild policy is shown here; the others follow the same pattern with the appropriate key name substituted.

Create `policy-assassins-guild.hcl`:

```
# Allow encryption with the Assassins' Guild key only
path "transit/encrypt/assassins-guild-*" {
  capabilities = ["update"]
}

# Allow decryption with the Assassins' Guild key only
path "transit/decrypt/assassins-guild-*" {
  capabilities = ["update"]
}

# Allow rewrap (re-encryption under a new key version)
path "transit/rewrap/assassins-guild-*" {
  capabilities = ["update"]
}

# Allow reading key metadata (not the key material itself)
path "transit/keys/assassins-guild-*" {
  capabilities = ["read"]
}
```

Apply the policy:

```
vault policy write assassins-guild-transit policy-assassins-guild.hcl
vault policy write royal-bank-transit policy-royal-bank.hcl
vault policy write patricians-office-transit policy-patricians-office.hcl
```

Vault operators hold the `transit-admin` policy, which allows key creation and rotation management, but that policy deliberately omits `encrypt` and `decrypt` capabilities. This separation of duties ensures that Ponder's team can manage the engine without being able to read customer data.

## Configure AppRole authentication

AppRole authentication allows customer applications to obtain a Vault token without requiring a human operator. Each customer application receives its own AppRole, bound to its corresponding Transit policy.

Enable AppRole if not already enabled:

```
vault auth enable approle
```

Create roles for each customer:

```
vault write auth/approle/role/assassins-guild-app \
  token_policies="assassins-guild-transit" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=0 \
  secret_id_num_uses=0

vault write auth/approle/role/royal-bank-app \
  token_policies="royal-bank-transit" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=0 \
  secret_id_num_uses=0

vault write auth/approle/role/patricians-office-app \
  token_policies="patricians-office-transit" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=0 \
  secret_id_num_uses=0
```

Retrieve the Role ID and generate a Secret ID for the Assassins' Guild application. The Role ID is not secret; the Secret ID is, and must be stored in Vaultwarden for delivery to the Guild's integration team:

```
vault read auth/approle/role/assassins-guild-app/role-id
vault write -f auth/approle/role/assassins-guild-app/secret-id
```

## Test encrypt and decrypt via the Vault API

These tests should be performed in the staging environment before production deployment. The plaintext must be base64-encoded before passing it to the API.

Encode a test value:

```
echo -n "contract-12345-target-details" | base64
```

Call the encrypt endpoint, substituting the base64 output:

```
vault write transit/encrypt/assassins-guild-contracts-confidential \
  plaintext="Y29udHJhY3QtMTIzNDUtdGFyZ2V0LWRldGFpbHM=" \
  context="$(echo -n 'contract-12345' | base64)"
```

Vault returns a `ciphertext` value in the format `vault:v1:...`. The `v1` component indicates the key version used. Store this ciphertext; it is what Golem Trust's storage API will hold.

Decrypt to verify the round-trip:

```
vault write transit/decrypt/assassins-guild-contracts-confidential \
  ciphertext="vault:v1:<ciphertext-from-above>" \
  context="$(echo -n 'contract-12345' | base64)"
```

The returned `plaintext` field is base64-encoded. Decode it to confirm it matches the original value:

```
echo "Y29udHJhY3QtMTIzNDUtdGFyZ2V0LWRldGFpbHM=" | base64 -d
```

If the decrypt operation returns a `400` error citing context mismatch, the encryption context supplied at decrypt time does not match the one used at encryption time. This is expected and correct behaviour: it means the ciphertext cannot be decrypted with a different context, which is precisely the cross-contamination protection the key hierarchy is designed to provide.

## Key versioning and minimum decryption version

After key rotation (see the key rotation runbook), old ciphertext will reference earlier key versions. The `min_decryption_version` parameter controls how far back Vault will allow decryption, providing a mechanism to retire compromised key versions.

To inspect current versioning state:

```
vault read transit/keys/assassins-guild-contracts-confidential
```

To advance the minimum decryption version after confirming all data has been rewrapped to the latest version:

```
vault write transit/keys/assassins-guild-contracts-confidential/config \
  min_decryption_version=2
```

Setting this value prevents decryption of any ciphertext encrypted under version 1. Perform this step only after running the rewrap procedure documented in the key rotation runbook and confirming no version-1 ciphertext remains in the database. Cheery maintains the sign-off record in the change management system.
Last updated: 20 March 2026
