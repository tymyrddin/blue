# Android acquisition

## Extraction methods

1. ***Manual data extraction***: This method is navigating the device as a normal user, using touch controls, screen controllers, and keyboards to access the information stored on the device and to record input directly from the screen. There are no special tools necessary, and the technical difficulty is modest. Disadvantages of this method are that large amounts of data will be exhausted over time, there is a risk of data adjustments being made by mistake, and it does not restore data that has been erased. It will certainly be impractical if the hardware is destroyed. It ***can*** be useful for validating outcomes. 
2. ***Logical data extraction***: A standard interface between the workstation and the device is built using USB, Wi-Fi, or Bluetooth to send device data to the workstation. Technical complexity is minimal, but unintentional data changes may occur, and data access abstraction is high.  
3. ***Physical data extraction or hex dumping***: With the device in diagnostic mode, its flash memory is downloaded. This can be done with conventional interfaces, and works with devices that have little damage. Data analysis and decoding might be difficult (JTAG requires training). Access to all partitions is not guaranteed. 
4. ***Chip-off***: A binary image is extracted from the device's removed physical flash memory. This allows for traditional analysis, but can cause physical harm to the device. And examiners need training.
5. ***Micro read***: An electron microscope is used to examine logic gates on a physical level and the observations turned into readable, comprehensible data. This method is extremely resource-intensive and technically challenging.

## Android partitions

Partition layout varies between device manufacturers and versions. Some of the common partitions found in most of the Android devices:

* Bootloader – This partition stores the phone’s bootloader program. This program takes care of initialising the low-level hardware when the phone boots.
* Boot – As the name suggests, this partition has the information and files required for the phone to boot. It contains the kernel and RAM disk. 
* Recovery – Recovery partition allows the device to boot into the recovery console through which activities such as phone updates and other maintenance operations are done. A minimal Android boot image is stored as a failsafe.
* Userdata – This partition contains the device's internal storage for application data, the bulk of user data, and standard communications.
* System – All the major components other than kernel and RAM disk: the Android framework, libraries, system binaries, and preinstalled applications. 
* Cache – This partition is used to store frequently accessed data and various other files, such as recovery logs and update packages downloaded over the network.
* Radio – Devices with phone capabilities have a baseband image stored in this partition.

## Android logical data extraction

* Connect the device to a workstation.
* Enable ***USB debugging***.
* Enable the ***Stay awake*** setting.
* Increase ***screen timeout***.
* The device needs to be isolated from the network to make sure that remote wipe options do not work on the device.

### Connecting device to a workstation

1. Identify the device cable: The physical USB interface of an Android device might change from manufacturer to manufacturer and from device to device: Mini - A USB, Micro - B USB, Co-axial (Nokia), D Sub-miniature (Samsung and LG devices)
2. Install the device drivers if the device is not recognised. Because Android is allowed to be modified and customized by the manufacturers, there is no single generic driver that works for all Android devices. Each manufacturer writes its own proprietary drivers and distributes them over the internet. Some Android forensic toolkits come with some generic drivers or a set of the most widely used drivers.
3. Access: connect the unlocked Android device to the computer directly using the USB cable. The Android device will appear as a new drive, and you will be able to access the files on the external storage. Some older Android devices may not be accessible unless the ***Turn on USB storage*** option is enabled. In some Android phones (especially with HTC), the device may expose more than one functionality when connected with a USB cable. Mount it as a disk drive to access the SD card.
4. In order to give the best chance of accessing the evidence at a later date, if the device is unlocked, then turn on USB debugging if possible. 

### USB debugging

The primary function of this option is to enable communication between the Android device and a workstation on which the Android SDK is installed. On a Samsung phone, access this under ***Settings -> Developer Options***. Other Android phones may have different environments and configuration features. You may have to force the ***Developer Options*** option by accessing build mode.

In Android version 4.2 and above, the developer options screen is hidden. In order to turn on USB debugging go into the settings menu, and go to the ***About phone*** or ***About tablet***, and a field showing the Android ***build number*** appears. For Samsung, tap ***About phone***, then ***Software information*** to find ***build number***. If the android build number is tapped seven times, developer mode is enabled and the "Developer options" menu will appear above the "About phone" menu. From there, USB debugging can be turned on. You may also be able to adjust the Display Screen Timeout feature to extend the length of time before Auto-Lock is enabled.

Starting from Android 4.2.2, Google has introduced the Secure USB debugging option. It only allows hosts that are explicitly authorised by the user to connect to the device using ADB. 

