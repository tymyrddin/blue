| ![Autopsy](/_static/images/autopsy-room-banner.png)
|:--:|
| [THM Rooms: Autopsy (1 and 2)](https://tryhackme.com/room/autopsy2ze0) |

# Windows 10 disk image (Autopsy)

In the attached VM, there is an Autopsy case file and its corresponding disk image. After loading the `.aut` file, 
make sure to re-point Autopsy to the disk image file. Ingest Modules were already ran for your convenience.

The task is to perform a manual analysis of the artifacts discovered by Autopsy to answer the questions below.

## Questions

**What is the MD5 hash of the E01 image?**

Answer: `3f08c518adb3b5c1359849657a9b2079`

**What is the computer account name?**

Answer: `DESKTOP-0R59DJ3`

**List all the user accounts. (alphabetical order)**

Answer: `H4S4N,joshwa,keshav,sandhya,shreya,sivapriya,srini,suba`

**Who was the last user to log into the computer?**

Answer: `sivapriya`

**What was the IP address of the computer?**

See `Look@LAN` in `Program Files(x86)`:

Answer: `192.168.130.216`

**What was the MAC address of the computer? (XX-XX-XX-XX-XX-XX)**

Answer: `08-00-27-2c-c4-b9`

**What is the name of the network card on this computer?**

Search for `Ethernet` in `Keyword Search`:

Answer: `Intel(R) PRO/1000 MT Desktop Adapter`

**What is the name of the network monitoring tool?**

Answer: `Look@LAN`

**A user bookmarked a Google Maps location. What are the coordinates of the location?**

`Web Bookmarks`:

Answer: `12°52'23.0"N 80°13'25.0"E`

**A user has his full name printed on his desktop wallpaper. What is the user's full name?**

`Images/Videos`:

Answer: `Anto Joshwa`

**A user had a file on her desktop. It had a flag, but she changed the flag using PowerShell. What was the first flag?**

Check the powershell history for each user: `Users -> user -> AppData -> Roaming -> Microsoft -> Windows -> PowerShell -> PSReadLine -> ConsoleHost_history.txt`

Answer: `flag{HarleyQuinnForQueen}`

**The same user found an exploit to escalate privileges on the computer. What was the message to the device owner?**

Answer: `flag{I-hacked-you}`

**2 hack tools focused on passwords were found in the system. What are the names of these tools? (alphabetical order)**

`Windows Defender -> Scans -> History -> Service -> DetectionHistory`

Answer: `Lazagne, Mimikatz`

**There is a YARA file on the computer. Inspect the file. What is the name of the author?**

`Keyword Search` for `.yar`:

Answer: `Benjamin DELPY (gentilkiwi)`

**One of the users wanted to exploit a domain controller with an MS-NRPC based exploit. What is the filename of the archive that you found? (include the spaces in your answer)**

Search for a document on `Zerologon` in `Recent Documents`:

Answer: `2.2.0 20200918 Zerologon encrypted.zip`
