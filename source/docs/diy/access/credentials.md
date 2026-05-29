# Credential management

Small teams accumulate credential exposure in ways that are easy to miss: an SSH key added for emergency access and never removed, a shared password in a message from two years ago, an API key in an `.env` file committed to the repository. None of these require a sophisticated attacker. They require only that the credential is found before the team notices it is there.

## SSH keys

SSH keys work best when each person on a team uses a distinct key pair. Shared keys cannot be individually revoked; removing a shared key removes access for everyone using it, and any audit trail of who accessed what is lost. The private key stays on the individual's device; the public key goes in `~/.ssh/authorized_keys` on the server.

An SSH public key added to `authorized_keys` persists there until explicitly removed. Account deletion elsewhere does not propagate to `authorized_keys` entries. Keys belonging to people who have left remain valid until individually revoked from each server where they were added.

Key rotation is the control for suspected credential exposure. Rotation means generating a new key pair, adding the new public key, confirming access, then removing the old one. Rotation without the removal step is not rotation.

Keys generated with Ed25519 are shorter and faster than 4096-bit RSA and at least as secure for current threat models:

```
ssh-keygen -t ed25519 -C "identifier"
```

## Sudo scope

An administrative account with `ALL=(ALL) ALL` in sudoers is effectively root with an extra step. Scoping sudo to the commands actually needed means a compromised account can cause damage only within that scope.

The distinction carries more weight on servers holding sensitive data than on development or staging machines. A compromised development server is a bad day; a compromised production database is a different order of problem.

Programs with shell escape features in the allowed list, including vim, less, more, nmap, python, and perl, can be used to break out of the intended scope into a full shell. These belong out of sudoers on production machines regardless of how convenient they are day to day.

## Secrets out of repositories

A secret committed to a version control repository is exposed to everyone with access to that repository, and potentially to anyone who ever had access. After deletion, the secret remains in the git history and in any clone or fork made before the deletion.

`.env` files containing database credentials, API keys, and service tokens have no business in a repository. A `.gitignore` entry covering `.env`, `*.pem`, `*.key`, and similar prevents accidental commits. It does not help if those files were already committed.

Automated secret scanning tools can surface already-committed secrets. GitHub has one built in for public repositories; truffleHog and gitleaks cover other contexts. A one-time scan on existing repositories frequently produces findings that went unnoticed.

Environment variables are a step up from files, but not a secrets management system. Values in environment variables are visible to processes running on the server, in container inspect output, and in configuration management logs. A proper secrets manager provides rotation, auditing, and access control that environment variables do not.

## Service account credentials

API keys and service tokens accumulate the same way SSH keys do: added for a purpose, retained past the purpose's end. A quarterly review of what API keys exist, which services they grant access to, and whether they are still in active use is worth the time it takes. Most provider consoles show last-used timestamps; keys unused for months are candidates for revocation.