When the ***USB debugging*** option is selected, the device will run the adb daemon (`adbd`) in the background and will continuously look for a USB connection. The daemon will usually run under a non-privileged shell user account and thus will not provide access to the complete data. However, on rooted phones, `adbd` will run under the `root` account and thus provide access to all the data. It is not recommended to ***root a device*** to gain full access unless all other forensic methods fail. Should you choose to root an Android device, the methods must be well-documented and tested prior to attempting it on real evidence.

### Use ADB

The Android Debug Bridge (ADB) is a programming tool for debugging Android-based devices. The daemon on the Android device communicates with the server on the host PC through USB or TCP, which communicates with the end-client users via TCP.

To get a list of all the devices connected to the forensic workstation:

    adb devices

To kill the local adb service:

    adb kill-server

To access the shell on an Android device and interact with the device:

```text
nina@tardis:~$ adb shell
a50:/ $ 
```

Many linux commands can be used. Use adb shell to determine if a device is rooted. The shell will appear one of two ways, either with `$` or `#`.

To extract data using adb pull (transfer files from the device to the local workstation):

```text
adb pull [-a] path/of/file/on/phone path/of/file/on/computer
```

The adb backup functionalityallows for backing up application data to a local computer over adb. ***This does not require root.*** When a developer makes an app, it is set to allow backups by default. It seems the vast majority of developers leave the default setting. Most Google applications disable backups; full application data from apps such as Gmail and Google Maps will therefor not be included.

```text
adb backup [-f <file>] [-apk|-noapk] [-obb|-noobb] [-shared|-noshared] [-all] [-system|-nosystem] [<packages…>]
```

When making a backup, the user must approve it on the device => backups cannot be made without bypassing screen locks.

The resulting backup data is stored as an `.ab` file but is actually a `.tar` file compressed with the ***Deflate*** algorithm. If a password was entered on the device when the backup was created, the file will also be ***AES*** encrypted. 

