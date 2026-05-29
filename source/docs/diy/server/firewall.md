# Firewalls

Every Linux distribution includes the netfilter kernel subsystem as the underlying firewall engine. What differs between tools is the interface to that engine: iptables, nftables, ufw, and firewalld all ultimately configure netfilter rules. The choice of tool is a question of syntax and management model, not of underlying capability.

## The tools

nftables is the current interface, available since kernel 3.13 and the default on Debian 10+, Ubuntu 20.04+, and RHEL 8+. It replaces iptables with a unified syntax covering IPv4 and IPv6 in a single ruleset. New deployments on recent distributions are best served by nftables.

iptables is the legacy interface, still functional and extensively documented, but being replaced by nftables. On distributions where iptables commands are still used, they are often translated to nftables rules underneath.

ufw (Uncomplicated Firewall) is a frontend for iptables or nftables with simpler syntax. The Ubuntu default. Appropriate for servers with straightforward needs: allow these ports, deny everything else. The simplicity is also its limit; complex multi-table rules are awkward in ufw.

firewalld is the default on RHEL, CentOS, and Fedora. It uses a zone-based model: network interfaces and traffic sources are assigned to zones with different trust levels. More flexible than ufw when a server has multiple network interfaces or distinct network segments.

pf is the BSD firewall, available on FreeBSD, OpenBSD, and macOS. Different rule syntax from the Linux tools; it is the right choice on those platforms.

## Firewall scope

A firewall controls which connections are permitted to reach services on the server. It limits the attack surface to the services explicitly allowed.

A firewall that permits SSH does not prevent an attacker from logging in with valid credentials. A firewall that permits 443 does not prevent exploitation of a vulnerability in the web application behind it. The firewall closes the exposure on ports it blocks; what happens on ports it permits is outside its scope.

Service minimisation is the complement. A service that is not running cannot be exploited regardless of firewall rules. The combination of restricting inbound access and running only what is needed is more effective than either alone.

## Egress filtering

Most firewall configurations restrict inbound connections and allow all outbound traffic. This addresses only half the perimeter. A compromised service establishing an outbound reverse shell, exfiltrating data to an external endpoint, or scanning internal network ranges does all of that through outbound connections the inbound-only firewall ignores.

Explicit egress rules that permit only what each service legitimately requires close this. A web server with no reason to initiate connections to arbitrary external hosts cannot do so under a scoped egress policy. The discipline is worth applying on servers holding sensitive data or that could be used as a pivot into a wider internal network.

## The Docker complication

Docker modifies iptables rules automatically to handle container port publishing and does so before the configured firewall is fully accounted for. Docker-published ports may be reachable from the network even when firewall rules appear to block them, because Docker inserts its rules before the INPUT chain that ufw and standard iptables configurations manage.

On servers running Docker, the firewall state visible in `iptables -L -n` or `ufw status` may not reflect what is actually reachable. Checking `iptables -t nat -L -n` surfaces the Docker NAT rules. The [container stack](../containers/stack.md) covers this in more detail.
