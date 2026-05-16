# OpenCanary

Low-overhead honeypot supporting multiple protocols. Logs to syslog by default. Minimal configuration
required to get something useful running.

## Installation

```bash
pip install opencanary
```

## Configuration

Create `opencanary.conf`:

```json
{
  "http.enabled": true,
  "ssh.enabled": true,
  "rdp.enabled": false
}
```

## Usage

```bash
opencanaryd --start
```

## Integration

* Splunk: use syslog-ng to forward logs.
* fail2ban:

```
[opencanary-http]  
enabled = true  
filter = http-get-detect  
logpath = /var/log/syslog  
```
