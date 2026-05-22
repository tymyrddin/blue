| ![Windows forensics](/_static/images/forensics-room-banner.png)
|:--:|
| [THM Room: Windows Forensics](https://tryhackme.com/room/windowsforensics1) |

# A Windows server

**What is the version and year of the Windows machine?**

Answer: `Windows Server 2016`

**Which user logged in last?**

| ![Windows last logon](/_static/images/last-logon.png)
|:--:|
| Answer: `Administrator` |

**When did John log onto the system last? Answer format: MM/DD/YYYY H:MM:SS AM/PM**

Answer: `03/02/2019 5:48:32 PM`

**What IP does the system connect to when it first starts?**

| ![Windows regedit](/_static/images/registry.png)
|:--:|
| Answer: `10.34.2.3`  |

**What two accounts had administrative privileges (other than the Administrator user)? Answer format: username1, username2**

| ![Windows computer management](/_static/images/computer-management.png)
|:--:|
| Answer: `Jenny,Guest`  |

**What is the name of the scheduled task that is malicious.**

| ![Windows task scheduler](/_static/images/tasksch.png)
|:--:|
| Answer: `Clean file system`  |

**What file was the task trying to run daily?**

Answer: `nc.ps1`

**What port did this file listen locally for?**

Answer: `1348`

**When did Jenny last logon?**

Answer: `Never`

**At what date did the compromise take place? Answer format: MM/DD/YYYY**

Answer: `03/02/2019`

**At what time did Windows first assign special privileges to a new logon? Answer format: MM/DD/YYYY HH:MM:SS AM/PM**

| ![Windows log filter](/_static/images/log-filter.png)
|:--:|
| Filter in Windows Security logs in a time frame and [event 4672](https://learn.microsoft.com/en-us/windows/security/threat-protection/auditing/event-4672) |

Then find the event using the hint: `00/00/0000 0:00:49 PM`

| ![Windows event](/_static/images/event.png)
|:--:|
| Answer: `03/02/2019 04:04:49 PM` |

**What tool was used to get Windows passwords?**

| ![Windows mimikatz](/_static/images/mimikatz.png)
|:--:|
| Answer: `Mimikatz` |

**What was the attackers external control and command servers IP?**

| ![Windows hosts](/_static/images/hosts.png)
|:--:|
| Answer: `76.32.97.132` |

**What was the extension name of the shell uploaded via the servers' website?**

| ![Windows shell](/_static/images/shell.png)
|:--:|
| Answer: `.jsp` |

**What was the last port the attacker opened?**

| ![Windows firewall inbound](/_static/images/port.png)
|:--:|
| Answer: `1337` |

**Check for DNS poisoning, what site was targeted?**

Answer: `google.com`
