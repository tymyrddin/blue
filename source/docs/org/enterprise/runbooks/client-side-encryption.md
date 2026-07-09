# Client-side encryption implementation

Lord Downey's requirement was unambiguous: even Golem Trust's own staff must be technically incapable of reading the Guild's data. The implementation that satisfies this requirement is client-side encryption. The Assassins' Guild application calls Vault Transit to encrypt data before it ever leaves the Guild's own application process. Golem Trust receives and stores only ciphertext. This runbook covers the integration pattern, the Python implementation using the `hvac` library, the decryption path, error handling requirements, and the SDK wrapper pattern used to abstract Vault calls from application code.

## Integration pattern

The flow for writing data is:

1. The Guild application generates or receives plaintext data
2. The application calls Vault Transit `encrypt` with the appropriate key and context
3. Vault returns base64-encoded ciphertext
4. The application sends the ciphertext (not the plaintext) to Golem Trust's storage API
5. Golem Trust stores the ciphertext; the plaintext has never left the Guild's process

The flow for reading data is:

1. The application requests a record from Golem Trust's storage API
2. Golem Trust returns the stored ciphertext
3. The application calls Vault Transit `decrypt` with the matching key and context
4. Vault returns the base64-encoded plaintext
5. The application decodes and processes the plaintext locally

At no point in either flow does plaintext pass over the network to Golem Trust, nor does it touch Golem Trust's storage layer.

## Prerequisites

- Python 3.11 or later
- `hvac` library: `pip install hvac`
- A Vault AppRole Role ID and Secret ID for the `assassins-guild-app` role (see the Transit engine setup runbook)
- `VAULT_ADDR` set to the Vault cluster address, e.g. `https://vault.golems.internal:8200`

## Authentication to Vault

The application authenticates using AppRole. The Role ID is not secret and may be shipped in application configuration. The Secret ID is secret and must be injected at runtime via an environment variable or a secrets manager, never hardcoded.

```
import hvac
import os

def get_vault_client() -> hvac.Client:
    client = hvac.Client(url=os.environ["VAULT_ADDR"])
    client.auth.approle.login(
        role_id=os.environ["VAULT_ROLE_ID"],
        secret_id=os.environ["VAULT_SECRET_ID"],
    )
    if not client.is_authenticated():
        raise RuntimeError("Vault authentication failed")
    return client
```

The returned token has a TTL of one hour. The SDK wrapper (described below) handles token renewal automatically.

## Encrypting data

The plaintext must be base64-encoded before passing it to Vault. The `hvac` library handles this for you when you pass a bytes object; the function below encodes a string.

```
import base64

def encrypt(client: hvac.Client, plaintext: str, record_id: str) -> str:
    """
    Encrypt plaintext for a given record and return the Vault ciphertext token.
    The ciphertext token is safe to store and transmit; it contains no plaintext.
    """
    context = base64.b64encode(record_id.encode("utf-8")).decode("utf-8")
    encoded_plaintext = base64.b64encode(plaintext.encode("utf-8")).decode("utf-8")

    response = client.secrets.transit.encrypt_data(
        name="assassins-guild-contracts-confidential",
        plaintext=encoded_plaintext,
        context=context,
    )
    return response["data"]["ciphertext"]
```

The returned ciphertext is a string of the form `vault:v1:...`. This string is what the application sends to Golem Trust's storage API. The `record_id` must be the stable, immutable identifier for this record, as described in the key hierarchy runbook.

## Decrypting data

```
def decrypt(client: hvac.Client, ciphertext: str, record_id: str) -> str:
    """
    Decrypt a Vault ciphertext token for the given record and return the original plaintext.
    Raises ValueError if the context does not match (indicating a cross-contamination attempt).
    """
    context = base64.b64encode(record_id.encode("utf-8")).decode("utf-8")

    response = client.secrets.transit.decrypt_data(
        name="assassins-guild-contracts-confidential",
        ciphertext=ciphertext,
        context=context,
    )
    plaintext_bytes = base64.b64decode(response["data"]["plaintext"])
    return plaintext_bytes.decode("utf-8")
```

