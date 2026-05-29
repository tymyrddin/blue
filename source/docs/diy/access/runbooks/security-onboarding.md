# Security onboarding for engineers

## When to run

When a new engineer, developer, or technical contractor joins the team. Run before granting access to production systems.

## The goal

Engineers arrive knowing the team's security hygiene expectations before they touch production. Not a compliance lecture. A practical walkthrough of how this team manages access, where secrets live, and what to do when something looks wrong.

An engineer who does not know the team's practices will fill the gaps with whatever their previous employer did, which may not match here.

## Day one: accounts and access

1. Issue a personal SSH key pair for server access. Never share an existing key. Generate with:
   ```
   ssh-keygen -t ed25519 -C "name@organisation"
   ```
   Add the public key to `authorized_keys` on the servers they need. Do not grant access to production systems until day-one orientation is complete.
2. Set up MFA on all accounts before granting access to production systems. (See: MFA rollout runbook.)
3. Grant repository access scoped to the projects they are working on. Do not grant broad access "because it's easier."
4. Grant cloud console access with a role appropriate to their current responsibilities. No admin access by default.
5. Add to the shared password manager and confirm they know how to retrieve credentials they legitimately need.

## First week: practices

6. Walk through where secrets live: what is in the password manager, what is in the secrets manager or CI/CD secret store, what is never stored in the repository. Confirm they are not keeping credentials in dotfiles, local `.env` files, or notes.
7. Confirm they know the incident reporting path. In a small team this is usually: tell the technical lead or CTO directly, as soon as possible, without trying to resolve it first. The worst outcome is a problem that was noticed but not escalated because the person felt uncertain.
8. Review the deployment process for any security-relevant steps: required code reviews, automated checks, approval gates before production deploys.
9. Confirm the laptop meets minimum requirements: full disk encryption enabled, screen lock active, OS and browser up to date.

## Before going hands-on with production

Confirm before the first production access:

- MFA active on all critical accounts
- Personal SSH key in place, not a shared key
- Aware of where to report a security concern
- Laptop encrypted

## Follow-up

- At for example 30 days: verify access scope is still appropriate. Roles sometimes expand during onboarding and are not revisited.
- Add to the offboarding checklist for when the time comes.
- Note the onboarding date in the access inventory.
