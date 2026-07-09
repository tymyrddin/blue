# Keeping everything updated

Most successful attacks exploit known vulnerabilities: flaws that have been documented, patched, and in many
cases publicly discussed. The gap between patch release and patch adoption is the window of greatest exposure.
Automatic updates close that gap without requiring active effort.

## Operating system

Windows:

* Win + I → Windows Update → enable "Get the latest updates as soon as they're available"
* Optional: Advanced options → "Receive updates for other Microsoft products"

macOS:

* System Settings → General → Software Update → toggle on "Automatically keep my Mac up to date"

Linux (Debian/Ubuntu):

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades  # Select "Yes"
```

Fedora:

```bash
sudo dnf install dnf-automatic
sudo systemctl enable --now dnf-automatic.timer
```

## Browsers

Chrome/Edge/Brave:

* Type `chrome://settings/help` and confirm the browser reads as up to date.
* On Windows, ensure the Google Update Service is running: `services.msc` → Enable "Google Update Service (gupdate)"

Firefox:

* `about:preferences#general` → scroll to "Firefox Updates" → select "Automatically install updates"

## Plugins and extensions

Java (if required):

* Control Panel → Java → Update tab → "Check for Updates Automatically"

Browser extensions:

* Chrome: `chrome://extensions` → toggle "Developer mode" → click "Update"
* Firefox updates extensions automatically by default.

## The manual check

A monthly calendar event to verify that updates have applied, and to catch anything that requires manual
approval, is worth adding. Batch-update tools like Patch My PC (Windows) or Homebrew (Mac) make it easier
to catch third-party applications that do not auto-update.
Last updated: 16 May 2026
