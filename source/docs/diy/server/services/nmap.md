# Auditing network services with nmap

To remotely aud* the network to see what services are running on each host, without having to log in to each one, you need a tool like `nmap`. * is available for all the major operating systems, including Windows. The version that's in the Linux repositories is usually quite old. So, if you're using something other than Kali, your can [download nmap](https://nmap.org/download.html).

    sudo nmap -sS IP_ADDRESS

* `-sS`: The lowercase s denotes the type of scan that we want to do. The uppercase `S` denotes that we're doing a `SYN` packet scan. 
* `IP_ADDRESS`: scanning a single machine or a group of machines or an entire network.
* Something like `Not shown: 996 closed ports`: The fact that it's showing all of these closed
ports instead of filtered ports tells me that there's no firewall on this machine.

## Port states

An Nmap scan will show the target machine's ports in one of three states:

* `filtered`: This means that the port is blocked by a firewall.
* `open`: This means that the port is not blocked by a firewall and that the service that's associated with that port is running.
* `closed`: This means that the port is not blocked by a firewall, and that the service that's associated with that port is not running.

## Scan types

There are lots of different scanning options, each with its own purpose. The SYN packet
scan that we're using here is considered a stealthy type of scan because * generates less
network traffic and fewer system log entries than certain other types of scans. With this
type of scan, Nmap sends a SYN packet to a port on the target machine, as if * were trying
to create a TCP connection to that machine. If the target machine responds with a
SYN/ACK packet, * means that the port is in an open state and is ready to create the TCP
connection. If the target machine responds with an RST packet, * means that the port is in a
closed state. If there's no response at all, * means that the port is filtered, blocked by a
firewall. As a normal Linux administrator, this is one of the types of scans that you would
do most of the time.

A discovery scan is useful for when you need to just see what devices are on the network:

    sudo nmap -sn IP_ADDRESS/24

With the `-sn` option, nmap will detect whether you're scanning the local subnet or a
remote subnet. If the subnet is local, nmap will send out an Address Resolution Protocol
(ARP) broadcast that requests the IPv4 addresses of every device on the subnet. That is a
reliable way of discovering devices because ARP isn't something that will ever be blocked
by a firewall.

    sudo nmap -A IP_ADDRESS

This scan:

* identifies `open`, `closed`, and `filtered` TCP ports.
* identifies the `version` of the running services.
* runs a set of vulnerability scanning scripts that come with nmap.
* attempts to identify the operating system of the target host.

```text
5900/tcp open vnc Apple remote desktop vnc
| vnc-info:
| Protocol version: 3.889
| Security types:
|_ Mac OS X security type (30)
1 service unrecognized despite returning data. If you know the
service/version, please submit the following fingerprint at
http://www.insecure.org/cgi-bin/servicefp-submit.cgi :
SF-Port515-TCP:V=6.47%I=7%D=12/24%Time=5A40479E%P=x86_64-suse-linux-gnu%r(
SF:GetRequest,1,"\x01");
MAC Address: 00:0A:95:8B:E0:C0 (Apple)
Device type: general purpose
```

VNC can be handy at times. It's like Microsoft's Remote Desktop service for Windows,
except that it's free, open source software. But it's also a security problem because it's an
unencrypted protocol. So, all your information goes across the network in plain text. If you
must use VNC, run it through an SSH tunnel.
