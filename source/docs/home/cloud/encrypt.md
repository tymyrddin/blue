# Encrypt cloud files before uploading

Storing files in the cloud (Google Drive, Dropbox, iCloud, etc.) exposes them to potential breaches, government 
requests, or insider access. Encrypting files locally before uploading ensures only you can read them. And not only 
when in the cloud. Your tax returns don’t need to be bedtime reading for hackers.

## Best tool@Home: Cryptomator (Free & Open-Source)

### Pros

* End-to-end encryption (E2EE) for cloud storage.
* Works with Google Drive, Dropbox, OneDrive, etc.
* Open-source (audited for security).
* Creates encrypted "vaults" that sync like normal folders.

### How to use

* [Download Cryptomator (Windows/macOS/Linux/Android/iOS)](https://cryptomator.org/).
* Create a new vault (encrypted folder) inside your cloud sync folder (e.g., Google Drive).
* Set a strong password (never store it in the cloud!).
* Move sensitive files into the vault—they auto-encrypt before syncing.
* Only you can open the vault with your password.

### Note

* Filenames inside the vault are also encrypted (unlike some other tools).
* If you lose the password, files are permanently inaccessible.

## Alternative encryption tools

1. Boxcryptor (Freemium)

* Works like Cryptomator but has a paid version for teams.
* Supports zero-knowledge encryption for Dropbox, Google Drive, etc.

2. Veracrypt (Advanced Users)

* Creates encrypted containers (like a virtual encrypted hard drive).
* Better for large, static files (not ideal for frequent syncing).

3. Rclone Crypt (Command Line)

* Encrypts files before syncing to cloud storage.
* Best for tech-savvy users (requires CLI knowledge).

4. 7-Zip / PeaZip (AES-256 Encryption)

* Compress + encrypt files before uploading.
* Downside: Manual process (not automatic like Cryptomator).

## What files to encrypt?

Always Encrypt:

* Personal documents (tax returns, passports, contracts)
* Financial records (bank statements, invoices)
* Medical records
* Private photos/videos
* Business secrets

Avoid encrypting shared files (unless recipients have the key).

## Extra security for Cloud Storage

* Enable 2FA on your cloud account.
* Use a strong password (not reused elsewhere).
* Audit connected apps (revoke unused third-party access).
* Check file-sharing links (disable old/public shares).

## Tool recommendations

* For most users: Cryptomator (easiest + secure).
* For teams: Boxcryptor (paid, but user-friendly).
* For techies: Rclone Crypt or Veracrypt.