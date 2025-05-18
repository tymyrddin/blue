# Port spoofing

Scanning software usually tries to determine a service that is running on an open port to identify port numbers on which you are running your services on a system. For delaying reconnaissance phase, spoof all ports to seem to be  open and emulate valid services on every port. Any attackers port scan results will become fairly meaningless and it will require hours of effort to accurately identify which ports have real services and which do not.

[Portspoof](https://github.com/drk1wi/portspoof) is a tool that is meant to be a lightweight, fast, portable and secure addition to any firewall system or security system. Techniques used by Portspoof:

* All configured TCP ports are always open: returns `SYN+ACK` for every connection attempt making it difficult to determine if a valid software is listening on a particular port and impractical to use stealth.
* Every open TCP port emulates a valid services: It has a huge dynamic service signature database, that will be used to generate responses to your adversaries scanning software service probes. Portspoof will respond to every service probe with a valid service signature, that is dynamically generated based on a service signature regular expression database.

Portspoof can also be used as an Exploitation Framework Frontend, turning your system into a responsive and aggressive 
machine for exploiting your attackers’ tools and exploits. Some example exploits can be found in the configuration 
file `portspoof.conf`.

Limitations: An attacker can still determine if a service is emulated by using a protocol probe (for 65k open ports)

