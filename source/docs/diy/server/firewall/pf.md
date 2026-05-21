# Packet filtering

PF is OpenBSD's packet filter, also available on FreeBSD. It runs in the kernel and is controlled
through `pfctl` via the `/dev/pf` pseudo-device. Rules are evaluated top to bottom; the last
matching rule wins by default, or `quick` exits immediately on match.

## Example ruleset

`/etc/pf.conf`:

```
# Macros
ext_if = "em0"

# Default policy: block everything
block all

# Skip filtering on loopback
set skip on lo

# Allow established/related connections
pass in quick on $ext_if proto tcp from any to any port { 22, 80, 443 } flags S/SA keep state
pass out all keep state

# Allow ICMP
pass in inet proto icmp all
pass out inet proto icmp all
```

Adjust port numbers to match the services running on the host. Remove ports not in use.

## Address tables

Named tables avoid repeating address lists:

```
table <bruteforce> persist
block quick from <bruteforce>

pass in quick on $ext_if proto tcp to any port 22 flags S/SA keep state \
    (max-src-conn 5, max-src-conn-rate 3/10, overload <bruteforce> flush global)
```

This blocks any source that opens more than 5 concurrent SSH connections or exceeds 3 per 10
seconds and adds it to the `<bruteforce>` table.

## pfctl commands

```bash
pfctl -f /etc/pf.conf   # reload rules
pfctl -e                 # enable PF
pfctl -d                 # disable PF
pfctl -sr                # show current rules
pfctl -ss                # show state table
pfctl -si                # show statistics
pfctl -t bruteforce -T show   # list table entries
pfctl -t bruteforce -T delete 203.0.113.1   # remove an entry
```

## Enabling at boot

On OpenBSD, PF is enabled in `/etc/rc.conf.local`:

```
pf=YES
```

On FreeBSD, add to `/etc/rc.conf`:

```
pf_enable="YES"
pf_rules="/etc/pf.conf"
```

For NAT, anchors, queuing, and traffic shaping, see the
[OpenBSD Handbook Packet Filter](https://www.openbsdhandbook.com/pf/).