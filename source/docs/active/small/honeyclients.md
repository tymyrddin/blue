# Honeyclients

For most honeypots to work, we have to wait for the attacker to attack the honeypot from a remote location. A phishing e-mail arrives in an inbox, the user clicks and allows the remote malware to activate on the device and allows it to callback over TCP port 80 (which is allowed by most firewalls).

This ignores that most attacks are nowadays client-side. Drive-by downloads overtook file attachment phishing as the major means of initial access. 

Enter client-side honeypots (honeyclients), to track and analyse these types of attacks.

## How it works

A honeyclient mimics, either manually or automatically, the normal series of steps a regular user would make when visiting websites. It can be fully patched or be left vulnerable. The idea is to identify malware hosts, and possibly even gather so-called attribution information.

 In high interaction honeyclients, the system is analysed after the interaction with the malicious server has happened and the session is terminated. If there is a change in any of the files or a new file appeared in the system, the server is marked as malicious.

Low interaction honeyclients are better performers than the high interaction versions. Analysis is in real-time, but can miss detecting an ongoing attack, and are also easy to detect by adversaries who can in return exploit them.

[Thug](https://github.com/buffer/thug) is a Python low-interaction honeyclient aimed at mimicing the behaviour of a web browser in order to detect and emulate malicious contents. It is actively being developed and fits our home context purposes. Time for a project! :)

DroidCollector looks awesome but is not available to the public yet.

## Resources

* [Escape from Monkey Island: Evading High-Interaction Honeyclients](https://sites.cs.ucsb.edu/~chris/research/doc/dimva11_honey.pdf) (pdf)
* [DroidCollector: A High Performance Framework for High Quality Android Traffic Collection](http://loci.ujn.edu.cn/htdocs/pdf/2016-C-DroidCollector%20A%20High%20Performance%20Framework%20for%20High%20Quality%20Android%20Traffic%20Collection.pdf) (pdf)
* [DroidCollector Framework](http://loci.ujn.edu.cn/htdocs/DroidCollector/index.html)

