# Install Gophish

## Prerequisites

- A Linux VM. Ubuntu 22.04 LTS is adequate. 2 vCPUs and 2 GB RAM are sufficient for
  a session of up to twenty participants.
- Outbound SMTP access from the VM, or a local Postfix installation.
- A sandbox domain or subdomain for the sending profile. Do not use the Home's
  production domain. Register a dedicated lookalike domain for the purpose and
  decommission it after each cohort.

## Steps

1. Download the latest [Gophish](https://getgophish.com/) release from the project's GitHub releases page.
2. Verify the SHA256 checksum against the value published on the releases page.
3. Extract the archive:

   ```
   tar -xzf gophish-*.tar.gz -C /opt/gophish/
   ```

4. Create a dedicated system user with no login shell:

   ```
   useradd -r -s /usr/sbin/nologin gophish
   ```

5. Set ownership:

   ```
   chown -R gophish:gophish /opt/gophish/
   ```

6. Edit `/opt/gophish/config.json`. Set the following values:

   ```json
   {
     "admin_server": {
       "listen_url": "0.0.0.0:3333",
       "use_tls": false
     },
     "phish_server": {
       "listen_url": "0.0.0.0:80"
     }
   }
   ```

   The admin interface listens on port 3333. Restrict this port to the display machine's
   IP address only using the firewall. The phishing server listens on port 80 for
   participant workstations.

7. Create a systemd service unit at `/etc/systemd/system/gophish.service`:

   ```
   [Unit]
   Description=Gophish phishing simulation
   After=network.target

   [Service]
   Type=simple
   User=gophish
   WorkingDirectory=/opt/gophish
   ExecStart=/opt/gophish/gophish
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

8. Enable and start the service:

   ```
   systemctl daemon-reload
   systemctl enable gophish
   systemctl start gophish
   ```

9. Check the logs to confirm both interfaces are listening:

   ```
   journalctl -u gophish -f
   ```

## First login

1. Open a browser and navigate to `http://<VM-IP>:3333`.
2. Log in with username `admin` and the temporary password printed in the startup log.
3. Change the password immediately on first login.

## Firewall

Restrict port 3333 to the display machine's IP address. Port 80 should be reachable from
participant workstations and the sandbox inbox but not from the internet.
