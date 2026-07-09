# DNS-level blocking with Pi-hole

Per-device or per-app blocking of tracking and advertising domains is an ongoing task. DNS-level
blocking handles it in one place: a local DNS server that intercepts queries to known tracking
domains before the device can reach them. Every device on the network benefits, including those
that do not support ad-blocking extensions.

Pi-hole is an open-source implementation of this approach. It runs on a Raspberry Pi, a spare
machine, or a small virtual machine, and acts as the DNS resolver for the household network.
Queries to blocked domains return nothing; everything else resolves normally.

## Setup

Install Pi-hole on the host machine:

```bash
curl -sSL https://install.pi-hole.net | bash
```

Follow the prompts. At the DNS server selection step, choose an upstream resolver (Cloudflare
1.1.1.1 or Quad9 9.9.9.9 are common choices for privacy reasons).

Set Pi-hole as the primary DNS server in the router's DHCP settings. The IP address to use is
the Pi-hole machine's local address (for example 192.168.1.100; check the Pi-hole install output
for the actual address).

## Adding blocklists

Pi-hole ships with a default blocklist. Additional domain lists targeting smart TV and IoT
tracking endpoints are available through the Pi-hole admin interface at Group Management →
Blocklists. The Pi-hole documentation and community maintain curated recommendations for
maintained lists.

Once DNS requests from a smart TV or IoT device are resolving through Pi-hole, the query log
shows which domains those devices are contacting. This is often the first time a household
discovers the volume of outbound traffic from devices that appear to be sitting idle.

## What it does not do

DNS blocking intercepts known bad domains. It does not inspect encrypted traffic, catch
newly-registered domains not yet in any list, or block tracking embedded within first-party
domains. It is one layer. Combined with network segmentation for IoT
devices, it substantially reduces the outbound tracking surface.
Last updated: 10 July 2026
