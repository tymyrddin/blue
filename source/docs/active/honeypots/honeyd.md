# Honeyd – The entire fake data centre

*Because simulating one vulnerable system is for amateurs.*

## Installation (Debian/Ubuntu)

```bash
sudo apt install honeyd
```

## Configuration

Edit `/etc/honeypot/honeyd.conf`:

```
create default
set default personality "Windows XP"
bind 10.0.0.1 default
add default tcp port 22 "sh /etc/honeyd/scripts/fake-ssh.sh"
```

## Usage

```bash
sudo honeyd -d -f /etc/honeyd.conf
```
`
*Now watch as attackers waste hours ‘exploiting’ your imaginary Windows XP box.*

## Integration

* Syslog: Add log syslog to config
* fail2ban: Filter SSH attempts with:

```
[honeyd-ssh]  
enabled = true  
filter = sshd  
logpath = /var/log/syslog
```
