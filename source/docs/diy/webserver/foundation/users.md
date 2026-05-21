# Create non-root users

Running a web server as root means a successful exploit against the server process also yields root access to the host. Distributions generally avoid this by default: Apache and Nginx run their worker processes as `www-data` (or a similar unprivileged account) on a fresh install. The configuration is worth verifying rather than assuming.

## Verifying the process user

```bash
ps aux | grep -E 'apache2|nginx' | grep -v root | head
```

The master process may run as root to bind to privileged ports. Worker processes handling requests usually run as `www-data`. If workers appear as root, check the `User` and `Group` directives in `nginx.conf` or `apache2.conf`.

## Admin accounts

Direct root login via SSH is worth disabling. A named account with sudo access is the usual alternative:

```bash
adduser adminuser
usermod -aG sudo adminuser
```

Limiting sudo to specific commands reduces the blast radius of a compromised account. Create a file in `/etc/sudoers.d/`:

```
adminuser ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx, /usr/sbin/nginx -t
```

The `NOPASSWD` flag is convenient for scripted reloads but bypasses the password check. A setup that relies on sudo as an audit trail may prefer omitting it.

## File ownership

Static web content owned by root and readable by `www-data` prevents the server process from overwriting its own files if compromised:

```bash
chown -R root:www-data /var/www/html
chmod -R 755 /var/www/html
```

Upload directories, where the server process needs write access, are a separate case:

```bash
chown -R www-data:www-data /var/www/uploads
chmod 750 /var/www/uploads
```

Keeping the upload directory outside the web root, or behind a separate location block, limits the impact if an attacker uploads and triggers an executable file.

## SSH hardening

In `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
AllowUsers adminuser
```

Generate a key pair locally and install the public key on the server:

```bash
ssh-keygen -t ed25519
ssh-copy-id adminuser@server
```

Reload:

```bash
systemctl reload ssh
```

Disabling password authentication before confirming that key-based login works risks a lockout. Testing the key connection in a second terminal while the current session is still open is the usual way to avoid that.
