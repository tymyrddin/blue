# Supercharge security with Pi-hole (Block TV Ads + Tracking)

A free tool that stops smart devices from "phoning home."

Steps

1. Get a Raspberry Pi 4 (or old laptop):
2. Install Pi-hole:

* Open a terminal (Mac/Linux) or PowerShell (Windows).
* Copy/paste this command:

```bash
curl -sSL https://install.pi-hole.net | bash
```

* Follow the prompts (just press Enter for defaults).

3. Set Pi-hole as your DNS Server:

* Go to your router settings (Step 1 above).
* Find DNS Settings → Set Primary DNS to your Pi-hole’s IP (e.g., 192.168.1.100).

4. Block IoT tracking:

* Open Pi-hole’s admin page (http://192.168.1.100/admin).
* Go to Group Management → Add "IoT" group.
* Under Blocklists, add:

```
https://raw.githubusercontent.com/Perflyst/PiHoleBlocklist/master/SmartTV.txt
```

This blocks Samsung/LG/Sony TVs from sending your viewing habits to advertisers.

Done! Now your gadgets can’t report back to Big Tech.