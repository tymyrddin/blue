# Auditing network services with nmap

To remotely audit the network and see what services are running on each host without logging in to each one, a tool like `nmap` is needed. Nmap is available for all major operating systems, including Windows. The version in Linux repositories is usually somewhat old; on systems other than Kali, you can [download nmap](https://nmap.org/download.html) directly.

    sudo nmap -sS IP_ADDRESS

* `-sS`: The lowercase s denotes the scan type. The uppercase `S` denotes a `SYN` packet scan. 
* `IP_ADDRESS`: scanning a single machine or a group of machines or an entire network.
* Something like `Not shown: 996 closed ports`: showing closed ports rather than filtered ports indicates no firewall on the machine.

## Port states

An Nmap scan will show the target machine's ports in one of three states:

* `filtered`: This means that the port is blocked by a firewall.
* `open`: This means that the port is not blocked by a firewall and that the service that is associated with that port is running.
* `closed`: This means that the port is not blocked by a firewall, and that the service that is associated with that port is not running.

## Scan types

There are lots of different scanning options, each with its own purpose. The SYN packet
scan is considered a stealthy type of scan because it generates less network traffic and
fewer system log entries than certain other types of scans. With this type of scan, Nmap
sends a SYN packet to a port on the target machine, as if it were trying to create a TCP
connection. If the target machine responds with a SYN/ACK packet, it means the port is in
an open state and is ready to create the TCP connection. If the target machine responds
with an RST packet, it means the port is in a closed state. If there is no response at all,
it means the port is filtered by a firewall. This is one of the most common scan types for
routine network auditing.

A discovery scan is useful for when you need to just see what devices are on the network:

    sudo nmap -sn IP_ADDRESS/24

With the `-sn` option, nmap will detect whether the scan targets a local subnet or a
remote subnet. If the subnet is local, nmap will send out an Address Resolution Protocol
(ARP) broadcast that requests the IPv4 addresses of every device on the subnet. ARP is not
blocked by firewalls, making this a reliable discovery method.

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

VNC is comparable to Microsoft's Remote Desktop service, but free and open source. It is also an unencrypted protocol, meaning all traffic crosses the network in plain text. If VNC is required, running it through an SSH tunnel is worth the extra step.
