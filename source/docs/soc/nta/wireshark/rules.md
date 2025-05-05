# Firewall rules

Wireshark is mostly, but not only about packet details; it facilitates the creation of firewall rules with the 
"Tools -> Firewall ACL Rules" menu. This will open a new window and provide a combination of rules (IP, port and MAC 
address-based) for different purposes. These rules are generated for implementation on an outside firewall interface.

Currently, Wireshark can create rules for:

* Netfilter (iptables)
* Cisco IOS (standard/extended)
* IP Filter (ipfilter)
* IPFirewall (ipfw)
* Packet filter (pf)
* Windows Firewall (netsh new/old format)

## Questions

Use the `Desktop/exercise-pcaps/bonus/Bonus-exercise.pcap` file.

**Select packet number `99`. Create a rule for `IPFirewall` (`ipfw`). What is the rule for `denying source IPv4 address`?**

    add deny ip from 10.121.70.151 to any in

**Select packet number `231`. Create `IPFirewall` rules. What is the rule for `allowing destination MAC address`?**

    add allow MAC 00:d0:59:aa:af:80 any in