# Configure the firewall with iptables

Hardening runbook. Restricts inbound traffic using iptables directly, for servers where the simpler UFW frontend is not in use. iptables is verbose and easy to get wrong; for most servers [UFW](ufw.md) or nftables is the better choice. See the [firewall overview](../firewall.md) for the comparison.

## When to run

On a bare-metal or minimal server where iptables is the established tool and console access is available. On an existing server whose iptables ruleset needs auditing or tightening.

## Risk

A default DROP policy on the INPUT chain applied before an SSH accept rule exists drops the current session and locks the server. Console access is then the only way back. Add the SSH accept rule first, or keep console access ready before changing the default policy.

## Steps

### Allow loopback and established connections first

```
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

### Allow SSH before setting the default policy

```
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT      # or the SSH port in use
```

`-I` inserts at the top of the chain, ahead of any DROP.

### Allow the services the server runs

```
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Set default policies last

```
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT
```

### Make rules persistent

Rules set this way are lost on reboot. With `iptables-persistent` installed:

```
sudo iptables-save | sudo tee /etc/iptables/rules.v4
sudo ip6tables-save | sudo tee /etc/iptables/rules.v6
```

## Verify

```
sudo iptables -L INPUT -n -v --line-numbers
```

Confirm the SSH accept rule sits above the default DROP, the intended service ports are accepted, and nothing unexpected is open. From a second session, confirm SSH still connects.

## Done

INPUT default is DROP. SSH and intended service ports accepted, with SSH ahead of the DROP. Rules saved to survive reboot. SSH still reachable from a second session.

## Rollback

Flush the rules and reset the default policy to ACCEPT to recover access:

```
sudo iptables -P INPUT ACCEPT
sudo iptables -F INPUT
```

This removes all INPUT filtering. Use it to regain access, then rebuild the ruleset with the SSH rule in place. To remove one rule, find its number with `--line-numbers` and `sudo iptables -D INPUT <number>`.

## Follow-up

- For most servers, [UFW](ufw.md) is easier to manage and harder to get dangerously wrong.
- On a server running Docker, Docker inserts its own iptables rules; the visible INPUT chain may not reflect what is reachable. See the [firewall overview](../firewall.md).
