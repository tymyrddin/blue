# Auditing system services with systemctl

On Linux systems that come with `systemd`, the `systemctl` command is pretty much a universal command.

To view the status of services:

    sudo systemctl -t service --state=active

With:

* `-t service`: We want to view information about the services – or, what used to be called daemons – on the system.
* `--state=active`: This specifies that we want to view information about all the system services that are actually running.

This command shows the status of every service that's running on your system. Generally, you do not want to see much information, although you might at times.

## Candidates for removal

Depending on what the server is for:

* `smbd` and `nmbd` indicates a Samba Process. Do you really need to export smb share on windows or other machine?
* `telnet` for bidirectional interactive text-oriented communication over internet or local area network? 
* `rlogin` to log in to another host over network?
* `rexec` to execute shell commands on a remote computer.
* `ftp` to transfer files from one host to another host over Internet?
* `automount` to mount different file systems automatically to bring up network file system? 
* `named` to run NameServer (DNS)? 
* `lpd` to print to the server. 
* `inetd`? If you are running standalone applications like `ssh` which uses other standalone application like `mysql`, `Apache`, etc. then you don’t need inetd.
* `portmap`, an Open Network Computing Remote Procedure Call (ONC RPC) which uses `rpc.portmap` and `rpcbind`. If these processes are running, you are running NFS server. Really? NFS server is running unnoticed?

## Stop and disable

To stop a service, then prevent it from restarting at reboot:

    sudo systemctl stop <service>
    sudo systemctl disable <service>

Example:

    sudo systemctl stop smbd
    sudo systemctl disable smbd
