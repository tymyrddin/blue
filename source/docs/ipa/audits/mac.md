# Checking Mac computers for spyware or remote access

Macs have a reputation for being secure — but if an abuser had physical access, or if someone clicked on a dodgy 
link, that security can be bypassed. This guide helps you spot common red flags without needing to be a tech expert.

---

## 1. Run Malwarebytes from a USB stick

Yes, Malwarebytes works on Macs too — and it’s a solid first step if you think something’s wrong.

**Before you begin:**

* Use a safe, trusted computer to download **Malwarebytes for Mac** and copy the `.pkg` installer onto a USB stick.

**Steps:**

1. Plug the USB into the Mac.
2. Open **Finder**, click on the USB drive, and double-click the Malwarebytes installer.
3. Follow the prompts to install it. (It’s OK to install on a Mac unless you have reason to think the system is severely compromised.)
4. Open Malwarebytes and run a **full system scan**.
5. If anything is detected, allow it to be **quarantined or removed**.

*You can uninstall Malwarebytes after scanning, if preferred, using the app’s own uninstaller.*

## 2. Look for remote access tools

Abusers sometimes use legitimate software (like screen sharing or remote desktop tools) to spy on survivors without them realising.

**To check for these tools:**

1. Go to **System Settings** (or **System Preferences**, depending on version).
2. Click **Privacy & Security** → **Screen Recording** and **Accessibility**.
3. See which apps are listed and whether any have permission to control or record the Mac.

Remove anything unfamiliar.

Next, check for actual remote control software:

1. Open **Finder**, click **Applications**.
2. Look for tools like:

   * **TeamViewer**
   * **AnyDesk**
   * **Chrome Remote Desktop**
   * **LogMeIn**
3. If you didn’t install them, **drag them to the Bin**.

*These apps can run quietly and reconnect the Mac to an abuser’s device any time it's online.*

## 3. Review login items and background tasks

Spyware can launch automatically each time the Mac starts up. Here’s how to check what’s being loaded behind the scenes.

**For newer macOS (Ventura and later):**

1. Open **System Settings**.
2. Go to **General** → **Login Items**.
3. Look under **Open at Login** and **Allow in Background**.

**For older macOS:**

1. Go to **System Preferences**.
2. Click **Users & Groups** → Your User → **Login Items**.

**What to look for:**

* Apps with odd names or ones you didn’t knowingly install
* Anything that sounds technical but isn’t recognisable (e.g., “syscleaner”, “helpertool”)

Click the **minus (-)** button or toggle to remove anything suspicious.

## 4. Check browser extensions

Safari and Chrome extensions can behave like spyware. They may log browsing history, capture passwords, or redirect to malicious websites.

**Safari:**

1. Open Safari.
2. Click **Safari** in the top menu → **Settings** (or **Preferences**).
3. Go to the **Extensions** tab.
4. Remove anything unfamiliar or unused.

**Chrome:**

1. Open Chrome.
2. Type `chrome://extensions` in the address bar.
3. Look through the list and click **Remove** on anything suspicious.

## 5. Look for unusual user accounts

Sometimes abusers set up hidden user accounts to access the machine remotely.

1. Open **System Settings** or **System Preferences**.
2. Go to **Users & Groups**.
3. Make sure only expected users are listed.
4. If you see accounts with names like “admin2” or “supportagent” — and you didn’t set them up — remove them or ask a trusted tech helper to investigate.

---

## Notes

Macs aren’t immune — especially if someone has had direct access. Many of the tools used in IPA contexts are designed to look harmless or even helpful. This check can uncover the subtle signs that something’s wrong.

If you're unsure about anything you’ve found, **don’t delete it immediately** — take a screenshot or write down the name. This could be useful evidence later.