If the context does not match the one used during encryption, Vault returns an error and `hvac` raises an exception. The application must treat this as a fatal error.

## Error handling: fail closed

The application must never fall back to storing or transmitting plaintext if Vault is unavailable. A failure to reach Vault is a hard stop. This is non-negotiable and was a specific requirement from Lord Downey.

```
import hvac.exceptions

def safe_encrypt(client: hvac.Client, plaintext: str, record_id: str) -> str:
    """
    Encrypt with strict fail-closed behaviour. Any Vault failure raises an exception
    that must propagate to the caller; the plaintext must not be stored or transmitted.
    """
    try:
        return encrypt(client, plaintext, record_id)
    except hvac.exceptions.VaultError as exc:
        # Log the error for monitoring, then re-raise.
        # Do NOT store plaintext as a fallback.
        raise RuntimeError(
            f"Vault encryption failed for record {record_id}. "
            "Operation aborted. Plaintext has not been stored."
        ) from exc
    except hvac.exceptions.InvalidRequest as exc:
        raise RuntimeError(
            f"Vault rejected encryption request for record {record_id}. "
            "Check context and key name."
        ) from exc
```

The application's HTTP layer should return a `503 Service Unavailable` to its own callers when this exception is raised, indicating that the operation cannot be completed rather than degrading silently.

## SDK wrapper pattern

To avoid scattering Vault-specific calls throughout the application codebase, all Transit interactions are wrapped in a single module. Application code calls the wrapper; only the wrapper knows about `hvac`.

```
class GuildVaultClient:
    """
    Wrapper around hvac for Assassins' Guild Transit operations.
    Handles authentication, token renewal, and key name configuration.
    """

    KEY_NAME = "assassins-guild-contracts-confidential"

    def __init__(self):
        self._client = None
        self._token_expiry = None

    def _ensure_authenticated(self):
        import time
        if self._client is None or (
            self._token_expiry and time.time() > self._token_expiry - 300
        ):
            self._client = get_vault_client()
            # Token TTL is 1 hour; renew when 5 minutes remain
            self._token_expiry = time.time() + 3600

    def encrypt_record(self, plaintext: str, record_id: str) -> str:
        self._ensure_authenticated()
        return safe_encrypt(self._client, plaintext, record_id)

    def decrypt_record(self, ciphertext: str, record_id: str) -> str:
        self._ensure_authenticated()
        return decrypt(self._client, ciphertext, record_id)
```

The `GuildVaultClient` instance should be created once per application process and reused. It is thread-safe as long as `_ensure_authenticated` is protected by a lock in multi-threaded applications.

## Storing ciphertext in Golem Trust's storage API

The storage API accepts a JSON body. The `ciphertext` and `encryption_context` fields are both required:

```
{
  "record_id": "contract-00001",
  "ciphertext": "vault:v1:AbCdEf...",
  "encryption_context": "Y29udHJhY3QtMDAwMDE="
}
```

The `encryption_context` field stores the base64-encoded record ID that was used as the Vault context. Golem Trust's storage layer persists this alongside the ciphertext so that it is available at decrypt time. Neither field contains plaintext; Golem Trust has no capability to decrypt this data without the Guild's Vault credentials.

## Verifying the integration in staging

Before deploying to production, Ponder's checklist requires:

1. Confirm that an attempt to decrypt with the wrong `record_id` returns an error
2. Confirm that the application returns a non-200 status code when Vault is unreachable (use `iptables` to block Vault temporarily in staging)
3. Confirm that no plaintext appears in application logs (search for known test strings)
4. Confirm that the ciphertext stored in the database changes between runs (indicating the nonce is being varied correctly by Vault)
5. Confirm that the Vault audit log shows the encryption operations with the correct `mount_accessor` and `key_name`
