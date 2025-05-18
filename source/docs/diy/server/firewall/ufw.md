# UFW

`ufw` is a program for managing a `netfilter` firewall with ease. It uses a command-line interface consisting of a small number of simple commands.

## Installation

On the backend server, install Uncomplicated Firewall (UFW) for configuring iptables. 

    # apt-get install ufw

## Control
Start and enable:

    # systemctl start ufw
    # systemctl enable ufw

## Usage

To deny all incoming and allow all outgoing connections:

    # ufw default allow outgoing
    # default deny incoming

### SSH 

    # ufw allow ssh/tcp

Or if you have changed port:

    # ufw allow <port>/tcp

### Nginx HTTP

    # ufw allow 'Nginx HTTP'

### Nginx HTTPS 

To allow HTTPS traffic, allow the Nginx Full profile and delete the redundant Nginx HTTP profile allowance:

    # ufw allow 'Nginx Full'
    # ufw delete allow 'Nginx HTTP'

### Logging 

    # ufw logging on

### OpenVPN 

For openvpn:

    # vi /etc/default/ufw

To allow ufw forwarding (VPN) traffic, append: 

    DEFAULT_FORWARD_POLICY="ACCEPT"

Write and quit.

Change `/etc/ufw/before.rules`:

    # NAT (Network Address Translation) table rules
    *nat
    :POSTROUTING ACCEPT [0:0]

    # Allow traffic from clients to the interface
    -A POSTROUTING -s 10.8.0.0/24 -o interface -j MASQUERADE

    # Optionally duplicate this line for each subnet if your setup requires it
    -A POSTROUTING -s 10.8.1.0/24 -o interface -j MASQUERADE

    # do not delete the "COMMIT" line or the NAT table rules above will not be processed
    COMMIT

    # Don't delete these required lines, otherwise there will be errors
    *filter
    ...

Write and quit.

Open the chosen openvpn port (default 1194/udp):

    # ufw allow 1194/udp

Reload/restart ufw:

    # ufw reload
