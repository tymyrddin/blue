# Configure sudo

Hardening runbook. Scopes administrative access so that compromising one account does not hand over the whole server. The goal is that each account can do what its holder needs and no more.

## When to run

On a new server during setup. On an existing server where admin accounts hold unrestricted sudo (`ALL=(ALL) ALL`). When a new person needs a specific subset of admin actions rather than full root.

## Risk

All sudo edits go through `visudo`, never a plain text editor. `visudo` checks syntax before saving. A broken `/etc/sudoers` saved directly can remove sudo for everyone, with no way to fix it short of recovery access.

```
sudo visudo
```

## Granting full admin access

On Ubuntu, members of the `sudo` group hold full admin rights. To add an account:

```
sudo usermod -aG sudo username
```

The `-a` is significant. Without it, the account is removed from its other groups.

Confirm what an account can do:

```
sudo -l -U username
```

`NOPASSWD: ALL` in the output means the account reaches root with no password prompt at all. This is worth removing even for a single-operator server: it turns any unattended terminal or stolen session into instant root.

## Scoping access to specific commands

For an account that only needs a defined set of actions, grant those commands rather than full root. In `visudo`:

```
Cmnd_Alias SERVICES = /bin/systemctl restart nginx, /bin/systemctl restart postfix
deployuser ALL=(ALL) SERVICES
```

`deployuser` can now restart those two services and nothing else.

## Two ways scoping leaks

Scoped sudo can be escaped if the allowed commands are not chosen carefully.

Shell escapes. Editors and pagers can launch a shell from inside themselves: `vim`, `vi`, `less`, `more`, `view`, `emacs`, `nmap`, `python`, `perl`. An account allowed to run any of these under sudo can reach a root shell through them. To allow editing one file safely, use `sudoedit`, which has no shell escape:

```
username ALL=(ALL) sudoedit /etc/ssh/sshd_config
```

User-owned scripts. A script the user can edit, granted sudo, can be rewritten to run anything:

```
fritz ALL=(ALL) /home/fritz/script.sh      # fritz can edit script.sh to contain anything
```

Move any sudo-granted script to a root-owned location the user cannot write to (`/usr/local/sbin`), owned by root, and grant sudo on the new path.

## Verify

```
sudo -l -U username
```

Confirm the listed commands match what the account is supposed to have. For a scoped account, confirm a command outside the scope is refused:

```
sudo -u username sudo cat /etc/shadow      # should be refused if not in scope
```

## Done

No account holds `NOPASSWD: ALL` unless deliberately chosen and documented. Scoped accounts hold only their intended commands. No allowed command offers a shell escape. No sudo-granted script is user-writable.

## Rollback

Sudoers changes take effect immediately on save. To undo, run `visudo` again and revert the lines. Keep one known-good full-admin account throughout, so a scoping mistake on another account does not lock out administration.

## Follow-up

- Pair with [disabling root](disable-root.md): scoped sudo plus no root login is the combination that limits a single compromised account.
- Review sudoers periodically as roles change. Stale grants accumulate.
