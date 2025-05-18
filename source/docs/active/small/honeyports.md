# Honeyports

Honeyports are used for air gapped/high security networks when IDS IPS technologies fail at detecting attackers communicating with open ports over normal protocols (SMB, SSH, HTTP, and HTTPS). 

Some Next-Gen firewalls already have some of these detection capabilities, but many do not. And most IPS/IDS technologies are still blind at detecting 0-day attacks. 

As a solution, honeyports can be set up to trigger an alert and/or create a dynamic blacklist entry. They can be run them from the command line, and as Python, PowerShell, and Ruby scripts.

## How it works

Create a listening port on an otherwise real but non-important server. Use ports that are favourite for remote attacks, like telnet or ssh. The services need not actually be installed. Listen on the port using honeyports.

Most pentesters, redteamers and adversaries start with reconnaissance. When an attacker runs a recon scan, sees this open port and tries to communicate, the IP can be automatically blocked, thereby blocking all further actions.

Check out the portspoof tool. A port scan will take ages and becomes utterly meaningless with every port responding that it is up and running some service. Scanning tools will try to enumerate those services by running additional checks, over ***`65536`*** ports.

## Resources

* [Active Defense, Offensive Countermeasures, and Cyber Deception](https://www.blackhillsinfosec.com/wp-content/uploads/2020/04/Training_ActiveDefence_CyberDeception_April2020.pdf), John Strand, Bryce Galbraith and Paul Asadoorian, 2020
* [Github: gchetrick/honeyports](https://github.com/gchetrick/honeyports)
* [Github pages: portspoof](https://drk1wi.github.io/portspoof/)

