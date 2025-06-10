# How to set up a shelter-based security system (IPA-SIEM)

**Private, powerful, and in your hands – no cloud required**

This guide walks you through setting up the **IPA-SIEM Stack** entirely inside your shelter. That means:

* No third-party cloud platforms
* No data leaving your building
* No mystery surveillance on survivors

It’s designed for shelters with:

* A stable internet connection (even if it’s just inside the building)
* A small but committed team
* No digital background (we’ll explain everything)
* A need to spot signs of digital stalking, tampering, or surveillance

## What this system does

It collects clues from devices (like logs, alerts, and odd behaviour), watches for signs of tracking or intrusion, 
and gives you a visual dashboard so you can spot threats and act fast.

## What you’ll need

### A shelter server (your command centre)

This is the machine that will run everything.

**Minimum spec:**

* Ubuntu 22.04 LTS (a free version of Linux — we’ll explain how to install this if you need)
* At least 8 GB RAM (memory)
* At least 4 CPU cores (processing power)
* At least 100 GB disk space
* A **fixed** internal IP address (so other devices can always find it)

*If unsure, ask your IT volunteer to set a fixed IP like `192.168.1.10`.*

You can use:

* A spare PC
* A mini PC (like Intel NUC)
* A virtual machine on your existing admin computer (if powerful enough)

### Devices to monitor

These are the devices this sytem can serve:

* Windows laptops
* macOS devices (e.g. MacBooks)
* Android phones (rooted = more access, but not required)
* iPhones (only partial data unless jailbroken)

### Shelter network (wired or Wi-Fi)

Just needs to connect all devices **within** the building. The system does not need internet access once set up.

### Optional: PiRogue device

[A small toolkit (based on a Raspberry Pi)](pts.md) that checks devices for suspicious behaviour before they join the 
shelter network. Ideal during intake interviews or outreach.

## Step-by-step setup

### Prepare the shelter server

This is where all your security tools will live.

1. Open a terminal window (On your Ubuntu server, press `Ctrl + Alt + T`)
2. Update your system and install some essential tools:

```bash
sudo apt update && sudo apt install -y curl unzip gnupg
```

This ensures your server is up to date and can download packages securely.

### Install Wazuh (your security system)

**What is Wazuh?**: Wazuh is an open-source system that watches devices, looks for problems, and gives you alerts 
and a dashboard. It includes:

* Wazuh Manager (handles alerts and actions)
* Wazuh API (lets the dashboard talk to the system)
* Elasticsearch (stores logs and data)
* Kibana (your visual dashboard)

Add the Wazuh software source:

```bash
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --dearmor -o /usr/share/keyrings/wazuh.gpg

echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee /etc/apt/sources.list.d/wazuh.list

sudo apt update
```

Install Wazuh and supporting tools:

```bash
sudo apt install -y wazuh-manager wazuh-api elasticsearch kibana
```

Start the services:

```bash
sudo systemctl enable --now wazuh-manager elasticsearch kibana
```

This sets them to run now and every time you restart the server.

### Set up the Wazuh dashboard

Once everything is running, open a browser on your server and go to:

```
http://localhost:5601
```

Or from another device on the same network:

```
http://192.168.1.10:5601
```

This is your main control room. You’ll log in and see alerts, device info, and more.

## Connect survivor devices

This is how you collect useful logs and alerts from each device.

### For Windows or Mac

These devices use a program called the **Wazuh Agent** to send logs to your server.

*What is a Wazuh Agent?* A small app that runs in the background, collecting security-related information like login 
attempts, strange app behaviour, or changes to settings. It sends this data securely to your server.

**Option 1: Install agent directly from browser**

1. On the device, open a web browser.
2. Go to: `http://192.168.1.10:5601`
3. Download the agent for Windows or macOS.
4. Run the installer.
5. When asked for the server IP, enter your server’s fixed IP (e.g. `192.168.1.10`)

