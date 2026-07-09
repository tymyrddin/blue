# T-Pot

All-in-one honeypot platform. Runs multiple honeypots simultaneously via Docker, with a pre-built ELK
stack for log aggregation and visualisation. Useful when a comprehensive deployment is wanted without
assembling components separately.

## Installation

```bash
git clone https://github.com/telekom-security/tpotce
cd tpotce/iso/installer/
sudo ./install.sh --type=user
```

Resource requirements are significant: allocate accordingly.

## Usage

Access the dashboard at `https://your-ip:64297`

## Integration

* ELK Stack: already included.
* Zeek tagging:
    
```bash
# In Zeek config  
redef Notice::emailed_types += { SSHD::Login };
```
Last updated: 16 May 2026
