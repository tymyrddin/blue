# Centralised logging

## Why?

* Makes searching through log data for relevant events easier and faster, especially important when the infrastructure uses separation and isolation and there are multiple servers. This makes troubleshooting and solving issues easier and faster, and without directly accessing systems. 
* Logs are backed up in a separate location, protecting them from accidental or unintentional loss, and are accessible in case one of the servers goes down or becomes unresponsive.
* Not using computing resources for complex searches on internet facing servers.
* Depending on how it is set up, reduces the amount of disk space used by log files.

## Why not?

* Uses bandwidth. 

## How?

* Set up a separate server for only logging purposes.
* Keep it in a secure location behind a (physical) firewall.
* Have no unnecessary services running on it.
* Delete all other user accounts.

## Which one?

Rsyslog (default installed on debian) and syslog-ng are both light-weight. The configuration syntax of ''rsyslog'' is simpler than the syntax of ''syslog-ng'', but complex configuration is more clear in ''syslog-ng''. 

## Future considerations

To protect from intentional tampering with logs (intruder deleting indicators of presence):
* Add another server, a snort box (IDS) that is actually another central server (yet has no IP address) and copy each packet intended for the already existing central server. 
  * Promiscuous mode
  * Rule: Only listen for this IP address on this port (of existing central server)

