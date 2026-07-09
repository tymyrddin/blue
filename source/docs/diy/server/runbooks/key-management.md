# SSH key setup and rotation

Operational runbook. Covers generating an SSH key, installing it on a server, and rotating it when it may have been exposed or when someone leaves. Rotation, not setup, is the part most teams skip.

## When to run

Setup: when a new person or service needs server access. Rotation: when a private key may have been exposed (laptop lost, key found in a repository, departure of a team member), and on a periodic basis for long-lived service keys.

## Generating a key

```
ssh-keygen -t ed25519 -C "name@organisation"
```

This creates `~/.ssh/id_ed25519` (private) and `~/.ssh/id_ed25519.pub` (public). Ed25519 is shorter and faster than RSA and secure for current use.

Set a passphrase when prompted. A private key with no passphrase grants access to every host that trusts it to anyone who copies the file. Store the passphrase in a password manager.

## Installing the public key

On a server that already allows access, append the new public key without disturbing existing ones:

```
ssh-copy-id -i ~/.ssh/id_ed25519.pub adminuser@server-address
```

On a fresh server where access is set up out of band, the public key goes into `~/.ssh/authorized_keys` for the account, with permissions `600` on the file and `700` on `~/.ssh`.

### Risk

Copying a key with `scp` directly onto `authorized_keys` overwrites every existing key on the server. Use `ssh-copy-id` or an append (`cat >>`) on any server with other keys in place.

## Verify

```
ssh -i ~/.ssh/id_ed25519 adminuser@server-address
```

A successful login confirms the key is installed.

## Rotation

The safe order: add the new key, confirm it works, then remove the old one. Removing first risks lockout.

1. Generate a new key pair (as above).
2. Install the new public key on every server the old one reached.
3. Confirm login with the new key on each server.
4. Remove the old public key from each `authorized_keys` file.
5. Confirm the old key is now rejected:
   ```
   ssh -i ~/.ssh/old_key adminuser@server-address     # should be refused
   ```

Rotation that stops before step 4 is not rotation. The old key still works.

## Done

New key logs in on every required server. Old key removed from all `authorized_keys` files and confirmed rejected.

## Rollback

If the new key fails on a server during rotation, the old key is still in place until step 4, so access is retained. Investigate the new key's installation before removing the old one.

## Follow-up

- A changed host key on the next connection produces a verification warning. See [SSH authentication error](ssh-auth-error.md).
- Record which keys exist and who holds them, so [offboarding](../../access/runbooks/offboarding.md) can revoke them.
