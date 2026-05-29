# Laptop loss or theft

## Trigger

A team member reports their work laptop as lost or stolen.

## First: assess the risk

The severity depends on two things: whether full disk encryption was enabled, and what the device had access to at the time of loss.

Ask immediately:

- Is full disk encryption enabled? (FileVault on macOS, BitLocker on Windows.) If uncertain, treat it as not encrypted.
- Was the device logged into production systems, cloud consoles, or code repositories at the time of loss?
- Was a password manager or credentials file accessible on the device?

If disk encryption is confirmed active and the device was locked at the time of loss: data-at-rest exposure is low. The active session and credential exposure still need addressing.

## Immediate actions

1. Revoke all SSH keys that were stored on or generated from the laptop. Check `~/.ssh/id_*` and any keys added to authorised hosts in recent months ([offboarding](../../access/runbooks/offboarding.md) and [SSH key setup and rotation](../../server/runbooks/key-management.md) cover the method).
2. Invalidate browser sessions for critical accounts. Most providers offer "sign out all other sessions" in account security settings:
   - AWS: sign out of all sessions in IAM or via the console
   - GitHub: Settings, Sessions, revoke others
   - Google: myaccount.google.com, Security, Your devices
3. Revoke any API keys or tokens stored on the device or in browser-saved credentials.
4. If the device was enrolled in a mobile device management (MDM) system: trigger a remote wipe. Note: a remote wipe also destroys any locally stored evidence. If there is any reason to preserve device state, weigh this carefully before wiping.

## Scope of potential exposure

5. What data was stored locally? Local database copies, customer data exports, private keys, and local `.env` files are the highest-risk items.
6. What was the device's access scope at the time of loss? Review the access inventory for the team member.
7. Were passwords saved in the browser without a master password lock? Treat those credentials as compromised and [rotate them](../../access/runbooks/secret-rotation.md).
8. Was the device used for two-factor authentication (authenticator app)? The active sessions already being revoked addresses this for most accounts, but confirm.

## All clear when

SSH keys revoked. Active sessions invalidated across all critical accounts. Credentials rotated for anything accessible from the device. Remote wipe triggered if MDM is available.

## Communication

If customer data, source code, or credentials giving access to personal data may have been on the device: seek legal advice on notification obligations before concluding none are required. Laptop theft with access to personal data triggers notification requirements in many jurisdictions.

## Evidence

File a police report. The report number is often required for insurance claims and may be relevant to legal obligations. Do this within 24 hours.

## Legal notes

Many data protection regulations treat a laptop with access to personal data as a notifiable incident when lost or stolen, regardless of whether encryption was enabled. Seek legal advice promptly.

## Follow-up

- Confirm full disk encryption status across all remaining team laptops.
- Confirm MDM enrolment and remote wipe capability for all team laptops.
- Review the policy on what data is permitted to be stored locally versus in cloud storage only.

## Related runbooks

- [Offboarding](../../access/runbooks/offboarding.md) and [secret rotation](../../access/runbooks/secret-rotation.md) for the access-revocation side, which overlaps heavily with this.
- [Backup verification](backup-verification.md) for whether the local data lost was recoverable elsewhere.
