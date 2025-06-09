# Guide to setting up a PiRogue toolkit for detecting stalkerware  

This step-by-step guide is designed for shelter staff with no technical background. It will help you set up a simple 
device that can check computers and phones for hidden tracking software used by abusers. Everything here uses free, 
open-source tools approved by digital safety experts.

## What you'll need 

Before starting, gather these items (all available at most electronics shops):  

1. [Raspberry Pi 4](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/) (2GB RAM is enough)  
2. Official power supply (micro-USB)  
3. 32GB micro SD card (Class 10 speed)  
4. Ethernet cable (any basic one will do)  
5. A spare monitor/TV with HDMI port (to set up initially)  

*Budget note: Some charities like WESNET in Australia provide discounted kits – check local domestic violence support 
networks.*

## Step 1: Preparing the PiRogue software  

### Downloading the system  

1. On any computer, go to [PiRogue's official website](https://pts-project.org)  
2. Click "Downloads" and choose the latest version for Raspberry Pi 4   
3. Save the file (it will end in `.img.xz`) – this contains the entire operating system  

### Flashing the SD card

1. Install **Balena Etcher** (free software) from [etcher.io](https://www.balena.io/etcher/)  
2. Insert your micro SD card into the computer (using an adapter if needed)  
3. Open Etcher, select the PiRogue image you downloaded, choose your SD card, and click "Flash!"  
4. Wait until it says "Flash Complete" (about 10 minutes)

## Step 2: Setting up the hardware  

1. **Insert the SD card** into the Raspberry Pi's slot (underneath)  
2. **Connect the Ethernet cable** from your Pi to the shelter's router  
3. **Plug in the HDMI** to a monitor/TV  
4. **Connect the power supply** last – the Pi will turn on automatically  

*First boot tip:* The system takes about 5 minutes to start up. A rainbow screen is normal at first.

## Step 3: Initial configuration  

1. When prompted, log in with:  
   - Username: `pi`  
   - Password: `raspberry` (you'll change this later)  

2. Follow the on-screen prompts to:  
   - Set a new secure password (write this down somewhere safe)  
   - Confirm your timezone (important for accurate logs)  
   - Allow non-superusers to capture traffic (type "Y" then Enter)   

3. The system will update itself – wait until it reboots (about 15 minutes)

## Step 4: Connecting devices to check  

### For phones

1. On the PiRogue's screen, note the WiFi network name (e.g., "PiRogue-123") and password  
2. On the survivor's phone:  
   - Go to WiFi settings  
   - Connect to the PiRogue network (ignore any "no internet" warnings)  
   - Use the phone normally for 5 minutes – the PiRogue will analyse traffic in the background   

### For computers

1. Connect the computer to the PiRogue via Ethernet cable  
2. Open any browser and visit the dashboard at: `https://pirogue.local/dashboard`  
   - Username: `admin`  
   - Password: Check the PiRogue screen for the auto-generated one

## Step 5: Reading the results  

The dashboard shows simple traffic lights:

- **Green:** No stalkerware detected  
- **Yellow:** Suspicious activity (e.g., unknown location tracking)  
- **Red:** Confirmed stalkerware (e.g., Cerberus, FlexiSpy)   

*What to do if red appears:*

1. Note the malware name shown  
2. Immediately disconnect the device  
3. Contact your local tech safety partner (listed at [stopstalkerware.org](https://stopstalkerware.org/resources/#find-support))

## Safety and maintenance  

1. **After each use:**  
   - Power off the PiRogue properly (type `sudo shutdown now` on its screen)  
   - Wipe the SD card, for example by using DiskGenius on Windows: Formatting an SD card only removes file references—data can still be recovered with tools like PhotoRec 7. Wiping overwrites the data, making it unrecoverable. This is critical for:
      - Removing traces of stalkerware or malware.
      - Protecting survivor privacy if reusing cards.
      - Ensuring clean setups for PiRogue’s forensic tools 
   - Verify the card after wiping: Reinsert it → Check if it shows as "empty" in File Explorer.

2. **Monthly checks:**  
   - Re-flash the SD card with the latest PiRogue version (updates include new stalkerware detection rules)   

3. **For sensitive cases:**  
   - Use in a separate room from the survivor's living quarters  
   - Document findings for legal evidence (take screenshots of the dashboard)

## Getting help  

- Join PiRogue's **Discord server** (https://discord.gg/pts-project) for real-time support  
- EU Tech Safety Helpline: https://www.accessnow.org/help/ *(24/7 support in multiple languages)*
- UK shelters can contact **Women's Aid** tech safety clinic (+44 0808 802 0300)   
- For immediate danger, always prioritise physical safety over digital checks

## Notes

This setup takes under an hour and costs less than €80. It’s a powerful way to help survivors regain digital safety.

This tool doesn't replace professional forensic analysis, but it's a good first check when survivors bring devices to your shelter. The whole setup takes about 45 minutes and costs under £70 – a small price for helping someone regain their digital privacy.  
