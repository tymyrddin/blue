# Dionaea – The malware motel

*‘Vulnerable services’ with a strict no-cleanup policy.*

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

*Sit back and wait for malware to check itself in.*

## Integration

* ELK: Forward logs with Filebeat to Elasticsearch
* Email alerts:

```bash
grep "new connection" /var/log/dionaea.log | mail -s "Dionaea Catch" admin@example.com
```
