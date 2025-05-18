# OpenVPN

## Installation

    # apt-get install openvpn

## Server configuration

The sample server configuration file that comes with OpenVPN is a good starting point. It will create a VPN using a virtual `tun` network interface (for routing), will listen for client connections on `udp` port `1194`, and distribute virtual addresses to connecting clients from the `10.8.0.0/24` subnet.

    # cd /etc/openvpn/server
    # cp /usr/share/openvpn/examples/server.conf .
    # vi /etc/openvpn/server/server.conf

* The server will start as root, but for security, can be set to drop to lower privileges after startup, by removing the semicolons (uncommenting) the `user nobody` and `group nogroup` directives.
* Also uncomment out the `client-to-client` directive if you want clients to not only be able to reach the server over VPN (the default), but also each other. 
* Set the `ca`, `cert`, `key`, and `dh` parameters in the config file to point to the files generated in the [PKI setup](../pki/internal-pki.md).
* If you have set the DH key size to 2048 instead of the default 1024, change `dh dh1024.pem` accordingly.
* For assigning the different clients static IP addresses from the OpenVPN server, uncomment `client-config-dir ccd`
* Enabling compression is not recommended; it opens the server up to the VORACLE attack vector.
* It is recommended to use OpenVPN over UDP, because TCP over TCP is a bad idea.

Write and quit.

### Assign static IP addresses 

Create the client configuration directory:

    # mkdir /etc/openvpn/ccd

For each client, create a configuration file assigning it to a static IP address. For example:

In `/etc/openvpn/ccd/<clientname1>`
    ifconfig-push 10.8.0.5 10.8.0.6

The first client will use 10.8.0.6 as its IP address, and 10.8.0.5 is the VPN tunnel endpoint. The second address is only used to route traffic through the tunnel. This is because each client uses a CIDR/30 network. Per client 4 IP addresses are used.

In `/etc/openvpn/ccd/<clientname2>`
    ifconfig-push 10.8.0.9 10.8.0.10

And in `/etc/openvpn/ccd/<clientname3>`
    ifconfig-push 10.8.0.13 10.8.0.14

To use a virtual IP address range other than `10.8.0.0/24`, modify the `server` directive. Mind that the virtual IP address range must be a private range currently unused on the network.

### Firewall server 

Limit the incoming OpenVPN connections to the IP addresses of the servers you want the backend server to connect with in the firewall.

### Start the OpenVPN server 

    # systemctl openvpn start

## Client configurations

On a client: Copy the example client configuration file

    # cd /etc/openvpn/client/
    # cp /usr/share/openvpn/examples/client.conf .
    # vi /etc/openvpn/client.conf

Make changes:

* Add the address of the OpenVPN server to the configuration file: Look for `remote my-server-1 1194` and change `my-server-1` into the IP address of the server.
* Look for `cert client.crt` and `key client.key` and change them to the names of the keys that were copied over.

### Firewall client 

Punch a hole for the server address in your firewall.

### Fire it up! 

    # systemctl openvpn start

