# How to enable DNSSEC on your DNS server

DNSSEC adds cryptographic signatures to your DNS records, preventing spoofing and cache poisoning. 

DNSSEC is powerful but complex. You can:

* Use a DNSSEC-enabled registrar (Cloudflare, Google Domains).
* Automate key rotation (with cron or systemd timers).
* Monitor validation (unbound or dnsmasq for caching).

Need a simpler setup? Try Cloudflare’s DNSSEC (they handle key management). Below is a 
step-by-step guide for BIND (named) on Linux, the most common DNS server software.

## Prerequisites

* A domain you control (e.g., example.com)
* A DNS server running BIND (named)
* Access to your domain registrar’s DNS settings (to upload DS records)

## Step 1: Install & configure BIND (if not already running)

On Debian/Ubuntu:

```bash
sudo apt update && sudo apt install bind9 bind9utils -y
```

On RHEL/CentOS:

```bash
sudo dnf install bind bind-utils -y  # RHEL 8+
sudo yum install bind bind-utils -y  # CentOS 7
```

Enable DNSSEC in `named.conf`

Edit `/etc/bind/named.conf.options` (Debian) or `/etc/named.conf` (RHEL):

```
options {
    dnssec-enable yes;
    dnssec-validation yes;
    dnssec-lookaside auto;
};
```

Restart BIND:

```bash
sudo systemctl restart named   # RHEL/CentOS
sudo systemctl restart bind9  # Debian/Ubuntu
```

## Step 2: Generate DNSSEC keys

### Create a Key Signing Key (KSK) & Zone Signing Key (ZSK)

```bash
cd /etc/bind
sudo dnssec-keygen -a RSASHA256 -b 2048 -n ZONE example.com  # ZSK
sudo dnssec-keygen -a RSASHA256 -b 4096 -f KSK -n ZONE example.com  # KSK
```

This creates two key pairs (.key & .private files).

### Add keys to your Zone file

Edit your zone file (e.g., /etc/bind/db.example.com) and include the .key files:

```
$INCLUDE Kexample.com.+008+12345.key  # ZSK
$INCLUDE Kexample.com.+008+67890.key  # KSK
```

### Sign the Zone

```bash
sudo dnssec-signzone -A -3 salt -N INCREMENT -o example.com -t db.example.com
```

This generates a signed zone file (`db.example.com.signed`).

### Update BIND to Use the Signed Zone

In `named.conf`, replace:

```
zone "example.com" { type master; file "db.example.com"; };
```

with:

```
zone "example.com" { type master; file "db.example.com.signed"; };
```

Restart BIND again:

```bash
sudo systemctl restart bind9  # or named
```

## Step 3: Publish DS Records at your registrar

### Extract the DS record. 

This output  is needed for your registrar.

```bash
sudo dnssec-dsfromkey Kexample.com.+008+67890.key  # KSK
```

### Add DS Record to Domain Registrar

* Go to your registrar’s DNS settings (e.g., Cloudflare, GoDaddy, Namecheap).
* Paste the DS record (hash, algorithm, key tag).
* Wait up to 48 hours for full propagation.

## Step 4: Verify DNSSEC is working

### Check with dig 

Look for ad (Authenticated Data) flag in the response.

```bash
dig +dnssec example.com
```

### Online validation tools

* DNSSEC Debugger
* DNSViz

## Common issues & fixes

* "No DS record found" → Did you publish the DS record at your registrar?
* "Signature expired" → Keys need rolling before they expire (automate this!).
* BIND won’t start → Check logs (journalctl -u bind9).