To add in a tar header, try opening the `.ab` file with a hex editor and replace the first 24 Bytes (`0x18`) with `1F 8B 08 00 00 00 00 00`, then save as `.tar.gz` file. For an encrypted backup, use [nelenkov / android-backup-extractor](https://github.com/nelenkov/android-backup-extractor/releases):

```text
java -jar abe.jar unpack /path/to/backup.ab /path/to/backup.tar <password>
```

### Stay awake

Enable the ***Stay awake*** setting: If the Stay awake option is selected and the device is connected for charging, then the device never locks. Again, if the device locks, the acquisition can be halted.

### Increase screen timeout

Screen timeout is the time for which the device will be effectively active once it is unlocked. The location to access this setting varies
depending upon the model of the device. On a Samsung Galaxy, you can set it by navigating to ***Settings -> Display -> ScreenTimeout***.

## Screen lock bypassing techniques

There are several types of screen lock mechanisms offered by Android:

* Android was the first smartphone to introduce a ***pattern lock***, a pattern or design on the phone and the same pattern must be drawn to unlock the device. 
* ***PIN code*** is the most common lock option and is a 4-digit number that needs to be entered to unlock the device. 
* Unlike the PIN, which takes four digits, the alphanumeric ***passcode*** includes letters, as well as digits.
* ***Smart Lock***, which can be a Trusted Face, Trusted Location, or a Trusted Device.

[Lock screens](https://android.stackexchange.com/questions/tagged/lock-screens) are the most challenging aspect of Android forensic examinations because there are over 12,000 different Android models from hundreds of different manufacturers, and things change fast. For example, Samsung intentionally builds phones which are extremely hard to break into. This is a conscious design decision, because many users do credit card payments, banking, and social media, where, if they would lose their phone and a bad person found it, an easy-to-break-into device would have potentially catastrophic results. Anyway, below are some ways that can be tried.

### Delete gesture.key

This method only works when the device is rooted. Also note, deleting the `gesture.key` file will remove the pattern lock on the device, but this will permanently change the device, as the pattern lock is gone. 

1. Connect the device to the forensic workstation using a USB cable.
2. Open the command prompt and execute:

```text
adb shell
cd /data/system
rm gesture.key
```

3. Reboot the device.
4. Unlock device with any pattern.

### Modified recovery mode

There are many enthusiastic Android users who install custom ROM through a modified recovery module. Custom recoveries come in many shapes and sizes (CWM, TWRP, etc.), made especially to flash custom ROMs (unofficial builds of Android) and to make under-the-hood changes and modifications to a device. And that can be used for a bypass.

1. Reboot into recovery mode (for example TWRP).
2. Go to ***Advanced -> File Manager*** 
3. Navigate to `\data\system` and locate the files you need to remove (for example `gesture.key`, `password.key`, `gatekeeper.pin.key` or `gatekeeper.pattern.key` file)
4. Long-press on the `*.key` file to reveal more options and choose ***Rename File***, and add the extension `.old` to the filename.
5. Confirm the renaming. 
6. Click ***Reboot System***. Lock screen has been removed completely or accepts any pattern/PIN/password.

### Flashing a new recovery partition

Most Android devices come with a locked bootloader. When Developer options are enabled, you can [unlock the bootloader](https://source.android.com/docs/core/architecture/bootloader/locking_unlocking) to flash new images. The fastboot utility can be used to flash the recovery partition of an Android device with a modified image. It is a diagnostic protocol that comes with the SDK package, used primarily to modify the flash file system through a USB connection from a host computer.

Once the recovery is flashed, boot the device in recovery mode, mount the `/data` and `/system` partitions, and use `adb` to remove the `gesture.key` file. Reboot the phone, and you should be able to bypass the screen lock.

### Using automated tools

There are several automated solutions available in the market for unlocking Android devices. Commercial tools, such as [XRY](https://www.msab.com/product/xry-extract/), are capable of bypassing the screen locks, but most of them require USB debugging to be enabled.

### Using device manager

Most Android phones come with a service called Android Device Manager, which helps the owner of a device to locate their lost phone. Such services can also be used to unlock a device, ***if*** the device runs Android 8 or lower. For Android 9 or higher, you may be prompted to provide the lock screen PIN for the Android device you want to locate, so it doesn't work. 

While Google has [Find My Device](https://www.google.com/android/find/), Samsung has [SmartThings Find](https://smartthingsfind.samsung.com/login). When you go to the site, log into the Samsung account. A map and a list on the left-hand side appears with all the Samsung devices that are associated with the account and are currently switched on, connected to Wi-Fi, and have Remote Unlock activated. Select the locked device, and the options in a window in the upper right are shown. One of those options is Unlock. Like Android Smart Lock, Remote Unlock must be set up in advance to be effective.

### Using the Forgot Password/Forgot Pattern option

Devices running on Android 4.4 and earlier have the default ***Forgot the Pattern*** kind of reset, and it uses the Google Account as the primary reset option.
Knowing the username and password of the primary Gmail address that is configured on the device, and if the Google account was saved on the device, it may be possible to change the PIN, password, or swipe on the device.

### Bypassing third-party lock screens

If the screen lock is a third-party app, rather than the built-in lock, it can be bypassed by booting into safe mode and disabling it. To boot into safe mode on Android device 4.1 or later, 

1. Long-press the power button until the power options menu appears. 
2. Long-press the Power Off option, and you'll be asked if you want to reboot your Android device into safe mode. Tap the OK button.
3. In safe mode, disable the third-party lock screen app or uninstall it.
4. Reboot the device, and you should be able to access it without any lock screen.

## Rooting

Rooting a device may void a warranty, since root opens the system to vulnerabilities and provides the user with superuser capabilities. 

The process of rooting varies depending on the underlying device manufacturer. However, rooting any device usually involves exploiting a security bug in the device's firmware and then copying the `su` (superuser) binary to a location in the current process's path (`/system/xbin/su`) and granting it executable permissions with the `chmod` command.

Most of the rooting methods begin by flashing a modified recovery to the recovery partition. After that, you can issue an update, which can root the device. 

Starting from Android 7.x, Google has started strictly enforcing [verified boot](https://source.android.com/docs/security/features/verifiedboot/verified-boot) on devices, to guarantee that the software on the device is not modified before booting into the normal mode, and Samsung [patched the kernel to prevent root access](https://en.wikipedia.org/wiki/Samsung_Knox) from being granted to apps even after rooting was successful since the release of Android Oreo. This patch prevents unauthorized apps from changing the system and deters rooting. The tip of the iceberg. 

There are over 12,000 different Android models from hundreds of different manufacturers. Almost all of them have been designed so that they are hard to root. For more information about rooting Android phones, check [XDA Developers](https://www.xda-developers.com/root/) for the particular model. 

## Resources

* [Android Debug Bridge (adb)](https://developer.android.com/tools/adb)
* [Kingo SuperUser](https://www.kingoapp.com/)
* [How to do a forensic analysis of Android 11 artifacts](https://www.semanticscholar.org/paper/How-to-do-a-forensic-analysis-of-Android-11-Delija-Sudec/e9e48ca6c3a5a21c6233c30f220db1a82a89441e)
* [Odin](https://www.androidcentral.com/root)
* [Heimdall](https://github.com/Benjamin-Dobell/Heimdall)