**Option 2: Install via USB stick (if internet isn’t available on the device)**

1. On the server:

```bash
wget https://packages.wazuh.com/4.x/agents/wazuh-agent_x.x.x.msi
cp wazuh-agent_x.x.x.msi /media/usb
```

2. Plug the USB into the survivor’s device.
3. Run the installer manually.

### For Android (rooted)

**Rooted** means full access to the phone’s internal system. If not rooted, see next section.

1. Install Termux (a Linux terminal app): Download from [F-Droid](https://f-droid.org/packages/com.termux/).
2. Open Termux and type:

```bash
pkg update && pkg install curl git
curl -s http://192.168.1.10/setup_android.sh | bash
```

([This script must be prepared on your server](on-prem-scripts.md).)

### For Android (non-rooted)

You’ll manually extract logs using `adb`.

**What is `adb`?** ADB (Android Debug Bridge) is a tool that lets you talk to Android phones from a computer. You’ll 
use it to copy system info and logs.

1. Install adb on your Ubuntu server:

```bash
sudo apt install android-tools-adb
```

2. Enable USB debugging on the phone:

   * Go to **Settings → About phone**
   * Tap **Build number** 7 times to unlock developer options
   * Go to **Developer options**, enable **USB debugging**

3. Connect phone to server with USB cable.
4. Check it is recognised:

```bash
adb devices
```

You should see a device ID listed. If not, check your USB cable and permissions.

5. Copy logs from the phone:

```bash
adb logcat -d > /opt/logs/android_logcat.txt
adb bugreport > /opt/logs/android_bugreport.zip
```

6. Optional: Extract app list and proxy settings

```bash
adb shell pm list packages -f > /opt/logs/android_apps.txt
adb shell settings get global http_proxy
```

### For jailbroken iPhones (full access)

1. Install OpenSSH via Cydia (jailbreak app store)
2. Use [secure scripts](on-prem-scripts.md) to transfer logs to your server via SSH

### iPhones which are **not** jailbroken

Use local backup to pull app data.

1. Install tools on server:

```bash
sudo apt install libimobiledevice-utils
```

2. Backup the iPhone:

```bash
idevicebackup2 backup /opt/backups/ios_device/
```

3. Run a [parser script](on-prem-scripts.md) (you may need to request help):

```bash
python3 parse_ios_backup.py /opt/backups/ios_device/
```

Look for:

* Unknown apps
* Location logs
* Mirroring software

### Optional: Use PiRogue to scan devices before they connect

[A PiRogue device](pts.md) sits between the network and a phone/laptop and watches all traffic.

1. Connect to the PiRogue:

```bash
ssh pi@piroguedevice.local
```

2. Start a network scan:

```bash
sudo ./start_capture.sh --target 192.168.1.75
```

3. After scan finishes, send data to your server:

```bash
scp capture.pcap user@192.168.1.10:/opt/forensics/
```

4. Review with this command:

```bash
tshark -r /opt/forensics/capture.pcap
```

## Add automation scripts

See [Helpful scripts (to automate checks and responses)](on-prem-scripts.md)

## Weekly maintenance

* Check the dashboard for new alerts
* Back up the `/var/ossec/logs/` folder to a USB or external drive
* Reboot server monthly to clear memory
* Lock server in a secure place
* Review the alert logs (`/opt/ipa-siem/alerts/suspicious.log` if using script)

## Summary

It doesn’t block all threats, but it lets you **see them**, and that's half the battle. For added support, reach 
out to a trusted local digital rights group—they can guide you remotely over encrypted chat or phone.

With this setup based on open-source tools, affordable, everything stays under your roof—no cloud, no third-party 
exposure. It’s your private radar, quietly watching for stalkerware or tampering. The system’s power comes from 
simple practices: check logs regularly, respond to alerts, and protect physical access. With basic guidance, everybody
in the shelter can help run and understand this system.

