# OpenCanary – The lazy person’s honeypot

"For when you want security theatre without the rehearsal."

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

*Logs to syslog by default—minimal effort, maximum smugness.*

## Integration

* Splunk: Use syslog-ng to forward logs
* fail2ban:

```
[opencanary-http]  
enabled = true  
filter = http-get-detect  
logpath = /var/log/syslog  
```
