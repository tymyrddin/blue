# How to auto-update everything (2025 Edition)

TL;DR: Automatic updates = the digital equivalent of eating your veggies. Boring, but it keeps you alive.

## Operating system (The "Stop Ignoring Me" setup)

Windows:

* Press Win + I → Windows Update → Turn on "Get the latest updates as soon as they're available"
* (Optional) Enable "Advanced options" → "Receive updates for other Microsoft products"

macOS:

* System Settings → General → Software Update → Toggle on "Automatically keep my Mac up to date"
* (For power users) sudo softwareupdate --schedule on in Terminal

Linux (Debian/Ubuntu):

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades  # Select "Yes"
```

For Fedora:

```bash
sudo dnf install dnf-automatic
sudo systemctl enable --now dnf-automatic.timer
```

## Browsers (Where 90% of attacks happen)

Chrome/Edge/Brave:

* Type `chrome://settings/help` → Ensure it reads "Google Chrome is up to date"
* (Force auto-update) Windows: `services.msc` → Enable "Google Update Service (gupdate)"

Firefox:

* `about:preferences#general` → Scroll to "Firefox Updates" → Select "Automatically install updates"

## Plugins & extensions (The hidden risks)

Java (If you must):

* Control Panel → Java → Update tab → Check "Check for Updates Automatically"
* (Better yet) `sudo apt remove openjdk-*` on Linux

Browser extensions:

* Chrome: `chrome://extensions` → Toggle "Developer mode" → Check "Update"
* Firefox: Extensions auto-update by default (a thing it does right)

## The "Remind Me Later" tax

Microsoft found that 60% of breaches exploit vulnerabilities where a patch existed but wasn’t installed (Source).

Tip:

* Set a monthly calendar reminder titled "Pretend to Care About Updates"
* Or use tools like Patch My PC (Windows) or Homebrew (Mac) to batch-update everything

## Why this matters in 2025

* AI-powered attacks now exploit unpatched systems within hours of a vulnerability dropping
* The "Oops, I forgot" era is over, attackers have automation. Your defences should too.

 