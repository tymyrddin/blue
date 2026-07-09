# MFA rollout

## When to run

As part of account setup for any new team member. Also run as a catch-up exercise when MFA is not yet enforced across
the organisation, or when a new service is provisioned that supports it.

## Ownership

Technical lead. For organisation-level enforcement (GitHub, Google Workspace, AWS), the admin account holder.

## The accumulation problem

Password-only accounts can be compromised through phishing, credential stuffing, or data breaches at other services
where the same password was reused. MFA removes most of that exposure. A single compromised admin account without MFA
can give an attacker access to everything that account can reach, including password resets for other services.

## Priority order

Not all accounts carry equal risk. Work through them in this order:

1. Cloud provider root and admin accounts (often the most powerful and least monitored)
2. Email accounts (access to email is effectively access to every password reset downstream)
3. Code repositories (GitHub, GitLab, Bitbucket)
4. CI/CD systems
5. Domain registrar and DNS provider
6. All other SaaS tools

## Steps

For each account in priority order:

1. Log into account settings or the admin console.
2. Locate security or authentication settings.
3. Enable MFA. Use an authenticator app (TOTP: Google Authenticator, Authy, 1Password) rather than SMS. SMS MFA is
   better than nothing but is vulnerable to SIM swapping.
4. Generate backup codes and store them in a shared password manager or in a secure location separate from the device.
   Lost MFA without backup codes can lock an account permanently.
5. Verify MFA prompts on next login.

For organisation-level enforcement:

6. In GitHub: organisation settings, Authentication security, require two-factor authentication.
7. In Google Workspace: Admin console, Security, 2-step verification, enforcement.
8. In AWS: IAM, account settings, enable MFA enforcement through a service control policy or IAM policy condition.
9. Identify existing accounts without MFA enabled. Most cloud consoles have an IAM report or compliance view showing MFA
   status.
10. Set a deadline of no more than one week for all accounts to comply. Remove accounts that do not comply after the
    deadline rather than extending it.

## Done

MFA required and active on all cloud admin accounts, code repositories, email, CI/CD, and domain management. No team
member can authenticate to critical systems with a password alone.

## Follow-up

- Include MFA setup in [security onboarding](security-onboarding.md).
- Verify MFA status monthly or when a new team member joins.
- At [offboarding](offboarding.md): confirm backup codes are not stored on devices being returned.
Last updated: 29 May 2026
