# How to set up a private cloud security system (IPA-SIEM)

**Secure. Distributed. Survivor-focused.**

How to run the IPA-SIEM stack in the cloud you control: This guide walks you through deploying the IPA-SIEM Stack in 
a private cloud—ideal for shelters or advocacy organisations that operate across multiple locations. You’ll get 
remote access, centralised monitoring, and the same surveillance detection tools—without surrendering data control to 
big tech.

We assume you have basic admin access to your cloud server, or a friendly nerd who does.

## What you’ll need

### A secure cloud server

* Provider examples: Hetzner, Netcup, 1984 Hosting (avoid AWS/Azure/Google unless legally required)
* Recommended specs:

  * 8+ GB RAM
  * 4 CPU cores
  * 100 GB SSD
  * Ubuntu 22.04 LTS
* Hardened with:

  * Fail2ban
  * Unattended upgrades
  * UFW (firewall)

### VPN access

* All shelter locations must use secure VPN tunnels to reach the cloud server.
* WireGuard or OpenVPN are both fine.

### Survivor devices

As in the [on-prem setup](on-prem.md) version: Windows, macOS, Android (rooted preferred), iOS (jailbroken or backups)

### Optional: PiRogue toolkit

Use in clinics or satellite offices for local device scans.

## Step-by-step setup

### Harden your cloud server

```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install basic security
sudo apt install fail2ban ufw unattended-upgrades -y
sudo ufw allow ssh
sudo ufw enable
```

### Install IPA-SIEM stack

Same as on-prem:

```bash
# Add Wazuh repo
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --dearmor -o /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee /etc/apt/sources.list.d/wazuh.list
sudo apt update

# Install components
sudo apt install -y wazuh-manager wazuh-api elasticsearch kibana

# Start services
sudo systemctl enable --now wazuh-manager elasticsearch kibana
```

### Enable secure access

#### Set up VPN (WireGuard example)

```bash
sudo apt install wireguard -y
# (Generate keys, share with each site. Use port 51820.)
```

#### Access the Wazuh dashboard

* Open Kibana at `https://your-cloud-ip:5601`
* Configure HTTPS with Let's Encrypt if possible

## Connect remote shelter devices

### Windows/macOS

* Download and install agents at remote shelters
* Configure agent to connect via VPN to your cloud IP

### Android (rooted via Termux)

```bash
pkg update && pkg install curl git
curl -s https://your-cloud-ip/setup_android.sh | bash
```

### For Android (non-rooted)

Non-rooted Android phones are limited in what can be monitored directly, but you can still extract useful information manually and upload it securely to your IPA-SIEM server.

#### Option 1: Use ADB (Android Debug Bridge)

This method requires physical access to the phone and a computer with ADB installed. Step-by-step:

1. **Prepare your computer**: Install ADB:

```bash
sudo apt install android-tools-adb
```

2. **Enable USB debugging on the Android device**

   * Go to **Settings > About phone**
   * Tap **Build number** 7 times to enable Developer Options
   * Go to **Settings > Developer options**
   * Enable **USB debugging**

3. **Connect the phone via USB**: Trust the computer if prompted on the phone.

4. **Collect logs and data**: On your terminal:

```bash
adb devices
adb logcat -d > android_logcat.txt
adb shell dumpsys > android_dumpsys.txt
adb shell pm list packages -f > installed_packages.txt
```

5. **Securely upload logs to the cloud server**: Assuming you have SSH set up on your cloud server:

```bash
scp android_*.txt youruser@your-ipasiem.cloud:/opt/forensics/android_logs/
```

6. **(Optional) Encrypt before upload**

```bash
gpg -c android_logcat.txt
```

#### Option 2: Shelter Tablet Collector (simplified method)

If your shelter uses a dedicated intake tablet:

1. Use the **Files** or **CX File Explorer** app on the Android device to:

   * Navigate to `/Download`, `/WhatsApp/`, and `/DCIM/`
   * Copy logs, screenshots, and suspicious media

2. Transfer these files via USB or SD card to the intake tablet

3. Upload them to the IPA-SIEM cloud server securely (using `scp` or a secure upload script)

### iOS (Jailbroken or via Backup)

```bash
# Backup on client machine
idevicebackup2 backup /tmp/device_backup
# Securely send to cloud server
scp /tmp/device_backup user@your-cloud-ip:/opt/backups/
```

## Triage with PiRogue (optional)

* Deploy PiRogue at remote sites
* Send pcap or logs securely to cloud:

```bash
scp suspicious.pcap user@your-cloud-ip:/opt/forensics/
```

* Analyse using `tshark` or Kibana dashboards

## Ongoing maintenance

* Rotate WireGuard keys every 90 days
* Run daily log backups:

```bash
tar -czf /opt/backup/siem_logs_$(date +%F).tar.gz /var/ossec/logs/
```

* Encrypt with GPG or age:

```bash
gpg -c /opt/backup/siem_logs_*.tar.gz
```

* Schedule cron jobs for parsing logs and auto-alerts

## Summary

This setup provides secure, centralised threat detection across multiple locations, without relying on third-party cloud tools. All data stays in your hands, encrypted and protected. It does require ongoing care (VPN upkeep, user access management), but it dramatically lowers local risk while keeping survivors' privacy at the forefront.

With a bit of training, tech-savvy advocates can handle daily tasks, while specialists can support upgrades and deeper forensics remotely.
