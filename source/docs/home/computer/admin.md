# Remove admin rights for daily use

Running as an administrator for everyday tasks means any malware that executes inherits those permissions.
A standard user account limits the damage a successful attack can do.

## How-to

Windows:

* Settings → Accounts → Family & other users → Add someone else → Standard User
* Enable UAC (User Account Control) at the maximum setting

Mac:

* System Settings → Users & Groups → click + → Standard
* Set the admin account to require a password for every sudo command

Linux:

* `sudo adduser [username]` creates a standard user without root access
