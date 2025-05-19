# Cowrie – The overly talkative SSH honeypot

*Records every keystroke, including their typos and existential crises.*

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

*The logs are hilariously verbose. Perfect for bedtime reading.*

## Integration

* Slack alerts: Use `jq` to parse JSON logs + curl to Slack webhook
* Suricata tagging:

```yaml
# suricata.yaml  
eve-log:  
  types: [ssh]  
  ssh:  
    enabled: yes  
    tagged-packets: yes 
```
