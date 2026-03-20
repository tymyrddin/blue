# Port mirroring setup

Runbook for configuring Hetzner network traffic mirroring so that the NSM instance receives a copy of all traffic on the production private network. Without mirroring, Zeek and Suricata see only traffic to and from `nsm.golemtrust.am` itself, which is not useful. This is the plumbing that makes the rest of the network monitoring work.

## How Hetzner traffic mirroring works

Hetzner does not offer traditional SPAN port mirroring at the hypervisor level. The approach used here is a software-based mirror using iptables on each production server, combined with a GRE tunnel to the NSM instance. Each server copies its traffic into a GRE tunnel addressed to `nsm.golemtrust.am`, which receives all copies on a GRE interface and presents them to Zeek and Suricata on `eth1`.

This approach has two limitations compared to hardware mirroring: it adds a small amount of CPU overhead on each mirrored server, and it only captures traffic that passes through the kernel network stack (most application traffic). Raw socket traffic and traffic between containers on the same host is not captured at the GRE level. For the current architecture, where all services communicate across distinct instances on the private network, this covers the relevant traffic.

## GRE tunnel configuration on the NSM instance

On `nsm.golemtrust.am`, create a GRE interface that will receive mirrored traffic from all production servers. The GRE interface becomes `eth1`, the monitoring interface that Zeek and Suricata read from.

Install the `gre` kernel module:

```
modprobe ip_gre
echo ip_gre >> /etc/modules
```

Create the GRE interface. The `local` address is the NSM instance's private IP; the `remote` address is `any`, meaning it accepts GRE packets from any source:

```
ip tunnel add gre-mirror mode gre local 10.0.3.1 remote any ttl 64
ip link set gre-mirror up promisc on
```

To make this persistent, create `/etc/network/interfaces.d/gre-mirror`:

```
auto gre-mirror
iface gre-mirror inet manual
  pre-up ip tunnel add gre-mirror mode gre local 10.0.3.1 remote any ttl 64 || true
  up ip link set $IFACE promisc on
  up ip link set $IFACE up
  down ip link set $IFACE promisc off
  down ip link set $IFACE down
  post-down ip tunnel del gre-mirror || true
```

Update `/opt/zeek/etc/node.cfg` to use `gre-mirror` as the monitoring interface rather than `eth1`, and update the Suricata `af-packet` interface setting to `gre-mirror` as well. Restart both services after this change.

## Traffic mirroring on each production server

On each server that should be monitored (all production instances), configure iptables to copy outgoing and incoming traffic into a GRE tunnel to the NSM instance.

Install the `xt_TEE` iptables extension:

```
apt install -y iptables-persistent
modprobe xt_TEE
echo xt_TEE >> /etc/modules
```

Add the mirroring rules. These copy all traffic to and from the server to the NSM instance via GRE. The `TEE` target sends a copy without affecting the original packet:

```
iptables -t mangle -A PREROUTING -j TEE --gateway 10.0.3.1
iptables -t mangle -A POSTROUTING -j TEE --gateway 10.0.3.1
```

Save the rules so they persist across reboots:

```
netfilter-persistent save
```

Repeat on every production server: `auth.golemtrust.am`, `db.golemtrust.am`, `graylog-1`, `graylog-2`, `graylog-3`, `vault-1`, `vault-2`, `vault-3`.

Do not add mirroring rules to `nsm.golemtrust.am` itself; mirroring the monitoring instance's traffic to itself creates a loop.

## Firewall rules for GRE

The Hetzner firewall for `nsm.golemtrust.am` must permit inbound GRE (protocol 47) from all production server private IPs. GRE is a protocol, not a port; configure the rule accordingly:

- Protocol: 47 (GRE)
- Source: `10.0.0.0/8`
- Destination: `10.0.3.1`
- Action: allow

Production servers need no additional firewall rules for mirroring; they originate the GRE traffic.

## Verifying traffic arrival

On `nsm.golemtrust.am`, watch the GRE interface for traffic:

```
tcpdump -i gre-mirror -c 100 -n
```

You should see packets from multiple source IPs within seconds. If the interface is quiet, check that the iptables TEE rules are present on the production servers:

```
iptables -t mangle -L -n | grep TEE
```

And that the GRE tunnel is up:

```
ip tunnel show gre-mirror
ip link show gre-mirror
```

If `ip tunnel show` returns nothing, the tunnel was not created; check `/etc/network/interfaces.d/gre-mirror` and run `ifup gre-mirror` manually.

## Traffic volume considerations

The TEE target doubles the network traffic on each production server's interface: every packet is sent once normally and once into the GRE tunnel. At current traffic volumes (primarily internal API calls and database queries), this is well within the bandwidth limits of the Hetzner private network. Review if traffic-intensive operations such as large backup transfers are routed through the private network, as these would double in apparent interface utilisation.

The NSM instance receives the aggregate of all mirrored traffic. A CX41 instance with 1Gbps private network bandwidth is adequate for current scale.

## Mirroring encrypted traffic

GRE mirrors the raw packets including encrypted TLS traffic. Zeek and Suricata cannot decrypt TLS but can extract useful metadata: the server certificate's subject and issuer, the TLS version and cipher suite negotiated, the SNI (server name indication), and the size and timing of the encrypted session. This is sufficient for most detection purposes. If full content inspection of internal TLS traffic is required, a different approach (such as a TLS-terminating proxy) would be needed, which is out of scope for the current deployment.
