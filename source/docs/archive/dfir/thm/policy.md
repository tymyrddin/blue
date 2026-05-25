| ![KAPE](/_static/images/forensics-room-banner.png)
|:--:|
| [THM Room: KAPE](https://tryhackme.com/room/kape) |

# Acceptable Use Policy violation (KAPE)

Organisation X has an Acceptable Use Policy for their Portable Devices, including Laptops. This policy forbids users 
from connecting removable or Network drives, installing software from unknown locations, and connecting to unknown 
networks. It looks like one of the users has violated this policy. Can you help Organisation X find out if the user 
violated the Acceptable Use Policy on their device? 

Run KAPE with your desired Target and Module options.

Hint: You can use EZviewer placed in the EZtools folder on Desktop to open CSV files.
Answer the questions below

## Questions

**Two USB Mass Storage devices were attached to this Virtual Machine. One had a Serial Number  0123456789ABCDE. What is the Serial Number of the other USB Device?**

Answer: `1C6F654E59A3B0C179D366AE`

**7zip, Google Chrome and Mozilla Firefox were installed from a Network drive location on the Virtual Machine. What was the drive letter and path of the directory from where these software were installed?**

Answer: `Z:\Setups`

**What is the execution date and time of CHROME-SETUP.EXE in MM/DD/YYYY HH:MM?**

Answer: `11/25/2021 03:33`

**What search query was run on the system?**

Answer: `RunWallpaperSetup.cmd`

**When was the network named Network 3 First connected to?**

Answer: `11/30/2021 15:44`

**KAPE was copied from a removable drive. Can you find out what was the drive letter of the drive where KAPE was copied from?**

Answer: `E:`
