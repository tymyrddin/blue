# NFTables

Available upstream since Linux kernel 3.13.

## Basic idea

Got an idea! Working on it ... **Warning: untested!**

    flush ruleset

    table inet filter {

        set inet filter tcp_port_out { type inet_service; 
            elements = { 
                53,    # DNS
                11371, # OpenPGP HTTP Keyserver
                2200,  # SSH
                80,    # HTTP
                443,   # HTTPS
            }
        }
        
        set inet filter tcp_port_in { type inet_service; 
            elements = { 
                2200,  # SSH
            }
        }
        
        set inet filter udp_port_out { type inet_service;  
            elements = { 
                53,    # DNS
                123,   # NTP
            }
        }
        
        set inet filter udp_port_in { type inet_service; 
            elements = {
            }
        }
        
        set inet filter user_out { type uid;      
            elements = {
            }
        }
        
        set inet filter user_in { type uid;        
            elements = {
            }
        }
        
        set tcp_scan_ports { type inet_service; 
            elements = {
                22,    # SSH
                23,    # Telnet
                1433,  # MS SQL Login
                8080,  # HTTP Alternate
                50661, # Apple Xsan   
            }
        }
        
        set udp_scan_ports { type inet_service; 
            elements = {
                53,    # DNS
                5060,  # SIP
                53413, # Netis backdoor
            }
        }

        chain base_checks {
            # allow established/related connections
            ct state {established, related} accept
            # early drop of invalid connections
            ct state invalid log prefix "Invalid " drop
        }
        
        chain input {
            type filter hook input priority 0; 

            # Accept on localhost
            iifname lo accept
            jump base_checks
            
            # Accept neighbour discovery
            ip6 nexthdr icmpv6 icmpv6 type { nd-neighbor-solicit,  nd-router-advert, \
            nd-neighbor-advert } accept
            
            # Accept ping
            ip protocol icmp type { echo-request } accept
            
            # Allow IGMP
            ip protocol igmp accept
            
            tcp  dport @tcp_port_in ct state new accept
            udp  dport @udp_port_in ct state new accept
            meta skuid @user_in ct state new accept
            
            tcp dport @tcp_scan_ports drop
            udp dport @udp_scan_ports drop
            
            # Count and drop any other traffic
            counter log prefix "Drop_in " drop
        }
        
        # Not a gateway. We do not forward. 
        chain forward {
            type filter hook forward priority 0; policy drop;       
            jump base_checks
        }
        
        chain output {
            type filter hook output priority 0; 
            
            # Accept from localhost
            oifname lo accept
            jump base_checks
            
            # Accept neighbour discovery
            ip6 nexthdr icmpv6 icmpv6 type { nd-neighbor-solicit,  nd-router-advert, \
            nd-neighbor-advert } accept

            # Accept ping
            ip protocol icmp type { echo-request } accept

            tcp  dport @tcp_port_out ct state new accept
            udp  dport @udp_port_out ct state new accept
            meta skuid @user_out ct state new accept
            
            # Count and drop any other traffic
            counter log prefix "Drop_out " drop    
        }

## kernel

    [*] Networking support  --->
        Networking options  --->
            [*] Network packet filtering framework (Netfilter)  --->
                Core Netfilter Configuration  --->
                    <M> Netfilter nf_tables support
                    <M>   Netfilter nf_tables conntrack module
                    <M>   Netfilter nf_tables counter module
                    <M>   Netfilter nf_tables log module
                    <M>   Netfilter nf_tables limit module
                    <M>   Netfilter nf_tables masquerade support
                    <M>   Netfilter nf_tables nat module
                IP: Netfilter Configuration  --->
                    <M> IPv4 nf_tables support
                    <M>   IPv4 nf_tables route chain support
                    <M> IPv4 packet rejection
                    <M> IPv4 NAT
                    <M>   IPv4 nf_tables nat chain support
                    <M>   IPv4 masquerade support
                    <M>   IPv4 masquerading support for nf_tables
              
## Configuration files

* Create a main table, for example
    * A file `/etc/nftables/main_config.conf` where elements can be added
    * A file `/etc/nftables/main.conf` with a skeleton inet table
* Set up the activation scripts
    * `/etc/nftables.conf` as startup script (flushes rule set)
    * `/etc/nftables/reload_main.conf` as reload script (deletes table)

## SSHguard

To integrate with [SSHguard](sshguard.md), edit `/etc/sshguard.conf` and change the value of `BACKEND`:

    BACKEND="/usr/lib/sshguard/sshg-fw-nft-sets"

When starting or enabling the `sshguard.service`, two new tables named sshguard in the ip and ip6 address families are 
added which filter incoming traffic through sshguard's list of IP addresses. The chains in the sshguard table have a 
priority of -10 and will be processed before other rules of lower priority.

