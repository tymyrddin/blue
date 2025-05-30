# I am really not batman

A Big corporate organisation Wayne Enterprises has recently faced a cyber-attack where the attackers broke into their 
network, found their way to their web server, and have successfully defaced their website 
`http://www.imreallynotbatman.com`. 

|                                  ![Defaced](/_static/images/defaced.png)                                  |
|:--------------------------------------------------------------------------------------------------------------:|
| Their website is now showing the trademark of the attackers with the message <br>`YOUR SITE HAS BEEN DEFACED`. |

They have requested "us" to join them as a Security Analyst and help them investigate this cyberattack and find the 
root cause and all the attackers' activities within their network.

The good thing is, that they have Splunk already in place, so we have got all the event logs related to the attacker's 
activities captured. We need to explore the records and find how the attack got into their network and what actions 
they performed.

Log sources available to us: 

* `wineventlog` (Windows Event logs)
* `winRegistry` (logs related to registry creation/modification/deletion etc.)
* `XmlWinEventLog` (sysmon event logs)
* `fortigate_utm` (Fortinet Firewall logs)
* `iis` (IIS web server logs)
* `Nessus:scan` (results from the Nessus vulnerability scanner)  
* `Suricata` (details of the alerts from the Suricata IDS)
* `stream:http` (network flow related to http traffic)
* `stream: DNS` (network flow related to DNS traffic)
* `stream:icmp` (network flow related to icmp traffic)

## Cyber Kill Chain

A cyberattack in which the attacker defaced an organisation's website. This organisation has Splunk as a SIEM 
solution setup. Our task as a Security Analysis would be to investigate this cyberattack and map the attacker's 
activities into all 7 of the Cyber Kill Chain Phases. 

|                                                                         ![Cyber Kill Chain](/_static/images/ckc.png)                                                                         |
|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| We do not need to follow the sequence of the cyber kill chain during the investigation. <br>One finding in one phase will lead to another finding that <br>may have mapped into some other phase. |

This Investigation comes under the Detection and Analysis phase.