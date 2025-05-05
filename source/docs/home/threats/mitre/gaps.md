# Your 2025 Home cybersecurity to-do List

Using [MITRE ATT&CK’s four priority areas](README.md), here’s a comprehensive breakdown of where your home defenses 
are probably failing—and how to patch them like a duct-tape-wielding IT admin.

## Priority #1: Initial access (Keeping hackers out)

### Gap: "My router’s admin page is wide open."

Attack Technique: Exploit Public-Facing Application (T1190)

Why It’s Bad: Hackers scan for routers with default credentials (admin:admin) and hijack them.

Fix:

* Change the default login (use a strong password).
* Disable remote admin access (unless you want strangers controlling your Wi-Fi).

### Gap: "I click ‘urgent’ emails like it’s my job."

Attack Technique: Phishing (T1566)

Why It’s Bad: One click = malware or stolen credentials.

Fix:

* Install uBlock Origin (blocks malicious ads/redirects).
* Train yourself (and family) to hover over links before clicking.

### Gap: "My ‘smart’ devices use the same password."

Attack Technique: Default Credentials (T1078.001)

Why It’s Bad: Hackers use botnets to brute-force IoT devices (like cameras).

Fix:

* Change default passwords (yes, even on the smart toaster).
* Put IoT devices on a separate Wi-Fi network (guest mode works).

## Priority #2: Execution (Stopping malware in its tracks)

### Gap: "My kid has admin rights ‘for games.’"

Attack Technique: Abuse Elevation Control (T1548)

Why It’s Bad: Malware runs wild with admin privileges.

Fix:

* Create a standard user account for daily use.
* Use Windows Sandbox or macOS Gatekeeper for sketchy downloads.

### Gap: "I download ‘cracked’ software."

Attack Technique: Malicious File (T1204.002)

Why It’s Bad: Pirated apps = malware freebies.

Fix:

* Use VirusTotal to scan downloads.
* Ask yourself: "Is saving $20 worth a ransomware attack?"

### Gap: "I ignore browser updates."

Attack Technique: Exploit Browser Engine (T1211)

Why It’s Bad: Unpatched browsers = drive-by download paradise.

Fix:

* Enable auto-updates for Chrome/Firefox/Safari.
* Ditch old plugins (Java, Flash, etc.).

## Priority #3: Persistence (Kicking hackers out for good)

### Gap: "I never check running processes."

Attack Technique: Process Injection (T1055)

Why It’s Bad: Malware hides in legit apps (like explorer.exe).

Fix:

* Use Task Manager (Win) or Activity Monitor (Mac) to spot weird activity.
* Install Malwarebytes for occasional scans.

### Gap: "My backups are always connected."

Attack Technique: Data Encrypted for Impact (T1486)

Why It’s Bad: Ransomware can encrypt backups too.

Fix:

* Use the 3-2-1 rule: 3 backups, 2 formats, 1 offline.
* Test restoring files (or discover too late they’re corrupted).

### Gap: "I don’t monitor login attempts."

Attack Technique: Valid Accounts (T1078)

Why It’s Bad: Hackers reuse stolen passwords.

Fix:

* Enable login alerts for email/cloud accounts.
* Use Bitwarden or KeePass for unique passwords.

## Priority #4: Exfiltration (Stopping data theft)

### Gap: "My cloud syncs everything automatically."

Attack Technique: Automated Exfiltration (T1020)

Why It’s Bad: Hackers love stealing synced files.

Fix:

* Encrypt sensitive files before uploading (use Cryptomator).
* Review Google Drive/Dropbox sharing permissions.

### Gap: "I don’t check email forwarding rules."

Attack Technique: Email Collection (T1114)

Why It’s Bad: Hackers forward your emails to themselves.

Fix:

* Check Gmail/Outlook rules for hidden filters.
* Use YubiKey or TOTP for email MFA.

### Gap: "My smart TV has a microphone/camera."

Attack Technique: Audio/Video Capture (T1123/T1125)

Why It’s Bad: Hackers can spy through compromised devices.

Fix:

* Cover the camera (tape works).
* Disable always-on voice assistants (sorry, Alexa).

## Future-proofing for 2025

| Threat	             | Preemptive Fix                         |
|---------------------|----------------------------------------|
| AI-Phishing	        | Use SimpleLogin for throwaway emails.  |
| 5G IoT Attacks	     | Put smart devices on a VLAN.           |
| Quantum Harvesting	 | Switch to Signal/ProtonMail for comms. |

## Final checklist

* MFA EVERYTHING (Email, router, cloud).
* Segment your network (IoT ≠ banking devices).
* Assume you’re already breached (monitor logs).
* Teach your family (or suffer their mistakes).
