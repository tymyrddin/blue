# Running without administrator rights

Most people use their computer as an administrator all day. This feels natural because it
removes friction: software installs without prompting, settings change without a password,
nothing stops you from doing what you want to do.

The same frictionlessness applies to malware. Any malicious software that executes on the
machine inherits whatever permissions the logged-in account has. Running as a standard user
does not prevent compromise, but it limits what a successful attack can do: installing
persistent services, modifying system files, and accessing other users' data all require
elevation. The attacker has to ask for it, which is the point.

The practical objection is real: switching to a standard account means supplying an
administrator password more often. This is, on reflection, not a terrible outcome. The
prompt is the system working as intended.

## Windows

Create a separate administrator account and demote your daily-use account to standard:

1. Settings → Accounts → Family & other users
2. Select your daily account → Change account type → Standard User
3. Confirm the administrator account still exists and has a distinct password

Also check that User Account Control (UAC) is set to the maximum level: search for "UAC" in
the Start menu and set it to "Always notify."

Process Explorer from Microsoft's Sysinternals suite shows the privilege level of each
running process and is worth having for investigation purposes.

## Mac

Create a standard account for daily use:

1. System Settings → Users & Groups → click + → Standard
2. Log in as that account for regular work
3. Keep the administrator account for software installation and system changes

The administrator account password is requested whenever a standard user attempts a
privileged operation. This is the intended behaviour.

## Linux

Create a standard user account:

```bash
sudo adduser [username]
```

The new account has no sudo access by default. Elevation requires supplying the password of
an account that does have it. For systems where you are the only user and occasionally need
sudo, this workflow is essentially the same as it was before, with an explicit step added.

On systems using `sudo`, periodic review of `/etc/sudoers` or the `sudo` group membership is
worth doing, as software installation sometimes adds accounts to the sudo group without
announcement.
