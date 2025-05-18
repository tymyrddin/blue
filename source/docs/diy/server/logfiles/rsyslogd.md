# Syslog

The rsyslogd service is a system utility providing support for message logging. Support of both internet and unix domain sockets enables this utility to be used for remote and local logging. [Rsyslog](https://www.rsyslog.com/) is a multi-threaded implementation of syslogd. It is by default installed on Ubuntu, Debian, OpenSUSE and CentOS, next to systemd's journald.

* A combined audit system for linux
* Allows for local and remote log collection. Remote logging makes day-to-day maintenance and incident response easier, log storage more secure, auditing more effective and analysis easier across multiple platforms.
* Allows for a single point of management 
* Controlled per device in `/etc/syslog.conf`
* All reported messages are collected in a message file
* Log replication can copy the audit data to multiple remote-logging hosts
* It is recommended to also setup logrotate and compression.

## Setting it up

* Set up a separate server for only logging purposes.
* Keep it in a secure location behind a (physical) firewall.
* Have no unnecessary services running on it.
* Delete all other user accounts.
* Add two snort boxes (IDS) that are actually syslog servers (yet have no IP address) and copy each packet intended for syslog server. With two boxes doing that independently from one another, court cases can be very convincingly supported. **Thank you, Dean Bushmiller, that is a very, very good idea**.
  * Promiscuous mode
  * Rule: Only listen for this IP address on this port (of syslog server)

## Server

### Installation 
    
    # apt install rsyslog

Start the service, enable it to auto-start at boot and check status:

    # systemctl start rsyslog
    # systemctl enable rsyslog
    # systemctl status rsyslog

### Configuration 

Configuring `rsyslog` involves setting up input sources (where rsyslog receives logs), and destination rules for where and how logs are written. Rsyslog uses RainerScript for its configuration syntax.

    # vi /etc/rsyslog.conf

By default, `rsyslog` uses the imjournal (importing structured log messages from systemd journal) and imusock modules (accepting syslog messages from applications running on the local system via Unix sockets). To configure it as a network and central logging server, the protocol (either UDP or TCP or both) it will use for remote syslog reception and the port it listens on must be configured.

    $ModLoad imudp
    $UDPServerRun <port>

    $ModLoad imtcp
    $InputTCPServerRun <port>

Define the `# rules for processing the remote logs`. There be [Templates](https://www.rsyslog.com/doc/v8-stable/configuration/templates.html).

    $template RemoteLogs,"/var/log/remote/%HOSTNAME%/%PROGRAMNAME%.log"
    *.* ?RemoteLogs 
    & ~

* Gather and write the received remote messages to distinct logs under `/var/log/remote/`, based on the hostname client machine name and remote client application that generated the messages as defined in the RemoteLogs template.
* Record messages from all applications at all severity levels using the RemoteLogs template configuration.
* Stop processing the messages once it is written to a file. If not set, it would be written to the local files.

OR for example, for allowing all hosts (but not applications) in a subnet XXX.XXX.XXX.XXX/24 to log to the machine, using only UDP.

    $ModLoad imudp
    $UDPServerRun <port>
    $AllowedSender UDP, XXX.XXX.XXX.XXX/24

    $template RemoteStore, "/var/log/remote/%HOSTNAME%/%timegenerated:1:10:date-rfc3339%"
    :source, !isequal, "localhost" -?RemoteStore
    :source, isequal, "last" ~

Write and quit. Restart `rsyslog` daemon:

    # systemctl restart rsyslog

## Clients

Install `rsyslog`, and edit `/etc/rsyslog.conf`:

    *.*   @XXX.XXX.XXX.XXX:<port>

## Configuration resources 

* [rsyslog](https://www.rsyslog.com/)
* [Configuring remote syslog from Unix/Linux and BSD/macOS](https://help.papertrailapp.com/kb/configuration/configuring-remote-syslog-from-unixlinux-and-bsdos-x/)
* [Configuring remote syslog from Windows](https://help.papertrailapp.com/kb/configuration/configuring-remote-syslog-from-windows/)

