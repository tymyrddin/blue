# Scanning downloads with VirusTotal

VirusTotal submits a file or URL to over 60 antivirus engines simultaneously and reports what each one
detects. It is worth using before running any downloaded file that came from an unfamiliar source.

## How to use it

1. Go to [virustotal.com](https://www.virustotal.com/) (no account required).
2. Upload the file or paste a download URL.
3. Wait for results and read the report:
   * 0 detections: likely clean, but context matters.
   * 1-3 detections: worth caution, could be a false positive, but there is no cost to not running the file.
   * 4 or more detections: do not run it.

## Additional scanning options

Right-click scanning (Windows/Mac/Linux):

* Install [VirusTotal Desktop](https://docs.virustotal.com/docs/desktop-apps) for right-click integration with the file manager.

Browser extension:

* [VT4Browsers](https://blog.virustotal.com/2022/03/vt4browsers-any-indicator-every-detail.html) scans links and downloads before they reach the device.

Hash check (for files already downloaded):

* Get the SHA256 hash: `certutil -hashfile filename.exe SHA256` (Windows)
* Paste the hash into VirusTotal's search bar. Known malware samples have records regardless of filename.

## Interpreting results

* "Undetected" but suspicious behaviour: check the Behaviour tab for network connections or file system activity.
* "Heuristic" flags indicate the engine considers the behaviour malware-like without a specific signature match.
* "PUA" (Potentially Unwanted Application) typically means adware or bundled software.

A clean VirusTotal result on a new file does not guarantee safety: very recent malware may have no detection
signatures yet. The behaviour tab and the source of the download are both relevant.
