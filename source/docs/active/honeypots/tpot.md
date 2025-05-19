# T-Pot – The All-in-One cyber trap

*Like a Russian doll of deception, but with more Docker.*

## Installation

```bash
git clone https://github.com/telekom-security/tpotce
cd tpotce/iso/installer/
sudo ./install.sh --type=user
```

*Warning: May consume more RAM than your actual production systems.*

## Usage

Access the dashboard at https://your-ip:64297

*Contains enough tools to make even seasoned attackers sigh.*

## Integration

* Pre-built ELK Stack: Already included (because T-Pot pities your logging skills)
* Zeek Tagging:
    
```bash
# In Zeek config  
redef Notice::emailed_types += { SSHD::Login };
```
