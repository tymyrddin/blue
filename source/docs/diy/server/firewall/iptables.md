# iptables

`iptables` is **not** the name of Linux's firewall. It is just one way of interacting with `netfilter` which every Linux distribution comes with.

As such, `iptables` is a command line utility for configuring the Linux kernel firewall implemented within the Netfilter project. And it gets complex rather quickly which increases the risk of making mistakes. 

* For a bare metal server running only a dedicated application, such as a Schleuder list, `iptables` is the simplest (and minimalistic) choice. 
* For Ubuntu, it comes with the Uncomplicated Firewall (`ufw`), which is an easy-to-use frontend for iptables.
* As of CentOS version 7, [FirewallD](firewalld.md) replaces `iptables` as default.

## The four components of iptables

`iptables` has 4 different components to it that all come together to give the utility its overall functionality:

* Filter table - offers the basic protection that you'd expect a firewall to provide
* Network Address Translation table - connects the public interwebs to the private networks
* Mangle table - for mangling them packets as they go through the firewall
* Security table - only used by SELinux

## Install and enable IPTables

In case it is not installed and you wish to install it:

    # yum install iptables-services

Start the service:

    # systemctl start iptables
    # systemctl start iptables6

Enable automatic start on system boot

    # systemctl enable iptables
    # systemctl enable iptables6

Check iptables service status

    # systemctl status iptables
    # systemctl status iptables6

## Chains

* `INPUT` - packets coming into the firewall
* `FORWARD` - packets routed to another NIC on the network; for packets on the local network that are being forwarded on.
* `OUTPUT` - packets going out of the firewall

## Rules 

### Status command

To list rules `-L` showing interface name, rule options, TOS masks, packet and byte counters `-n`, and IP address and port in numeric format without using DNS to resolve names `-v`:
    
    # iptables -L -n -v

With line numbers (important for deleting or inserting new rules into the firewall):

    # iptables -n -L -v --line-numbers

To display INPUT or OUTPUT chain rules:

    # iptables -L INPUT -n -v
    # iptables -L OUTPUT -n -v --line-numbers

### Deleting a rule

To delete line number 4 using -D to delete one or more rules from the selected chain:

    # iptables -D INPUT 4

### Inserting a rule 

    # iptables -L INPUT -n --line-numbers
    Chain INPUT (policy DROP)
    num  target     prot opt source               destination
    1    DROP       all  --  xxx.xxx.xxx.1        0.0.0.0/0
    2    ACCEPT     all  --  0.0.0.0/0            0.0.0.0/0           state NEW,ESTABLISHED 

Inserting a rule between 1 and 2:

    # iptables -I INPUT 2 -s xxx.xxx.xxx.2 -j DROP

Gives:

    # iptables -L INPUT -n --line-numbers
    Chain INPUT (policy DROP)
    num  target     prot opt source               destination
    1    DROP       all  --  xxx.xxx.xxx.1        0.0.0.0/0
    2    DROP       all  --  xxx.xxx.xxx.2        0.0.0.0/0
    3    ACCEPT     all  --  0.0.0.0/0            0.0.0.0/0           state NEW,ESTABLISHED

### Saving the rules

For saving the rules so they can be loaded at every reboot (you need to have iptables-persistent installed)

    # iptables-save > /etc/iptables/rules.v4
    # ip6tables-save > /etc/iptables/rules.v6

### Stop/Restart

Some distros like CentOS have installed a service called `iptables` to start and stop the firewall and a configuration file to configure it. For all other distros, `iptables` is a command, not a service.

If you edited the configuration file manually, you have to reload iptables.

Or load it directly through iptables:

    # iptables-restore < /etc/iptables/iptables.rules

## Usage

To deny all incoming and allow all outgoing connections ON A BARE METAL MACHINE where you have ACCESS TO THE CONSOLE:

    # Set default chain policies
    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT ACCEPT

    # Accept on localhost
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A OUTPUT -o lo -j ACCEPT

    # Allow established sessions to receive traffic
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

### SSH

For SSH access (-I inserts it before all other rules in INPUT):

    # iptables -I INPUT -p tcp --dport 22 -j ACCEPT

If your SSH service is listening on another port, use that port instead of 22.

### OpenVPN

Create an iptables rule for NAT forwarding. An example (assuming the interface to forward to is named eth0):

    # iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE

If the server cannot be pinged through the VPN, [rules to open up TUN/TAP interfaces](https://community.openvpn.net/openvpn/wiki/255-qconnection-initiated-with-xxxxq-but-i-cannot-ping-the-server-through-the-vpn) to all traffic may be needed:

    # iptables -A INPUT -i tun+ -j ACCEPT
    # iptables -A FORWARD -i tun+ -j ACCEPT
    # iptables -A INPUT -i tap+ -j ACCEPT
    # iptables -A FORWARD -i tap+ -j ACCEPT

Set up rules for accepting connections from the OpenVPN port (default 1194) and through the physical interface, and make the changes permanent.

### SMTP Secure Sockets Layer

With SMTP Secure Sockets Layer (SSL) enabled, allow connections to port 587 (similar for 465).

Add the rule for this port:

    # iptables -I INPUT 2 -p tcp --dport 587 -j ACCEPT

Add the POP and IMAP ports and their secure counterparts:

    # iptables -I INPUT 3 -p tcp --dport 110 -j ACCEPT
    # iptables -I INPUT 4 -p tcp --dport 143 -j ACCEPT
    # iptables -I INPUT 5 -p tcp --dport 993 -j ACCEPT
    # iptables -I INPUT 6 -p tcp --dport 995 -j ACCEPT

Save the iptables rules and restart iptables.
