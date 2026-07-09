# Configure the firewall with UFW

Hardening runbook. Restricts inbound traffic to the services the server actually needs, using UFW (the simpler frontend to netfilter). For the choice between UFW, nftables, and the alternatives, see the [firewall overview](../firewall.md).

## When to run

On a new server during setup, once the services it will run are known. On an existing server that has no firewall, or one with rules that have drifted from what the server actually needs.

## Before starting

A list of the ports the server legitimately serves. For a web server: 80 and 443. For SSH: 22, or the port SSH was moved to. Anything not on the list is a candidate to leave closed.

## Risk

A default-deny inbound policy applied before the SSH rule is in place drops the current SSH session and locks the server. Add the SSH allow rule first, then set the default policy. Keep the existing session open and test from a second one.

## Steps

### Install

```
sudo apt-get install ufw
```

### Allow SSH first

Before any default-deny policy:

```
sudo ufw allow 22/tcp          # or the port SSH was moved to
```

### Set default policies

```
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### Allow the services the server runs

```
sudo ufw allow 'Nginx Full'     # opens 80 and 443
```

For a server moved to HTTPS only, allow `Nginx Full` then remove the redundant HTTP-only profile if it was added.

### Enable

```
sudo ufw enable
```

UFW warns that enabling may disrupt existing SSH connections. With the SSH allow rule already in place, it will not.

## Verify

```
sudo ufw status verbose
```

Confirm the listed allow rules match the intended port list and nothing else is open. From a second session, confirm SSH still connects. From outside the network, confirm a port that should be closed is in fact unreachable.

## Done

Default inbound is deny. Only the intended ports are open. SSH still reachable. No unexpected ports in `ufw status`.

## Rollback

```
sudo ufw disable
```

This removes all firewall rules and reverts to no filtering. Use it to recover access, then re-enable with the SSH rule in place. To remove a single rule, `sudo ufw status numbered` then `sudo ufw delete <number>`.

## Follow-up

- On a server running Docker, UFW rules may not reflect what is actually reachable: Docker inserts its own rules ahead of UFW. See the [firewall overview](../firewall.md) and [container stack](../../containers/stack.md).
- Most firewall configurations leave outbound open. For servers holding sensitive data, scoped egress rules are worth considering.
Last updated: 10 July 2026
