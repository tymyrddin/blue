# Remove admin rights for daily use

Why? Letting everyone run as admin is like giving a toddler a steak knife.

## How-to

Windows:

* Settings → Accounts → Family & other users → Add someone else → Standard User
* Enable UAC (User Account Control) at max setting (the "ARE YOU SURE?" popup).

Mac:

* System Settings → Users & Groups → Click + → Standard
* Tip: Set admin account to require password for every sudo command.

Linux:

* `sudo adduser [username]` → Congrats, they’re not root!