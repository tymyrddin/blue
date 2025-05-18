# FirewallD

FirewallD uses the concepts of zones and services, instead of [IPTables](iptables.md) chain and rules. As of CentOS version 7, FirewallD replaces IPTables as the default firewall management tool.

FirewallD can be configured and managed using the `firewall-cmd` command line utility. 

## Install and enable FirewallD

If not installed on the system, install with

    # yum install firewalld

Firewalld is disabled by default. Check status with:

    # firewall-cmd --state

Start and enable it on boot

    # systemctl start firewalld
    # systemctl enable firewalld

## Zones

Zones are predefined sets of rules specifying what traffic should be allowed based on the level of trust on the networks a computer is connected to. Network interfaces and sources can be assigned to a zone. From untrusted to trusted:

| Zones | Meaning |
|:---- | :---- |
|`drop` |All incoming connections are dropped without any notification. Only outgoing connections are allowed.|
|`block` |All incoming connections are rejected with an `icmp-host-prohibited` message for IPv4 and `icmp6-adm-prohibited` for IPv6n. Only outgoing connections are allowed. |
|`public` |For use in untrusted public areas. Do not trust other computers on the network but allow selected incoming connections. |
|`external` |For use on external networks with NAT masquerading enabled - system acts as a gateway or router. Only selected incoming connections are allowed. |
|`internal` |For use on internal networks - system acts as a gateway or router. Other systems on the network are generally trusted. Only selected incoming connections are allowed. |
|`dmz` |Used for computers in a demilitarized zone, giving limited access to the rest of the network. Only selected incoming connections are allowed. |
|`work` |Used for work machines. Other computers on the network are generally trusted. Only selected incoming connections are allowed. |
|`home` |Used for home machines. Other computers on the network are generally trusted. Only selected incoming connections are allowed. |
|`trusted` |All network connections are accepted. Trust all of the computers in the network. |

The public zone is set as a default zone

    # firewall-cmd --get-default-zone

Check what zones are used by network interface(s)

    # firewall-cmd --get-active-zones

Print zone configuration settings

    # firewall-cmd --zone=public --list-all

Configuration of all zones

    # firewall-cmd --list-all-zones

Changing zone of an interface

    # firewall-cmd --zone=work --change-interface=eth1

## Ports and services

Listing all default available services (`/usr/lib/firewalld/services/` contains xml files with details for each service):

    # firewall-cmd --get-services

Allow incoming HTTP traffic (port 80) for interfaces in the public zone, only for the current session (runtime configuration)

    # firewall-cmd --zone=public --add-service=http

To keep the port open after reboot use the `--permanent` flag

    # firewall-cmd --permanent --zone=public --add-service=http

Forward traffic from one port to another on the same server

    # firewall-cmd --zone=external --add-forward-port=port=80:proto=tcp:toport=8080

## Creating rulesets

The `dmz` (demilitarized) zone only allows SSH traffic. To change the default zone to `dmz` and to assign it to the `eth0` interface

    # firewall-cmd --set-default-zone=dmz
    # firewall-cmd --zone=dmz --add-interface=eth0

To open HTTP and HTTPS ports add permanent service rules to the dmz zone

    # firewall-cmd --permanent --zone=dmz --add-service=http
    # firewall-cmd --permanent --zone=dmz --add-service=https

Start building the firewall! 

## Usage examples
###  OpenVPN

When using the default port 1194, enable the openvpn service. Otherwise, create a new service with a different port.

    # firewall-cmd --zone=public --add-service openvpn

To add masquerade to the zone:

    # firewall-cmd --zone=server --add-masquerade

Make changes permanent:

    # firewall-cmd --runtime-to-permanent

### SMTP

    # firewall-cmd --permanent --add-service=smtp success

## Disable FirewallD

Stop the FirewallD service

    # systemctl stop firewalld

Disable it to start automatically on system boot

    # systemctl disable firewalld

Mask it to prevent it from being started by other services

    # systemctl mask --now firewalld
