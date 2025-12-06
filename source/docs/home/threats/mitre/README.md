# The Attackers’ menu

Hackers follow patterns. MITRE ATT&CK breaks these into tactics and techniques, like a burglar’s step-by-step guide to 
raiding your digital pantry. Here’s what matters most @Home in 2025:

## Priority #1: Initial access (How they get in)

* Phishing (T1566) – Fake emails/texts ("Your Netflix account is expired! Click here!").
* Exploit Public-Facing Apps (T1190) – Your router’s admin page, that old NAS box, or your smart toothbrush’s unpatched API.
* Supply Chain Compromise (T1195) – That "free" app you downloaded? Congrats, it’s malware.

Fix:

* Enable MFA everywhere (even if it’s annoying and reportedly hackable).
* Update everything (yes, even the creepy smart mirror).
* Stop clicking "urgent" links (unless you enjoy ransomware).

## Priority #2: Execution (What they do once inside)

* Command-Line Interface (T1059) – Hackers love abusing curl/PowerShell to download malware.
* Malicious Scripts (T1059.003) – That "cute" screensaver from a forum? Oops, it’s a keylogger.

Fix:

* Restrict admin rights (your kid doesn’t need sudo access).
* Use an ad-blocker (to stop "malvertising" drive-by downloads).

## Priority #3: Persistence (How they stay inside)

* Scheduled Tasks (T1053) – Malware that wakes up every Tuesday to steal your banking info.
* Browser Extensions (T1176) – That "free PDF converter" you installed? It’s reading your Gmail.

Fix:

* Audit browser extensions (delete anything sketchy).
* Check running processes (Task Manager is your friend).

## Priority #4: Exfiltration (How they steal your data)

* Cloud Storage (T1537) – Hackers love auto-syncing your "Documents" folder to their server.
* Email Forwarding Rules (T1114) – Ever found weird rules in your Gmail? That’s how they spy.

Fix:

* Encrypt sensitive files (even if it’s just cat pics).
* Check email filters (hackers love hiding their tracks).

## The "Gap Analysis" (Where You’re Screwed)

Compare your current setup to MITRE’s attack list. The gaps are your To-Do list.

Example Gaps (and How to Fix Them)

| Gap	| How to Fix (2025 Edition) |
|-------|---------------------------|
| No MFA on router	| Enable it. Now. Or rename your Wi-Fi "HackMePlease." |
| Outdated smart TV	| Throw it out. Or disconnect it. Your choice. |
| All family devices share one admin account	| Stop. Just stop. |

## The "2025 threat forecast" (What’s coming?)

* AI-Powered Phishing (T1566.002) – Scams so personalised, they’ll know your dog’s name.
* Ransomware for Smart Homes (T1486) – Hackers locking your thermostat until you pay.
* 5G IoT Botnets (T1583.002) – Your fridge DDoSing a bank for fun.

### Future-proofing

* Segment your network (IoT devices on a guest Wi-Fi).
* Assume everything is hostile (because it probably is).

## Final verdict: What to focus on in 2025?

* MFA Everywhere (or get hacked).
* Update All the Things (yes, even the "dumb" coffee maker).
* Assume Phishing Will Get You (train your family like they’re corporate employees).
* Isolate IoT Devices (unless you want your Roomba spying on you).
