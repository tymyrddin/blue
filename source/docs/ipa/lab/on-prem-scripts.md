# Helpful scripts to automate checks and responses

Scripts are little tools you build once, and they quietly do important jobs for you behind the scenes—like looking 
for signs of spyware, blocking suspicious devices, or copying logs from phones.

You don’t need to know programming. Think of it like baking: follow the recipe exactly and the cake (well, 
the script) will do its job.

## Where to put your scripts

You’ll want all your custom scripts in one secure, predictable place. Here's how to make that happen.

1. Open Terminal: On your server (Linux), open a terminal window.
2. Create the `scripts` folder. This is where your scripts will live:

```bash
sudo mkdir -p /opt/ipa-siem/scripts
```

3. Move into that folder

```bash
cd /opt/ipa-siem/scripts
```

4. Lock it down (only admin users should be able to touch these)

```bash
sudo chmod 700 /opt/ipa-siem/scripts
```

## Cut a device off the network

**What it does:** If a phone or laptop on the network is acting dodgy—perhaps it’s showing signs of spyware or 
tracking—you can cut it off immediately using this script.

**Why it matters:** Fast response is crucial. This blocks a device from sending anything out to the internet.

### Step-by-step to create it

1. Still inside `/opt/ipa-siem/scripts`, create the script file:

```bash
sudo nano quarantine_device.sh
```

2. Paste this in:

```bash
#!/bin/bash

echo "Disconnecting $1 from the network..."
sudo iptables -A OUTPUT -s $1 -j DROP
```

3. Save and exit:

* Press `Ctrl + O`, then `Enter`
* Press `Ctrl + X`

4. Make it executable:

```bash
sudo chmod +x quarantine_device.sh
```

### To use it

If the dodgy device has IP `192.168.1.50`:

```bash
sudo /opt/ipa-siem/scripts/quarantine_device.sh 192.168.1.50
```

It won’t get past the gate again.

## Look for dodgy things in Wazuh logs

**What it does:** Looks through logs from your Wazuh agent and pulls out anything marked “suspicious”.

**Why it matters:** Reading raw logs is painful. This gives you a bite-sized file with only the red flags.

### Step-by-step

1. Create the file:

```bash
sudo nano parse_logs.sh
```

2. Paste in:

```bash
#!/bin/bash

mkdir -p /opt/ipa-siem/alerts
journalctl -u wazuh-agent | grep -i suspicious > /opt/ipa-siem/alerts/suspicious.log
```

3. Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`)

4. Make it executable:

```bash
sudo chmod +x parse_logs.sh
```

### Automate it every hour

```bash
crontab -e
```

At the bottom, add:

```
0 * * * * /opt/ipa-siem/scripts/parse_logs.sh
```

Now every hour it’ll check logs and save anything alarming in:

```
/opt/ipa-siem/alerts/suspicious.log
```

### Encrypt the results (optional, but recommended)

Make sure only trusted people can read it:

```bash
gpg -c /opt/ipa-siem/alerts/suspicious.log
```

Choose a strong password, store it securely.

## Run on Android via Termux

Used when a survivor has an Android device and you want to grab useful clues from it.

**On your server (where others can download it):**

1. Create the file:

```bash
sudo nano /opt/ipa-siem/scripts/setup_android.sh
```

2. Paste in:

```bash
#!/data/data/com.termux/files/usr/bin/bash

echo "Collecting Android clues..."

mkdir -p ~/ipa_siem_logs

pm list packages -f > ~/ipa_siem_logs/apps.txt
settings get global http_proxy > ~/ipa_siem_logs/proxy.txt
cat /data/misc/wifi/wpa_supplicant.conf > ~/ipa_siem_logs/wifi.txt 2>/dev/null
logcat -d > ~/ipa_siem_logs/logcat.txt

echo "✅ Done. Files saved in ~/ipa_siem_logs/"
```

3. Make it executable:

```bash
chmod +x /opt/ipa-siem/scripts/setup_android.sh
```

**Host it for downloading:**

From `/opt/ipa-siem/scripts`:

```bash
python3 -m http.server 8000
```

**On the Android device (in Termux):**

```bash
pkg update && pkg install curl
curl -s http://192.168.1.10:8000/setup_android.sh | bash
```

## Get logs from jailbroken iPhone

Requires:

* iPhone with **OpenSSH installed** via Cydia
* You know the IP address of the iPhone on the local Wi-Fi

On the server

```bash
sudo nano /opt/ipa-siem/scripts/pull_ios_logs.sh
```

Paste in:

```bash
#!/bin/bash

IP=$1
USER=mobile
DATE=$(date +"%Y-%m-%d_%H-%M")

mkdir -p /opt/ipa-siem/ios_logs/$DATE

scp -r ${USER}@${IP}:/var/mobile/Library/Logs/CrashReporter /opt/ipa-siem/ios_logs/$DATE/
scp ${USER}@${IP}:/var/log/syslog /opt/ipa-siem/ios_logs/$DATE/

echo "iPhone logs saved to /opt/ipa-siem/ios_logs/$DATE"
```

Make executable:

```bash
chmod +x /opt/ipa-siem/scripts/pull_ios_logs.sh
```

Run it like this:

```bash
/opt/ipa-siem/scripts/pull_ios_logs.sh 192.168.1.23
```

## Find spyware words in logs

```bash
sudo nano /opt/ipa-siem/scripts/watch_logs.sh
```

Paste:

```bash
#!/bin/bash

LOGDIR="/opt/ipa-siem/ios_logs"
ALERTS="/opt/ipa-siem/alerts"

mkdir -p $ALERTS

grep -rEi "spy|track|mirror|record|stalker|surveil|remote access" $LOGDIR > $ALERTS/suspicious.log

echo "Suspicious terms found. Check $ALERTS/suspicious.log"
```

Make executable:

```bash
chmod +x /opt/ipa-siem/scripts/watch_logs.sh
```

## Collect files from USB sticks

```bash
sudo nano /opt/ipa-siem/scripts/usb_intake.sh
```

Paste:

```bash
#!/bin/bash

MOUNT="/media/usb"
DEST="/opt/ipa-siem/manual_uploads/$(date +%F_%H%M)"
mkdir -p $DEST

cp -r $MOUNT/* $DEST

echo "Files copied to $DEST"
```

Make executable:

```bash
chmod +x /opt/ipa-siem/scripts/usb_intake.sh
```

## Run the lot

```bash
sudo nano /opt/ipa-siem/scripts/full_check.sh
```

Paste:

```bash
#!/bin/bash

/opt/ipa-siem/scripts/usb_intake.sh
/opt/ipa-siem/scripts/watch_logs.sh
```

Make executable:

```bash
chmod +x /opt/ipa-siem/scripts/full_check.sh
```

