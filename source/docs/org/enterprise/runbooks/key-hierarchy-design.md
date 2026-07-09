# Key hierarchy design

Ponder spent considerable time explaining this to Cheery, who had initially suggested that one key shared between all customers would be simpler. It would be simpler, he agreed, in the same way that using a single lock for every door in Ankh-Morpork would be simpler. The three-tier key hierarchy at Golem Trust exists because simplicity and security frequently disagree with each other. This runbook describes the hierarchy, the naming conventions, the separation of duties it enforces, and how encryption contexts prevent one customer's ciphertext from being decrypted in another customer's context.

## Overview of the three-tier hierarchy

The hierarchy has three levels, each serving a distinct purpose:

Tier 1, Vault master keys: These are the Shamir secret shares used to unseal Vault when it starts. They are not used for data encryption. They exist solely to protect Vault's own internal key material. The Vault seal configuration (auto-unseal via Hetzner KMS, or manual Shamir shares held by five designated keyholders) determines how Vault itself is protected. The key material at this tier never touches application data.

Tier 2, customer data keys: These are the named Transit keys, one per customer per data classification, stored inside Vault. They never leave Vault under any circumstances. Vault uses them internally to perform encryption and decryption on behalf of authorised callers. The application never receives the raw key bytes.

Tier 3, encryption context keys: These are not keys in the cryptographic sense, but context strings derived per data record (for example, a contract ID or a customer record UUID). When passed as the `context` parameter to a Transit encrypt or decrypt call, Vault uses HKDF to derive a per-record subkey from the Tier 2 key. The result is that ciphertext produced for `contract-12345` cannot be decrypted with the context `contract-99999`, even if the caller holds valid Vault credentials.

```
Tier 1: Vault master keys (Shamir shares, held by keyholders)
         |
         v
Tier 2: Customer data keys (Transit named keys, inside Vault)
         |  assassins-guild-contracts-confidential
         |  assassins-guild-targets-restricted
         |  royal-bank-records-confidential
         |  patricians-office-documents-confidential
         |
         v
Tier 3: Encryption context (per-record derivation)
         |  context = base64(contract-12345)
         |  context = base64(record-uuid-abc)
         |  context = base64(document-ref-xyz)
```

## Key naming convention

All Transit key names follow the pattern:

```
{customer}-{data-type}-{classification}
```

Examples:

```
assassins-guild-contracts-confidential
assassins-guild-targets-restricted
royal-bank-records-confidential
royal-bank-transactions-confidential
patricians-office-documents-confidential
patricians-office-edicts-restricted
```

The `{classification}` component aligns with Golem Trust's data classification scheme: `public`, `internal`, `confidential`, and `restricted`. No key may be created with a classification higher than `restricted` without a written authorisation from Adora Belle and a corresponding entry in the Vault audit log.

## Separation of duties

The policy structure enforces separation between those who manage the engine and those who use it.

The `transit-admin` policy, held by Vault operators, permits key creation, rotation scheduling, and metadata inspection. It does not include `encrypt` or `decrypt` capabilities on any key path.

Customer-specific policies, held only by the relevant AppRole, permit `encrypt`, `decrypt`, and `rewrap` on that customer's own keys and no others.

This means:

- A Golem Trust Vault operator cannot decrypt Assassins' Guild data
- The Assassins' Guild AppRole cannot touch Royal Bank key paths
- No single person or role can both manage keys and decrypt data

Ponder holds emergency break-glass credentials for Vault administration, which are sealed in a physical envelope in the Golem Trust strongroom and may only be opened with authorisation from two directors. Otto Chriek's quarterly audit includes verification that the break-glass envelope seal is intact.

## How encryption contexts prevent cross-contamination

Consider two contracts stored by the Assassins' Guild: `contract-00001` (sensitive) and `contract-00002` (routine). Both are encrypted with the same Tier 2 key, but with different contexts.

Encrypting contract 00001:

```
vault write transit/encrypt/assassins-guild-contracts-confidential \
  plaintext="<base64-of-plaintext>" \
  context="$(echo -n 'contract-00001' | base64)"
```

Attempting to decrypt contract 00001's ciphertext with contract 00002's context:

```
vault write transit/decrypt/assassins-guild-contracts-confidential \
  ciphertext="vault:v1:<ciphertext-of-contract-00001>" \
  context="$(echo -n 'contract-00002' | base64)"
```

Vault returns an error. The decryption fails. This is correct behaviour. An attacker who obtains one contract's ciphertext and a valid Vault token cannot use a different contract's context to decrypt it. The context string must match exactly, and the context is derived from the record's own identifier, which is only known to the application that created it.

The application is responsible for persisting the context string alongside the ciphertext. Golem Trust's storage API stores both fields. Loss of the context string means the ciphertext cannot be decrypted; this is treated with the same severity as loss of a key.

## Deriving context strings

Context strings must be stable across the lifetime of a record. They should be derived from an immutable identifier: a UUID assigned at record creation, or an external reference such as a contract number assigned by the customer's own system. They must not be derived from mutable fields such as status, owner, or date.

Example context derivation in Python:

```
import base64

def make_context(record_id: str) -> str:
    """Return a base64-encoded context string for use with Vault Transit."""
    return base64.b64encode(record_id.encode("utf-8")).decode("utf-8")
```

Context strings are stored in the `encryption_context` column of the relevant database table. They are not secret; their value is that they bind the ciphertext to a specific record identity, not that they are hidden.

## Audit and review

Otto Chriek's quarterly key inventory check verifies:

- The number of named keys matches the register of active customer integrations
- No key has `exportable=true` or `allow_plaintext_backup=true`
- `min_decryption_version` is at most one version behind `latest_version` (meaning no accumulation of old, unretired key versions)
- The Transit admin policy has not been modified to include decrypt capabilities

The key inventory is pulled via:

```
vault list transit/keys
```

Each key's configuration is then inspected individually to verify the above constraints. The results are recorded in the quarterly compliance report that Otto prepares for Mr. Bent.

## The defender's view

A key hierarchy is a wager about what an attacker gets when they reach a host. The credential-dumping techniques it is meant to contain, from LSASS and the SAM to NTDS extraction, are set out in [credential dumping](../../../counter/creds/dumping.md).
Last updated: 09 June 2026
