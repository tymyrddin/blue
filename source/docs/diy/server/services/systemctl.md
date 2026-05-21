# Auditing system services with systemctl

On Linux systems that come with `systemd`, the `systemctl` command is pretty much a universal command.

To view the status of services:

    sudo systemctl -t service --state=active

With:

* `-t service`: We want to view information about the services (or, what used to be called daemons) on the system.
* `--state=active`: This specifies that we want to view information about all the system services that are actually running.

This command shows the status of every service that's running on your system. Generally, you do not want to see much information, although you might at times.

## Candidates for removal

Depending on what the server is for:

* `smbd` and `nmbd`: a Samba process. Consider whether SMB share export is actually needed.
* `telnet`: unencrypted bidirectional communication; superseded by SSH in nearly all cases.
* `rlogin`: unauthenticated remote login; superseded by SSH.
* `rexec`: remote shell command execution; superseded by SSH.
* `ftp`: unencrypted file transfer; SFTP or FTPS are the current alternatives.
* `automount`: automatic filesystem mounting for NFS; worth disabling if NFS is not in use.
* `named`: a DNS nameserver. Unnecessary on most servers unless the host is serving DNS.
* `lpd`: a print daemon; rarely needed on headless servers.
* `inetd`: a super-server for running standalone services on demand; unnecessary if the services it would wrap are running as their own daemons.
* `portmap` / `rpcbind`: ONC RPC support, required for NFS. Its presence indicates an NFS server is running.

## Stop and disable

To stop a service, then prevent it from restarting at reboot:

    sudo systemctl stop <service>
    sudo systemctl disable <service>

Example:

    sudo systemctl stop smbd
    sudo systemctl disable smbd
