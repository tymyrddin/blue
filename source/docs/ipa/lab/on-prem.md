# How-to: Shelter-centric on-prem IPA-SIEM stack

**Private, Powerful, and In Your Hands**

Setting up your own secure surveillance detection system within the shelter: This guide walks you through setting up 
the IPA-SIEM Stack entirely within your shelter, so nothing ever touches the cloud. It's designed for situations 
where you have a stable internet connection, a small team willing to learn, and a strong desire to protect survivors 
from digital surveillance. You don’t need to be a cybersecurity expert—but you'll need to follow these instructions 
step by step.

## What you’ll need

### One shelter server

* A basic computer running Linux (Ubuntu 22.04 recommended). Could be a spare PC or a virtual machine.
* It needs:

  * At least 8 GB of memory (RAM)
  * 4 CPU cores
  * 100 GB storage (more if you'll analyse lots of devices)
  * A fixed internal IP address (so other devices can find it)

### Survivor devices

* Any of the following:

  * Windows laptops
  * macOS devices (MacBooks, iMacs)
  * Android phones (ideally rooted, but not required)
  * iPhones (if jailbroken or if backups can be made)

### Optional: PiRogue Device

A small [Raspberry Pi-based toolkit](pts.md) that can scan for suspicious activity during intake interviews or outreach visits.

### Shelter Network

Either wired or Wi-Fi—just needs to let your devices talk to the server internally.

## Step-by-Step Setup

### Prepare the shelter server

This is your command centre. You’ll install tools that monitor other devices and help you respond to digital threats.

#### Update the server and install basic tools

Open a terminal and type:

```bash
sudo apt update && sudo apt install -y curl unzip gnupg
```

#### Add Wazuh’s software repository

```bash
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --dearmor -o /usr/share/keyrings/wazuh.gpg

echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee /etc/apt/sources.list.d/wazuh.list

sudo apt update
```

#### Install the main tools

```bash
sudo apt install -y wazuh-manager wazuh-api elasticsearch kibana
```

#### Start everything up

```bash
sudo systemctl enable --now wazuh-manager elasticsearch kibana
```

## Connect survivor devices

### For Windows or Mac

**Option 1: Download the agent directly on the device**

* Use a browser to go to your Wazuh dashboard (e.g., [http://your-server-ip:5601](http://your-server-ip:5601))
* Download the correct agent (Windows or macOS)
* Install it and point it at your server’s IP address

**Option 2: Use a bootable USB**

* Prepare a USB with the installer ready

```bash
wget https://packages.wazuh.com/4.x/agents/wazuh-agent_x.x.x.msi
cp wazuh-agent_x.x.x.msi /media/usb
```

* Boot the survivor’s device from this USB
* Run the installer or use pre-prepared scripts to set it up

### For Android (rooted)

**Only works fully if the phone is rooted**

1. Install Termux from F-Droid
2. Open Termux and run:

```bash
pkg update && pkg install curl git
curl -s https://yourserver.local/setup_android.sh | bash
```

This sends key logs to the shelter server. For non-rooted phones, manual extraction may be needed.

### For Android (non-rooted)

You’ll need:

* A computer with `adb` (Android Debug Bridge) installed
* A USB cable

**Step-by-step:**

1. On the Android phone:

   * Go to **Settings → About phone → Tap ‘Build number’ 7 times**
   * Go back to **Settings → Developer Options**
   * Enable **USB debugging**

2. Plug the phone into your Linux server via USB

3. On the server:

```bash
adb devices
```

(If the device shows up, great. If not, check cables and permissions.)

4. Pull system logs:

```bash
adb logcat -d > /opt/logs/android_logcat.txt
adb bugreport > /opt/logs/android_bugreport.zip
```

5. Optional:

   * Export app list:

     ```bash
     adb shell pm list packages -f > /opt/logs/android_apps.txt
     ```
   * Check installed certificates:

     ```bash
     adb shell settings get global http_proxy
     ```

6. Analyse those files using your Wazuh/Kibana interface or manually with `grep`.

### For iPhone (jailbroken)

**If jailbroken**:

* Install OpenSSH from Cydia
* Securely send logs to your server using scripts or scheduled jobs

### For iPhone (not jailbroken)

You’ll need:

* A computer with iTunes or libimobiledevice tools installed
* A USB cable

**Step-by-step:**

1. Back up the iPhone locally:

```bash
idevicebackup2 backup /opt/backups/ios_device/
```

2. Once backed up, extract messages, app data, and logs:

```bash
python3 parse_ios_backup.py /opt/backups/ios_device/
```

(Use pre-written scripts or contact your digital support partner for help with `parse_ios_backup.py`)

3. Look for:

   * Weird or hidden apps
   * Location history
   * Account takeovers
   * Signs of mirroring or monitoring

## Add a PiRogue device (Optional)

Use it to scan new devices before they’re connected to your network.

```bash
# SSH into your PiRogue
sudo ./start_capture.sh --target 192.168.x.x

# After scan, transfer the file to your server
scp pirogue_capture.pcap user@ipa-siem.local:/opt/forensics/
```

Analyse with:

```bash
tshark -r /opt/forensics/pirogue_capture.pcap
```

## Add helpful scripts

**quarantine\_device.sh**

```bash
#!/bin/bash
echo "Disconnecting $1 from network..."
sudo iptables -A OUTPUT -s $1 -j DROP
```

**parse\_logs.sh**

```bash
#!/bin/bash
journalctl -u wazuh-agent | grep -i suspicious > /opt/alerts/suspicious.log
```

Schedule them with cron:

```bash
crontab -e
# Add:
0 * * * * /opt/scripts/parse_logs.sh
```

Encrypt logs:

```bash
gpg -c /opt/alerts/suspicious.log
```

## Ongoing maintenance

* Check the Kibana dashboard weekly for new alerts
* Back up the `/var/ossec/logs/` folder to a USB regularly
* Keep your server locked in a safe room or cabinet
* Reboot devices if they seem slow or show odd behaviour

## Summary

With this setup, everything stays under your roof—no cloud, no third-party exposure. It’s your private radar, 
quietly watching for stalkerware or tampering. The system’s power comes from simple practices: check logs regularly, 
respond to alerts, and protect physical access. With basic guidance, even non-technical advocates can help run and 
understand this system.

For shelters with little tech support, consider partnering with a local digital rights group who can help 
remotely—using encrypted channels, of course.
