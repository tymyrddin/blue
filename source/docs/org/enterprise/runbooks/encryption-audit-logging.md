# Audit logging for encryption operations

Otto Chriek takes compliance very seriously. As Golem Trust's compliance officer, he produces a monthly report that must account for every decryption operation performed against customer keys. He is also aware, in the way that people who work with vampires tend to be aware of things, that the Assassins' Guild will notice if their audit trail is incomplete. Vault's audit logging subsystem records every Transit API call: who made the request, which key was involved, what operation was performed, and the result, without ever logging the plaintext or ciphertext itself. This runbook covers enabling the Vault file audit device, configuring Graylog forwarding, understanding what is and is not logged, and the alerting rules and monthly report procedure.

## What Vault logs, and what it does not

By design, Vault's audit log records metadata about every request and response. It does not record plaintext or ciphertext values in any form. The fields recorded for a Transit operation include:

- `request.id`: unique identifier for this request
- `request.operation`: the HTTP method (`update` for most Transit operations)
- `request.path`: the Vault path, e.g. `transit/encrypt/assassins-guild-contracts-confidential`
- `request.data`: the request parameters, with sensitive fields such as `plaintext` and `ciphertext` replaced by `hmac-sha256:...` hashes
- `auth.display_name`: the entity that made the request (e.g. the AppRole name)
- `auth.token_accessor`: the accessor for the token used
- `request.remote_address`: the source IP address of the calling application
- `response.data.key_version`: the key version used for this operation
- `time`: the timestamp in RFC 3339 format

The HMAC hashing of sensitive fields means that if the same plaintext appears in two requests, the HMAC values will match (because the salt is fixed per Vault node), which allows correlation without exposure. However, the raw plaintext cannot be recovered from the HMAC.

## Enable the Vault file audit device

The file audit device writes one JSON object per line to a file on the Vault server. Enable it with a descriptive path so multiple audit devices can coexist:

```
vault audit enable -path=file-transit file \
  file_path=/var/log/vault/audit.log \
  log_raw=false \
  hmac_accessor=true \
  mode=0640
```

Confirm the device is active:

```
vault audit list
```

The `log_raw=false` setting ensures plaintext and ciphertext are always HMAC-hashed. The `mode=0640` setting limits file readability to the Vault process user and the `vault-audit` group, to which the Graylog forwarder user belongs.

Vault requires at least one audit device to be responding for write operations to succeed. If the file audit device fills the disk or becomes unwritable, Vault will refuse all write requests until the device is repaired. Monitor disk usage on the Vault server accordingly.

## Configure log rotation

The audit log must not be allowed to grow unboundedly. Configure `logrotate` on the Vault server:

```
/var/log/vault/audit.log {
    daily
    rotate 90
    compress
    missingok
    notifempty
    create 0640 vault vault-audit
    postrotate
        # Signal Vault to reopen the audit file after rotation
        kill -HUP $(cat /var/run/vault/vault.pid)
    endscript
}
```

Retain 90 days of compressed logs locally. Longer retention is provided by Graylog archiving (see below).

## Forward audit logs to Graylog

The Graylog forwarder uses Filebeat, configured to tail `/var/log/vault/audit.log` and send to the Graylog GELF input.

The relevant section of the Filebeat configuration:

```
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/vault/audit.log
    tags: ["vault-audit"]
    json.keys_under_root: true
    json.overwrite_keys: true
    json.add_error_key: true

output.logstash:
  hosts: ["graylog.golems.internal:5044"]
```

In Graylog, create a dedicated stream for Vault Transit operations. The stream rule matches messages where the `request_path` field contains `transit/`:

```
Field: request_path
Type: string contains
Value: transit/
```

Name this stream "Vault Transit Operations". Otto Chriek and Cheery should both be granted read access to this stream.

## Graylog alert: unauthorised decryption of Assassins' Guild keys

Any decryption of an Assassins' Guild key from an IP address outside the Guild's known application server range is a critical event. Configure a Graylog alert condition on the "Vault Transit Operations" stream:

```
Alert name: Assassins-Guild-Decrypt-Unknown-IP
Stream: Vault Transit Operations
Condition type: Message count
Time range: 1 minute
Threshold: count > 0

Filter query:
  request_path:transit/decrypt/assassins-guild* AND NOT source:(10.42.8.10 OR 10.42.8.11 OR 10.42.8.12)
```

The IP range `10.42.8.10` to `10.42.8.12` represents the Assassins' Guild application servers in Golem Trust's Headscale private network. If this alert fires, the response procedure is to immediately notify Angua and Lord Downey's liaison and to revoke the AppRole Secret ID used.

## Graylog stream for all Transit operations

For the monthly compliance report, a Graylog saved search provides the raw data Otto needs:

```
Saved search name: Transit-Operations-Monthly
Stream: Vault Transit Operations
Query: request_path:transit/*
Time range: last 30 days
Fields displayed: time, request_path, auth_display_name, request_remote_address, response_data_key_version
```

Export this search as CSV for inclusion in the monthly report.

## Otto Chriek's monthly compliance report

Otto's monthly report covers the following metrics, all derived from the Graylog saved search above:

- Total encryption operations per customer key in the reporting period
- Total decryption operations per customer key in the reporting period
- Total rewrap operations (indicating key rotation activity)
- Any error responses (non-200 status) and their causes
- Confirmation that no operation originated from an unexpected IP address
- Confirmation that no audit device failures occurred during the period

The report structure:

```
Monthly Transit Audit Report
Period: {month} {year}
Prepared by: Otto Chriek, Compliance Officer

1. Operation counts by key
   assassins-guild-contracts-confidential: {encrypt_count} encrypt, {decrypt_count} decrypt
   royal-bank-records-confidential:        {encrypt_count} encrypt, {decrypt_count} decrypt
   patricians-office-documents-confidential: {encrypt_count} encrypt, {decrypt_count} decrypt

2. Anomalies
   Unexpected source IPs: None
   Error responses: None
   Audit device failures: None

3. Sign-off
   Reviewed by: Otto Chriek
   Date: {date}
```

Otto submits this report to Adora Belle and includes it in the package prepared for Mr. Bent's quarterly Royal Bank review. The absence of anomalies is the expected and desired outcome; any anomalies in section 2 must be accompanied by an incident reference number.
Last updated: 20 March 2026
