# Python honeyport (Linux/Windows)

```python
import socket
import time
from datetime import datetime

# Fake SSH service on port 2222
HONEYPORT = 2222
LOG_FILE = "/var/log/honeyport.log"  # Linux
# LOG_FILE = "C:\\honeyport.log"    # Windows

def log_connection(ip):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"{timestamp} - Connection from {ip}\n")

def fake_ssh_handshake(conn):
    try:
        conn.send(b"SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.3\r\n")
        data = conn.recv(1024)  # Wait for client key exchange
        time.sleep(2)  # Make it seem like real crypto is happening
        conn.send(b"Protocol mismatch.\r\n")
    except:
        pass

sock = socket.socket()
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(("0.0.0.0", HONEYPORT))
sock.listen(5)

print(f"[*] Fake SSH running on port {HONEYPORT}")
while True:
    conn, addr = sock.accept()
    ip = addr[0]
    print(f"[!] Probe from {ip}")
    log_connection(ip)
    fake_ssh_handshake(conn)
    conn.close()
```

## Integration with Linux defences

1. iptables redirect

```bash
# Redirect real SSH (22) to honeyport (2222)
sudo iptables -t nat -A PREROUTING -p tcp --dport 22 -j REDIRECT --to-port 2222

# Allow honeyport through firewall
sudo iptables -A INPUT -p tcp --dport 2222 -j ACCEPT
```

2. fail2ban configuration

`/etc/fail2ban/jail.d/honeyport.conf`:

```
[honeyport]
enabled = true
filter = honeyport
logpath = /var/log/honeyport.log
maxretry = 1
bantime = 1w
action = iptables-allports[name=HONEYPORT]
```

`/etc/fail2ban/filter.d/honeyport.conf`:

```
[Definition]
failregex = ^.* - Connection from <HOST>$
```

Restart: `sudo systemctl restart fail2ban`