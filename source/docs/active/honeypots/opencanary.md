# OpenCanary

Low-interaction honeypot supporting a wide range of protocols. Each enabled module listens on its configured port and
logs any interaction, producing alerts without executing code or maintaining session state beyond what logging requires.
Suitable for internal network monitoring where any connection to a service that has no legitimate users is worth
examining.

Supported modules: FTP, Git, HTTP, HTTP proxy, IMAP, MSSQL, MySQL, NTP, RDP, Redis, SIP, SMB, SMTP, SNMP, SSH, TCP
banner, Telnet, TFTP, and VNC.

## Installation

```bash
pip install opencanary
```

Requires Python 3.8 or later. Installing into a virtual environment keeps the dependencies isolated from the system
Python.

## Configuration

Generate the default configuration template:

```bash
opencanaryd --copyconfig
```

This writes `opencanary.conf` to the current directory with all modules present but most disabled. Edit it to enable the
modules relevant to the deployment:

```json
{
  "device.node_id": "sensor-prod-01",
  "ssh.enabled": true,
  "ssh.port": 22,
  "ssh.version": "SSH-2.0-OpenSSH_5.1p1 Debian-4",
  "http.enabled": true,
  "http.port": 80,
  "http.banner": "Apache/2.2.22 (Ubuntu)",
  "rdp.enabled": true,
  "rdp.port": 3389,
  "ftp.enabled": false,
  "mysql.enabled": false,
  "smb.enabled": false,
  "logging": {
    "dst": "file",
    "file": {
      "filename": "/var/log/opencanary.log"
    }
  }
}
```

The `device.node_id` value appears in every log entry and identifies which sensor generated the alert, which matters
when running multiple instances across a network. The banner strings in `ssh.version` and `http.banner` control what
OpenCanary presents to connecting clients; older-looking banners attract scanners probing for known vulnerabilities in
those versions.

## Logging

OpenCanary writes structured JSON to the log file by default. The file can be tailed directly, forwarded via syslog-ng
to a SIEM, or parsed by a log shipper.

File logging:

```json
"logging": {
    "dst": "file",
    "file": {
    "filename": "/var/log/opencanary.log"
    }
}
```

Syslog forwarding via syslog-ng:

```
source s_opencanary {
  file("/var/log/opencanary.log");
};
destination d_splunk {
  network("splunk-host" port(514) transport("tcp"));
};
log {
  source(s_opencanary);
  destination(d_splunk);
};
```

Email and Slack webhook alerting are also available; both are configured under the `logging` key in `opencanary.conf`.
The generated template from `--copyconfig` includes commented examples for each.

## Usage

```bash
opencanaryd --start
opencanaryd --stop
opencanaryd --restart
```

## Running as a service

Create `/etc/systemd/system/opencanary.service`:

```ini
[Unit]
Description = OpenCanary honeypot
After = network.target

[Service]
ExecStart = /usr/local/bin/opencanaryd --start
ExecStop = /usr/local/bin/opencanaryd --stop
Type = forking
Restart = on-failure

[Install]
WantedBy = multi-user.target
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable --now opencanary
```

## Choosing modules

The choice of modules depends on what attacker behaviour the deployment aims to observe.

SSH, RDP, and HTTP together cover the most commonly scanned services on a network segment. Any connection is anomalous
where there is no legitimate reason for those services to exist on the host.

SMB, MSSQL, and MySQL suit a database or file server segment. Scanning activity originating from a workstation or an
unexpected host is a lateral movement indicator.

SNMP is useful for detecting reconnaissance targeting network infrastructure. Queries arriving from a host that has no
business reason to poll network devices are worth logging.

NTP and TFTP can surface network boot or configuration management reconnaissance in environments that use neither.

## Integration

fail2ban:

```
[opencanary-ssh]
enabled = true
filter = sshd
logpath = /var/log/opencanary.log
maxretry = 1
```

Setting `maxretry = 1` is appropriate here: a single connection to a service with no legitimate users is enough reason
to block the source.
