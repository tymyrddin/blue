# Key rotation procedures

Key rotation is the cryptographic equivalent of changing the locks. You do it regularly on schedule, and immediately if you have any reason to suspect the current key has been seen by someone who should not have seen it. Vault's Transit engine makes rotation straightforward: rotating a key creates a new version while retaining all older versions for decryption of existing data. The hard part is not the rotation itself but the rewrap phase, where existing ciphertext is re-encrypted under the new key version so that old versions can eventually be retired. This runbook covers scheduled rotation, immediate rotation on suspicion of compromise, the rewrap procedure, coordinating with the Assassins' Guild, and testing rotation in staging.

## How Vault Transit key versioning works

When you rotate a Transit key, Vault creates a new key version. The `latest_version` counter increments. All new encryption operations use the latest version. Existing ciphertext that was encrypted under earlier versions can still be decrypted, subject to the `min_decryption_version` setting.

The ciphertext token encodes the key version: `vault:v1:...` uses version 1, `vault:v2:...` uses version 2, and so on. This allows Vault to select the correct key version at decrypt time without requiring the caller to specify it.

Key versions are never deleted automatically. Advancing `min_decryption_version` past a version makes that version permanently unusable, but does not remove it from Vault's storage until you also advance `min_available_version` and delete the old versions explicitly (which requires Vault Enterprise for some operations). For most purposes at Golem Trust, advancing `min_decryption_version` is sufficient.

## Rotation schedule

All customer Transit keys are rotated annually, on the first Monday of the month in which the key was originally created. The key creation dates are recorded in the Golem Trust key register (maintained in the `golem-trust/key-register` GitLab repository).

Immediate rotation is required whenever:

- A Vault operator workstation is lost, stolen, or compromised
- The AppRole Secret ID for a customer application is believed to have been exposed
- A member of staff with knowledge of Vault credentials leaves the organisation
- Cheery's monitoring detects anomalous decryption activity

## Scheduled rotation procedure

Perform all steps in staging first. Production rotation follows only after staging completes without error.

Step 1: Notify affected customers. The Assassins' Guild requires 48 hours' advance notice before their key is rotated. Send notification via the agreed secure channel (encrypted email to the Guild's technical liaison). Other customers require 24 hours' notice.

Step 2: Rotate the key in staging:

```
vault write -f transit/keys/assassins-guild-contracts-confidential/rotate
```

Verify the new version:

```
vault read transit/keys/assassins-guild-contracts-confidential
```

Confirm that `latest_version` has incremented and that the new version's `creation_time` reflects the current time.

Step 3: Run the rewrap procedure in staging (see below).

Step 4: Confirm all staging data has been rewrapped by querying the staging database for any remaining `vault:v{old_version}:` ciphertext tokens:

```
SELECT COUNT(*) FROM records WHERE ciphertext LIKE 'vault:v1:%';
```

This count should be zero before advancing `min_decryption_version`.

Step 5: After staging validation, repeat steps 2 through 4 in production.

Step 6: Advance the minimum decryption version in production:

```
vault write transit/keys/assassins-guild-contracts-confidential/config \
  min_decryption_version=2
```

Step 7: Record the rotation in the key register and notify Cheery for the audit log.

## Rewrap procedure

The rewrap operation re-encrypts ciphertext under the latest key version without exposing the plaintext. The caller sends the old ciphertext; Vault decrypts it internally with the old key version and re-encrypts it with the latest version, returning new ciphertext.

This script processes all records for a given customer key. Run it in staging first, with a backup taken immediately before execution:

```
import hvac
import os
import psycopg2

VAULT_ADDR = os.environ["VAULT_ADDR"]
KEY_NAME = "assassins-guild-contracts-confidential"
DB_DSN = os.environ["DB_DSN"]

def rewrap_all_records():
    client = hvac.Client(url=VAULT_ADDR)
    client.auth.approle.login(
        role_id=os.environ["VAULT_ROLE_ID"],
        secret_id=os.environ["VAULT_SECRET_ID"],
    )

    conn = psycopg2.connect(DB_DSN)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, ciphertext, encryption_context FROM records "
        "WHERE key_name = %s",
        (KEY_NAME,)
    )
    rows = cursor.fetchall()
    print(f"Records to rewrap: {len(rows)}")

    for record_id, ciphertext, context in rows:
        response = client.secrets.transit.rewrap_data(
            name=KEY_NAME,
            ciphertext=ciphertext,
            context=context,
        )
        new_ciphertext = response["data"]["ciphertext"]
        cursor.execute(
            "UPDATE records SET ciphertext = %s WHERE id = %s",
            (new_ciphertext, record_id)
        )
        conn.commit()
        print(f"Rewrapped record {record_id}")

    cursor.close()
    conn.close()
    print("Rewrap complete.")

rewrap_all_records()
```

The rewrap operation is safe to interrupt and resume: any record already rewrapped to the new version will pass through the rewrap call unchanged (Vault recognises it is already at the latest version). Do not advance `min_decryption_version` until the rewrap script has completed and the count of old-version ciphertexts is zero.

## Immediate rotation on suspected compromise

If compromise is suspected, rotate immediately without waiting for the scheduled date and without the 48-hour notice period. Notify the Assassins' Guild's technical liaison simultaneously with initiating rotation, not before. Security takes precedence over notice periods in a compromise scenario.

```
vault write -f transit/keys/assassins-guild-contracts-confidential/rotate
```

Then follow the rewrap procedure as above, prioritising completion speed over the normal staged approach. Cheery must be notified immediately and an incident record opened.

After confirming the rewrap is complete and `min_decryption_version` has been advanced, rotate the AppRole Secret ID for the affected application as well:

```
vault write -f auth/approle/role/assassins-guild-app/secret-id
```

Deliver the new Secret ID to the Guild via the agreed secure channel. The old Secret ID is revoked:

```
vault write auth/approle/role/assassins-guild-app/secret-id-accessor/destroy \
  secret_id_accessor=<old-accessor>
```

## Coordinating rotation with the Assassins' Guild

The 48-hour advance notice requirement exists because the Guild's application must be updated with any new operational parameters before rotation completes. In practice, no application-side changes are required for key rotation itself, since Vault handles version selection transparently. The notice period is maintained regardless as a contractual obligation and as a courtesy.

The notification template:

```
To: technical-liaison@assassins-guild.am
Subject: Vault key rotation scheduled - 48 hours notice

This message confirms that the Vault Transit key
assassins-guild-contracts-confidential is scheduled for rotation
at {datetime UTC}.

No application changes are required. All existing ciphertext will
remain decryptable during and after rotation. A rewrap procedure will
follow to migrate existing records to the new key version.

Please confirm receipt.

Golem Trust Platform Operations
```

Confirmation of receipt must be logged in the change management system before rotation proceeds.

## Testing rotation in staging

The staging key names mirror production with a `-staging` suffix, e.g. `assassins-guild-contracts-confidential-staging`. The staging rotation test checklist:

1. Create at least 10 test records encrypted under the current (pre-rotation) key version
2. Perform rotation and confirm `latest_version` increments
3. Verify that existing test records can still be decrypted (backward compatibility check)
4. Run the rewrap script and confirm all records migrate to the new version
5. Advance `min_decryption_version`
6. Confirm that decryption of the original ciphertext tokens (pre-rewrap) now fails
7. Confirm that decryption of the rewrapped ciphertext tokens succeeds
8. Record test results; Ponder reviews before approving the production rotation change request
