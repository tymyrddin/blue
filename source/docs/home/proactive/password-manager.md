# Password managers

A password manager solves one specific problem: reused passwords. When one service is breached and its
password database leaked, the attacker can try those credentials on every other service the user has an
account with. A unique password per service breaks that chain. Remembering unique passwords for dozens of
accounts is not realistic without a manager. Password reuse is not carelessness; it is the predictable
outcome of being asked to maintain dozens of distinct secrets with no infrastructure to support it.

## What it does

* Generates a unique, random password for each account
* Stores all passwords behind a single strong master password
* Fills in login forms automatically
* Alerts when a stored password appears in a breach

The master password is the single credential worth protecting carefully. It is not stored anywhere the
manager can access: if it is forgotten, the vault contents cannot be recovered.

## Choosing one

| Name | Key features | Free tier | Best for | Audit status |
|------|-------------|-----------|----------|--------------|
| 1Password | Strong family and team sharing | No | Families | SOC 2, ISO 27001 |
| Bitwarden | Open-source, self-hostable | Yes | Privacy-focused users | Open-source + audited |
| Proton Pass | Integrated with Proton Mail and VPN | Limited | Proton ecosystem users | Audited |
| KeePassXC | Offline, hardware key support | Yes | Linux users, offline-first | Open-source |
| Dashlane | Built-in VPN, breach monitoring | No | All-in-one | Audited |
| NordPass | XChaCha20 encryption | Limited | NordVPN users | Audited |
| Enpass | Local storage, no mandatory cloud | Limited | Hybrid users | Audited |
| Keeper | Zero-knowledge file storage | No | Enterprises | FIPS 140-2 |

## Self-hosting and hardware options

| Use case | Recommendation | Why |
|----------|----------------|-----|
| Self-hosting | Vaultwarden (Bitwarden fork) | Full control over data |
| Hardware security | KeePassXC + OnlyKey | Air-gapped with physical 2FA |
| Teams | Keeper Enterprise | FIPS compliance, SIEM integration |

## Passkeys

Most managers now support FIDO2 passkeys as a primary login method. Passkeys replace the password with
device-based biometrics or a hardware key, and are worth adopting where supported. Keeping a TOTP app or
hardware key as backup remains sensible.

## Worth noting

LastPass has had significant breach incidents. Its current security posture is less clearly established than
before those events, and there are better-audited alternatives in both the free and paid tiers.

Any manager without a published third-party security audit or without passkey support deserves scrutiny
before adoption.

## Practical recommendation

For most people: Bitwarden (free, open-source, well-audited) or Proton Pass if already using Proton Mail.

For families: 1Password's family plan handles shared access cleanly.

For those who want nothing in the cloud: KeePassXC with a backup copy of the database stored separately.
