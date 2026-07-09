# Set a password policy

Hardening runbook. Configures what local account passwords are allowed to be, so that accounts using passwords (console login, sudo, services without key auth) are not trivially guessable.

## When to run

On a new server during setup. On an existing server with no password quality enforcement. When the current policy forces complex passwords that rotate frequently and the team wants to move to the current guidance.

## Background, briefly

Current NIST guidance favours length over forced complexity. A passphrase of several unrelated words resists brute force well and is easier to remember than a short string of mixed symbols, which tends to get written down or reused. Forced periodic expiry is no longer recommended; it pushes people toward predictable variations.

This runbook configures a length-based policy. Servers relying entirely on SSH keys still benefit, because console and sudo access use these passwords.

## Steps

### Install the quality module

```
sudo apt-get install libpam-pwquality
```

Installation adds an entry to `/etc/pam.d/common-password` automatically.

### Set the policy

The options live in `/etc/security/pwquality.conf`. Uncomment and set, for a length-led policy:

```
minlen = 16
minclass = 2
```

`minlen` sets the minimum length. `minclass` sets how many character classes (lower, upper, digit, symbol) are required; keeping it low while length is high follows the current guidance.

### Risk

The policy applies to new passwords, not existing ones, and only at the moment a password is set. Changing the config does not lock out current accounts. Test the policy on a non-admin account before relying on it.

## Verify

Set a password on a test account and confirm a short one is rejected:

```
sudo passwd testuser
```

Enter a value shorter than `minlen`. It should be refused. Enter a compliant passphrase. It should be accepted.

## Done

Short passwords rejected at set time. A compliant passphrase accepted. The policy file reflects the intended length and class settings.

## Rollback

Comment the changed lines in `/etc/security/pwquality.conf` to return to defaults. No existing password is affected by the change either way.

## Follow-up

- Passwords are a fallback. Where possible, prefer [SSH keys](key-management.md) for server access and an authenticator app for accounts that support it.
Last updated: 29 May 2026
