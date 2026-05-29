# Audit running services

Operational-hygiene runbook. Reviews what is actually running on a server and disables anything it does not need. Every running service is a potential entry point; a service that is not running cannot be exploited, whatever the firewall says.

## When to run

On a new server during setup, before it goes into service. On an existing server that has accumulated services over time, or whose purpose has changed. As a periodic check, since services arrive with package installs and rarely leave on their own.

## Listing what runs

```
sudo systemctl --type=service --state=active
```

This lists every active service. A short, recognisable list is the goal. Anything unfamiliar is worth identifying before deciding to keep it.

Cross-reference with what is actually listening on the network:

```
sudo ss -tulnp
```

A service listening on `0.0.0.0` is reachable from the network; one on `127.0.0.1` is local only. A network-facing service with no clear purpose is the priority to investigate.

## Common candidates for removal

Depending on the server's role, these are frequently present and frequently unneeded:

- `telnet`, `rlogin`, `rexec`: unencrypted or unauthenticated remote access, superseded by SSH.
- `ftp`: unencrypted file transfer; SFTP or FTPS where transfer is needed.
- `smbd`, `nmbd`: Samba file sharing. Needed only if SMB shares are actually served.
- `named`: a DNS server. Unnecessary unless the host serves DNS.
- `lpd`: a print daemon, rarely needed on a headless server.
- `rpcbind` / `portmap`: RPC support for NFS. Its presence means NFS is running.
- `automount`: NFS automatic mounting; disable if NFS is not in use.

The question for each: does this server's actual job require it? If not, it is a candidate.

## Risk

Disabling a service that something quietly depends on can break the server. Stop a service first and confirm nothing breaks before disabling it permanently. Stopping is immediately reversible; a service stopped but not yet disabled returns on reboot, which gives a safety margin while testing.

## Steps

For each unneeded service, stop it and confirm the server still behaves:

```
sudo systemctl stop smbd
```

Check the applications that matter still work. If anything breaks, start it again (`sudo systemctl start smbd`) and reconsider. Once confirmed safe, prevent it returning on reboot:

```
sudo systemctl disable smbd
```

## Verify

```
sudo systemctl --type=service --state=active
sudo ss -tulnp
```

Confirm the disabled services are gone from both lists and that the services the server needs are still running. A reboot is the final confirmation that nothing disabled comes back and nothing needed failed to start.

## Done

The active service list contains only what the server's role requires. No unexplained network-facing services. Disabled services stay down across a reboot, and the server's actual function is unaffected.

## Rollback

A stopped or disabled service is restored with:

```
sudo systemctl enable --now smbd
```

Because disabling is reversible, the safe path is always stop, test, then disable.

## Follow-up

- Pair with a [firewall](ufw.md) that denies inbound by default: service minimisation and inbound restriction cover different gaps.
- Re-run periodically; new services arrive with package installations.
