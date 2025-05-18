# FireHOL

FireHOL (based on bash) makes it very simple to set up a complex firewall. 

## Installation 

On the backend server, install FireHOL for configuring [iptables](iptables.md).

    # apt-get install firehol

## Configuration (example)

    # vi /etc/firehol/firehol.conf

A configuration which only allows incoming [ssh](../encryption/ssh.md) connections and openvpn:

    interface eth0 inet
    client all accept                           // allow all outgoing connections
    server ssh accept                           // allow all incoming SSH connections
    server openvpn accept src "XXX.XXX.XXX.XXX XXX.XXX.XXX.XXX" // allow incoming OpenVPN connections
                                              //   from these designated addresses 
                                              //   NOTE: EDIT THE XXX.XXX.XXX.XXX ADDRESSES

    interface tun0 vpn                            
    server all accept                           // allow all incoming connections on the VPN 
    client all accept                           // allow all outgoing connections on the VPN

    router inet2vpn inface eth0 outface tun0
    route all accept                            // route freely to the VPN

    router vpn2inet inface tun0 outface eth0
    masquerade                                  // use NAT masquerading from the VPN
    route all accept                            // route freely to the VPN

