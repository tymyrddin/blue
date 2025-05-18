# Path of a common intruder

## Scenario
Assume an intruder gains access to the system through a vulnerability.

* Most likely, he/she wishes to gain elevated privileges in order to be able to take action, like install software, get user data that can possibly give access to other servers or systems, destroy or alter audit trails to hide tracks of having been there, etc. This can be done by installing malware (a rootkit) or manually. Assume he/she is successful. Note that there are more than zero users with uid=0 (superuser privileges)|
* Less likely but possible, the intruder creates a user without password. Note a new user has been created
* He or she will try to capture information of other computers on the same network (in particular users and passwords). This can be done with a sniffer. Note that a network interface is put into promiscuous mode. 
* Binaries of the sniffer, configuration files, captured information are usually hidden in the `/dev` directory. Note regular files appearing in `/dev`
* A somewhat more knowledgeable intruder will try to modify certain binaries of the system to conceal the indicators of their presence (`su` to not let on to elevated privileges, `ifconfig` to hide that the network interface is in promiscuous mode, `ls` to hide where their files are,`ps` to conceal the execution of the sniffer, find, netstat, top, etc). FIA's can detect these alterations

## Important events for reconstructing an attack
* Logging off and logging in (location)  
* User and group management (changes in permissions and ability to gain access) 
* Security policy changes  
* Shutdowns and restarts  

System changes:
* Changes to the operating system (hardware and/or software events, configuration changes)
* Changes to hardware configuration
* Device driver installation
* Starting and stopping of services

Applications:
* Many utilities send messages to application related logs
* Exceptions to this are web servers and FTP servers (have their own logging mechanisms, but can be included in `syslog`)

Accounts and group record changes:
* Creation, deletion and modification of users
* Modifications to groups

