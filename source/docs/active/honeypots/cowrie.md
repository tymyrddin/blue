# Cowrie

SSH and Telnet honeypot. Records everything: commands entered, files downloaded, credentials attempted.
Particularly useful for studying automated attack scripts and what happens after a successful-looking login.

## Installation (Docker)

```bash
docker run -p 2222:2222 -v ~/cowrie/logs:/cowrie/cowrie-git/var/log/cowrie cowrie/cowrie
```

## Configuration

Edit `cowrie.cfg`:

```
[ssh]
listen_port = 2222
fake_version = SSH-2.0-OpenSSH_7.6p1
```

## Usage

```bash
tail -f ~/cowrie/logs/cowrie.json
```

## Integration

* Slack alerts: use `jq` to parse JSON logs, pipe to a Slack webhook via curl.
* Suricata tagging:

```yaml
# suricata.yaml  
eve-log:  
  types: [ssh]  
  ssh:  
    enabled: yes  
    tagged-packets: yes 
```
