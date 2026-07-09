# Dionaea

Malware collection honeypot. Emulates vulnerable services (SMB, HTTP, FTP, and others) to attract and
capture malware samples. Particularly useful for studying what automated attacks are distributing and
what payloads look like before they reach production systems.

## Installation

```bash
sudo apt install dionaea
```

## Configuration

Edit `/etc/dionaea/dionaea.conf`:

```
[modules]
python=curl,epmap,ftp,http,memcache,mssql,mysql,pptp,sip,smb,tftp,upnp
```

## Usage

```bash
sudo systemctl start dionaea
```

## Integration

* ELK: forward logs with Filebeat to Elasticsearch.
* Email alerts:

```bash
grep "new connection" /var/log/dionaea.log | mail -s "Dionaea Catch" admin@example.com
```
Last updated: 16 May 2026
