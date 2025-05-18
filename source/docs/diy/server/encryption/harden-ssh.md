# Harden ssh server

## Configuration file 
Changes to the `/etc/ssh/sshd_config` file:

* Root access: Root access has `prohibit-password` set by default. Deactivate using the root account (change `PermitRootLogin   prohibit-password` to `PermitRootLogin no`). There’s a configurationless workaround, by logging in as an ordinary user and becoming root with:

    $ su -

* Get rid of passwords: Use SSH keys authentication instead of passwords and deactivate using passwords for authentication (`PasswordAuthentication no`) in the config file.
* Limit access: Only allow login by certain users or groups (users and groups). This does not improve security directly but in some cases helps in resisting a brute force attack a little longer.
* Set a custom SSH port: By default, `ssh` listens on port 22, which is widely known among attackers and security tools/port scanners that launch brute force attacks against it. Though security by obscurity (which is no security), it does help eliminate a lot of noise on port 22. Change it in the config file and close port 22 and punch a hole for the new port in the firewall. Choose a port not in use by another service (woops)
* Disable X11 forwarding: As admins we are unlikely to use graphic tools, and the X11 protocol was never built with security in mind. It can be used by adversaries to open up a channel to the client and send remote commands. Change `X11Forwarding yes` to `X11Forwarding no` in the config file.

After changing the `/etc/ssh/sshd_config` file, restart the ssh server with `$ sudo systemctl restart ssh` for changes to take effect.

## Additional security 
* Use of TCP wrappers: Only do this when all needing access to a server have a static IP address. For example, not on a jump host, but when using `nc` and routing tables with ProxyCommand for the servers one can jump to from the jump host. TCP wrappers can be made by using two files: `/etc/hosts.allow` and `/etc/hosts.deny`
  * Append `ALL:ALL` to `/etc/hosts.deny` to deny all connections from unknown hosts.
  * Append `sshd : XXX.XXX.XXX.XXX` to `/etc/hosts.allow` for each IP address you wish to allow.
* Use [fail2ban](../firewall/fail2ban.md) for automatically blacklisting IPs (attempting to brute force the SSH server) with the help of a firewall.
