# Home security gaps: a checklist

Using MITRE ATT&CK's four priority areas, here is a breakdown of where home defences commonly
have gaps, and what to do about them.

## Priority 1: Initial access (keeping attackers out)

### Router admin page left at defaults

Attack technique: Exploit Public-Facing Application (T1190)

Attackers scan for routers with default credentials and hijack them.

Fix:

* Change the default login (use a strong password).
* Disable remote admin access unless actively needed.

### Clicking urgent or unexpected links

Attack technique: Phishing (T1566)

One click can deliver malware or hand over credentials.

Fix:

* Install uBlock Origin (blocks malicious ads and redirects).
* Hover over links before clicking; check the destination URL.

### IoT devices sharing the same password

Attack technique: Default Credentials (T1078.001)

Botnets brute-force IoT devices using default or reused credentials.

Fix:

* Change default passwords on every connected device.
* Put IoT devices on a separate Wi-Fi network.

## Priority 2: Execution (stopping malware once in)

### Children or household members running with admin rights

Attack technique: Abuse Elevation Control (T1548)

Malware runs with whatever permissions the current user has.

Fix:

* Create a standard user account for daily use.
* Use Windows Sandbox or macOS Gatekeeper for unfamiliar downloads.

### Downloading cracked or unofficial software

Attack technique: Malicious File (T1204.002)

Pirated or unofficial apps are a common malware delivery mechanism.

Fix:

* Use VirusTotal to scan downloads before running them.

### Ignoring browser updates

Attack technique: Exploit Browser Engine (T1211)

Unpatched browsers are a primary drive-by download vector.

Fix:

* Enable auto-updates for the browser being used.
* Remove outdated plugins (Java, Flash, and similar).

## Priority 3: Persistence (removing attackers once in)

### Not checking running processes

Attack technique: Process Injection (T1055)

Malware hides within legitimate processes.

Fix:

* Use Task Manager (Windows) or Activity Monitor (Mac) to spot unusual activity.
* Run Malwarebytes for occasional scans.

### Backups left permanently connected

Attack technique: Data Encrypted for Impact (T1486)

Ransomware encrypts connected backups along with primary files.

Fix:

* Use the 3-2-1 rule: three copies, two formats, one offline.
* Test restoring from the backup.

### No monitoring of login attempts

Attack technique: Valid Accounts (T1078)

Attackers reuse stolen passwords from other breaches.

Fix:

* Enable login alerts for email and cloud accounts.
* Use a password manager to ensure unique passwords per service.

## Priority 4: Exfiltration (stopping data theft)

### Cloud sync uploading everything automatically

Attack technique: Automated Exfiltration (T1020)

Attackers target synced files once they have cloud account access.

Fix:

* Encrypt sensitive files before uploading (Cryptomator works well for this).
* Review sharing permissions in Drive or Dropbox.

### Email forwarding rules not being checked

Attack technique: Email Collection (T1114)

Attackers set forwarding rules to copy incoming email to themselves.

Fix:

* Check Gmail/Outlook rules for unrecognised filters.
* Use a hardware key or TOTP app for email MFA.

### Smart TV with an active microphone or camera

Attack technique: Audio/Video Capture (T1123/T1125)

Compromised devices can pass audio and video to attackers.

Fix:

* Cover cameras physically.
* Disable always-on voice assistants.

## Future considerations

| Threat                    | Preemptive response                                               |
|---------------------------|-------------------------------------------------------------------|
| AI-assisted phishing      | Use email aliases (SimpleLogin or similar) for different services |
| 5G IoT attacks            | Isolate smart devices on a VLAN                                   |
| Harvest-now/decrypt-later | Switch to Signal or ProtonMail for sensitive communications       |

## Checklist

* MFA on email, router admin, and cloud accounts
* Network segmentation: IoT on a separate network from computers and phones
* Assume accounts may already be compromised: monitor login history
* Review the above with other household members
