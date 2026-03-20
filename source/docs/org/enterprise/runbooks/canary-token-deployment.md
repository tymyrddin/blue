# Canary token deployment

Angua's view of deception technology is pragmatic: every canary token is a trap that costs nothing to set and, if it fires, tells her something important is happening. Dr. Crucible, who has read extensively about ancient Unseen University warding spells, points out that this is identical to the theory behind arcane tripwires. The principle is that an attacker navigating an unfamiliar environment will eventually touch something they should not. When they do, you know, and they do not know you know. This asymmetry is worth considerably more than the twenty minutes it takes to deploy a token.

## Token types and deployment inventory

Golem Trust maintains four categories of canary token, with the current deployment counts as of the last inventory review.

Fake AWS credentials: 27 tokens, deployed in two locations. Fourteen are embedded in public GitHub repositories (in old commits, in config file examples, in README files that predate the organisation's current secret management practices). Thirteen are in internal wiki pages that describe legacy configuration patterns. The tokens use a dedicated AWS account, `canary-monitor@golemtrust.am`, that has no IAM permissions to do anything except exist. CloudTrail is enabled on this account with alerts for any API call. The moment these credentials are used, AWS logs the call, which triggers an alert.

Fake database credentials: 14 tokens, deployed in internal documentation. The credentials are formatted to look like real connection strings (DSN format, realistic hostnames, realistic passwords that meet the organisation's complexity requirements). The "database" they point to is a honeypot PostgreSQL instance (see the honeypot setup runbook). Access attempts are logged by the honeypot.

Fake admin accounts: 8 tokens, deployed as Active Directory accounts. Account names: `admin-backup`, `svc-legacy`, `admin-dr`, `svc-monitoring-old`, `admin-vault-2023`, `svc-payments-backup`, `admin-keycloak-old`, `svc-harbor-legacy`. Each account is disabled, has a last-password-set date in the past (to look plausible), and has Wazuh monitoring for any authentication attempt against it.

Honeydoc files: 32 documents deployed across SharePoint and internal file shares. These are Word documents and PDFs with titles like "Royal Bank Integration Credentials Q4 2025.docx" and "Golem Trust Admin Passwords (BACKUP).pdf". Each document contains an embedded URL (using the document's template feature or a hidden image with a web bug) that, when the document is opened, makes an HTTP request to the canary token server. The files are placed in locations that a legitimate user would have no reason to open: old archive folders, decommissioned project directories, the `legacy-configs` share.

## Token registry

Each token is registered in a Vaultwarden entry under the `security/deception/canary-registry` collection. The registry entry for each token records:

```
Token ID: uuid (e.g. 4f7e2c01-d3ad-beef-cafe-0123456789ab)
Token type: aws_credential | db_credential | ad_account | honeydoc
Location: exact path or URL where the token is deployed
Expected access pattern: never | rarely (for tokens in locations that
  might be legitimately browsed but never opened)
Alert destination: PagerDuty (all tokens; deception events are always high priority)
Graylog lookup table key: same as Token ID
Deployed by: Angua
Deploy date: YYYY-MM-DD
Last verified: YYYY-MM-DD
```

The registry spreadsheet is maintained as a CSV in the security team's GitLab repository at `security/deception/canary-registry.csv`, encrypted at rest with git-crypt. The Graylog lookup table (see alert configuration runbook) imports from this CSV nightly.

## Deploying a new token

The process for deploying a new canary token:

Step 1: generate the token. For AWS credential tokens, use the canary token generation script:

```
python3 security/deception/tools/generate_canary.py \
  --type aws_credential \
  --location "internal-wiki/legacy-aws-setup.md" \
  --description "Fake AWS creds in legacy wiki page"
```

The script creates the token, adds it to the registry CSV, and outputs the credential string to embed.

Step 2: place the token in the target location. For a wiki page, edit the page and add the credentials in a code block, formatted to look like a legitimate configuration:

```
# Legacy AWS configuration (superseded - see current docs)
aws_access_key_id = AKIAIOSFODNN7CANARY01
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYCANARY01KEY
region = eu-west-1
```

Step 3: register in the Graylog lookup table. The nightly import handles this automatically from the registry CSV, but for immediate effect, add the entry manually:

```
curl -X POST https://graylog.golemtrust.am/api/system/lookup/tables/canary-registry/rows \
  -H "Authorization: Basic GRAYLOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "AKIAIOSFODNN7CANARY01",
    "value": {
      "token_type": "aws_credential",
      "location": "internal-wiki/legacy-aws-setup.md",
      "alert_destination": "pagerduty-deception"
    }
  }'
```

Step 4: document in the team's change log at `security/deception/changes.md`.

## Periodic verification

Canary tokens must be verified monthly: confirm the token is still in place and has not been accidentally removed, and confirm the alert chain is working. The verification process:

```
# Verify AWS credential token fires correctly (use a controlled test machine)
# WARNING: only run from the designated canary-test machine, never from production

AWS_ACCESS_KEY_ID=AKIAIOSFODNN7CANARY01 \
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYCANARY01KEY \
aws sts get-caller-identity 2>&1

# This should fail (no permissions) AND trigger an alert in Graylog within 60 seconds
# Check Graylog: stream "Deception Events", last 5 minutes
# Check PagerDuty: confirm alert fired and was acknowledged as a test
```

After verification, mark the token as verified in the registry and close the PagerDuty alert as a test. Record the verification date in the registry.

## Naming conventions

Fake admin account names follow a pattern that makes them look like real legacy service accounts. The naming conventions for each type:

- `admin-*`: looks like an administrator account created for a specific purpose and forgotten
- `svc-*-old` or `svc-*-legacy` or `svc-*-backup`: looks like a service account from a deprecated integration
- `svc-*-2023` (with an old year): looks like a service account that was created during a migration and not cleaned up

These names are plausible because Golem Trust, like every organisation that has grown, actually does have some old service accounts with similar naming patterns. The difference is that all real service accounts are documented in the service account registry; the canary accounts are not, and any authentication attempt against them indicates either an attacker with access to AD enumeration or an insider exploring accounts they should not be accessing.
