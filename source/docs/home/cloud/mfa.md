# MFA everywhere

Multifactor authentication adds a second verification step beyond the password. It substantially raises
the cost of account compromise, because a stolen password alone is no longer sufficient. See also the
[MFA bypass techniques](../threats/backdrop/mfa.md) that are in active use, since not all MFA methods
are equally resistant.

## MFA tools

### TOTP authenticator apps

These apps generate 6-digit codes that refresh every 30 seconds. More resistant than SMS, which is
vulnerable to SIM swapping.

| Tool                        | Pros                                          | Cons                        | Best for                            |
|-----------------------------|-----------------------------------------------|-----------------------------|-------------------------------------|
| Aegis (Android)             | Open-source, offline, encrypted backups       | Android only                | Privacy-focused users               |
| Raivo OTP (iOS)             | Open-source, local storage, encrypted exports | iOS only                    | iPhone users                        |
| 2FAS (Android/iOS)          | Open-source, encrypted cloud backup           | No desktop app              | Balance of security and convenience |
| Authy (Android/iOS/Desktop) | Cloud sync, multi-device                      | Closed-source, Twilio-owned | Convenience over maximum privacy    |
| Google Authenticator        | Simple, widely supported                      | No backups, no multi-device | Basic use only                      |

Recommendation: Aegis (Android) or Raivo (iOS) for maximum security. Authy or 2FAS if cloud backup is important.

### Hardware security keys

Physical devices (USB/NFC/Bluetooth) that perform cryptographic authentication. They prevent phishing
because the authentication is bound to the specific domain: a key used on a phishing site cannot
authenticate to the real site. The [MFA bypass page](../threats/backdrop/mfa.md) explains why this matters.

| Key              | Pros                                           | Cons                        | Best for               |
|------------------|------------------------------------------------|-----------------------------|------------------------|
| YubiKey 5 Series | FIDO2/U2F, NFC, works with 1000+ services      | Expensive                   | Best overall           |
| Nitrokey FIDO2   | Open-source, EU-made                           | Fewer services supported    | Privacy-focused users  |
| Google Titan     | Lower cost, well-supported for Google services | Limited third-party support | Google ecosystem users |
| SoloKey v2       | Open-source, USB-C/NFC                         | Smaller brand               | Tech enthusiasts       |

Buy hardware keys directly from the manufacturer. Third-party marketplace purchases carry a risk of
tampered devices.

Where to use hardware keys: Google, Microsoft, GitHub, Cloudflare, Coinbase, Bitwarden, 1Password.

## Backup and recovery

Losing MFA access can lock a user out of an account permanently.

* Print backup codes when offered (Google, Facebook, and similar services provide them during setup).
* Export encrypted TOTP backups (Aegis and Raivo support this).
* Register two hardware keys.
* Set up a fallback email or phone only if it is itself secured with MFA.

Do not store TOTP seeds in unencrypted cloud notes or email.

## Passkeys

Passkeys (FIDO2) replace passwords with device-based biometrics or a hardware key. They remove the
password from the authentication flow entirely and are resistant to phishing by design.

Where passkeys are supported: Google, Apple, Microsoft, GitHub, PayPal.

Passkeys are worth adopting where available, with TOTP or hardware keys kept as a backup method.

## Recommendations by situation

* For most people: 2FAS or Aegis/Raivo, plus a YubiKey 5 NFC for the most important accounts.
* For businesses: YubiKey with Authenticator.
* Maximum security: Nitrokey for example, with KeePassXC for TOTP storage.

## Setting up MFA: examples by category

These are illustrative examples. Check the security settings of any service with an account.

### Smart home and IoT apps

* Google Home: App → Settings → Home management → "Your Home" → Home settings → Two-step verification
* Ring (Amazon): Control Centre → Two-Step Verification → Enable
* Xiaomi Home: Profile → Account & Security → Two-Factor Authentication
* Tuya Smart: Account Security → Two-Step Verification

### Social media

* Facebook: Settings → Security & Login → Two-Factor Authentication → Authenticator App
* Twitter/X: Settings → Security → Two-Factor Authentication → Authentication App
* WeChat: Me → Settings → Account Security → Login Protection
* LINE: Settings → Account → Two-Step Verification
* WhatsApp: Settings → Account → Two-Step Verification
* Telegram: Settings → Privacy & Security → Two-Step Verification

### Banking and financial apps

US:

* Chase Bank: App → Profile → Security & Settings → Two-Step Verification
* PayPal: Settings → Security → 2FA → Authenticator App
* Coinbase: Security → Authenticator App → Scan QR code with Authy

Americas (beyond US):

* Nubank (Brazil): App → Profile → Security → Two-Factor Authentication
* Mercado Pago (Latin America): Security → Two-Step Verification
* RBC (Canada): Security → Two-Step Verification
* BBVA (Mexico/Spain): Security → Authentication via App

Europe:

* Revolut (UK/Europe): Security → Two-Factor Authentication
* N26 (Germany/Europe): Security → TOTP
* ING (Netherlands/Europe): Security → Two-Step Verification

Asia and Africa:

* Alipay (China/Global): Security → SMS + TOTP
* Paytm (India): Profile → Security → Two-Factor Authentication
* M-Pesa (Kenya/Africa): Security → PIN + SMS Verification
* KakaoPay (South Korea): Security → OTP Authentication
* GrabPay (Southeast Asia): Security → Two-Step Verification

### Productivity tools (examples)

* Microsoft 365: Security → Authenticator App or YubiKey
* Slack: Settings → Authentication → Two-Factor Auth
* Trello (Atlassian): Account → Security → Two-Factor Authentication
* Zoom: Security → Enable 2FA
Last updated: 10 July 2026
