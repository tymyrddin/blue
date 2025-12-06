# MFA Everywhere

Multi-factor authentication (MFA) is the #1 way to stop hackers.

## MFA Tools

Multifactor authentication (MFA) is only as strong as the tools you use. Below are the best authenticator apps, hardware keys, and backup strategies to secure your accounts.

### TOTP authenticator apps (Time-Based One-Time Passwords)

These apps generate 6-digit codes that refresh every 30 seconds. Better than SMS (SIM swapping risk).

| Tool	                        | Pros	                                          | Cons	                        | Best For                          |
|------------------------------|------------------------------------------------|------------------------------|-----------------------------------|
| Aegis (Android)	             | Open-source, offline, encrypted backups	       | Android-only	                | Privacy-focused users             |
| Raivo OTP (iOS)	             | Open-source, local storage, encrypted exports	 | iOS-only	                    | iPhone users who want security    |
| 2FAS (Android/iOS)	          | Open-source, encrypted cloud backup	           | No desktop app	              | Balance of security & convenience |
| Authy (Android/iOS/Desktop)	 | Cloud sync, multi-device	                      | Closed-source, Twilio-owned	 | Convenience over max privacy      |
| Google Authenticator	        | Simple, widely supported	                      | No backups, no multi-device	 | Basic users (but not recommended) |

Recommendation:

* Maximum security? → Aegis (Android) / Raivo (iOS)
* Convenience + backup? → Authy or 2FAS

### Hardware security keys (Strongest MFA)

These physical devices (USB/NFC/Bluetooth) prevent phishing and are the gold standard for MFA.

| Key	              | Pros	                                      | Cons	                        | Best For               |
|-------------------|--------------------------------------------|------------------------------|------------------------|
| YubiKey 5 Series	 | FIDO2/U2F, NFC, works with 1000+ services	 | Expensive	                   | Best overall           |
| Nitrokey FIDO2	   | Open-source, EU-made	                      | Fewer services supported	    | Privacy-focused users  |
| Google Titan	     | Cheaper, good for Google services	         | Limited third-party support	 | Google ecosystem users | 
| SoloKey v2	       | Open-source, USB-C/NFC	                    | Smaller brand	               | Tech enthusiasts*      | 

Where to use hardware keys?

* Google, Facebook, Microsoft, GitHub, Cloudflare
* Crypto (Coinbase, Kraken, Binance)
* Password Managers (Bitwarden, 1Password)

Warning: Always buy directly from the manufacturer (Amazon/eBay may sell tampered keys).

## Backup & Recovery Strategies

Losing MFA access can lock you out forever. Here’s how to avoid it:

Backup methods:

* Print Backup Codes (Google, Facebook, etc. provide them)
* Encrypted Exports (Aegis/Raivo allow encrypted backups)
* Multiple Keys (Register 2 YubiKeys in case one is lost)
* Emergency E-Mail/Phone (Set up fallback methods carefully)

Never Store TOTP Seeds in Cloud Notes/Email!

## Advanced: Passkeys (The future of MFA)

Passkeys (FIDO2) replace passwords with device-based biometrics (fingerprint/face unlock).

Where to use Passkeys?

* Google, Apple, Microsoft, GitHub, PayPal, Best Buy
* Best with: iPhone (iCloud Keychain), Android (Google Password Manager), or YubiKey

Recommendation: Start using passkeys where possible, but keep TOTP/hardware keys as backup.

## Tool recommendations

* For most people: Authy (if you need sync) or Aegis/Raivo (if you prioritise privacy) and YubiKey 5 NFC (for critical accounts)
* For businesses: YubiKey + Duo/Microsoft Authenticator
* For ultra-security: Nitrokey + KeePassXC (TOTP storage)

## Where to set up MFA?

These are but a few examples for an impression. Check where you have accounts and look it up.

### Smart home & IoT apps

* Google Home (Global): App → Settings → Home management → "Your Home" → Home settings → Two-step verification
* Ring (Amazon, Global): Control Center → Two-Step Verification → Enable
* Xiaomi Home/Mi Home (Asia): Profile → Account & Security → Two-Factor Authentication
* Tuya Smart (Used by many budget IoT brands): Account Security → Two-Step Verification

### Social media

* Facebook (Global): Settings → Security & Login → Two-Factor Authentication → Authenticator App
* Twitter/X (Global): Settings → Security → Two-Factor Authentication → Authentication App
* WeChat (China/Global): Me → Settings → Account Security → Login Protection
* LINE (Japan/Taiwan/Thailand): Settings → Account → Two-Step Verification
* VK (Russia/CIS): Settings → Security → Two-Factor Authentication
* Naver (South Korea): Settings → Security → OTP Authentication
* WhatsApp (Global): Settings → Account → Two-Step Verification
* Telegram (Global): Settings → Privacy & Security → Two-Step Verification

### Banking & financial apps

US:

* Chase Bank: App > Profile > Security & Settings > Two-Step Verification
* PayPal: Settings > Security > 2FA > "Set Up" next to Authenticator App
* Coinbase: Security > Authenticator App > Scan QR code with Authy Also add way 

Americas (Beyond US):

* Nubank (Brazil): App → Profile → Security → Two-Factor Authentication
* Mercado Pago (Latin America): Security → Two-Step Verification
* RBC (Canada): Security → Two-Step Verification
* BBVA (Mexico/Spain): Security → Authentication via App

Europe:

* Revolut (UK/Europe): Security → Two-Factor Authentication
* N26 (Germany/Europe): Security → TOTP (Google Authenticator)
* ING (Netherlands/Europe): Security → Two-Step Verification
* Sberbank (Russia/CIS): Security → OTP via SMS or App

Asia & Africa: 

* Alipay (China/Global): Security → SMS + TOTP
* Paytm (India): Profile → Security → Two-Factor Authentication
* M-Pesa (Kenya/Africa): Security → PIN + SMS Verification
* KakaoPay (South Korea): Security → OTP Authentication
* GrabPay (Southeast Asia): Security → Two-Step Verification
* UPI Apps (India - PhonePe, Google Pay, BHIM): Settings → Enable App Lock + UPI PIN

### And not to forget

* Microsoft 365 (Global): Security → Authenticator App or YubiKey
* Slack (Global): Settings → Authentication → Two-Factor Auth
* Trello (Atlassian, Global): Account → Security → Two-Factor Authentication
* Zoom (Global): Security → Enable 2FA