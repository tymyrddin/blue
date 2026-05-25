# Android

## Extraction methods

1. Manual data extraction: This method is navigating the device as a normal user, using touch controls, screen controllers, and keyboards to access the information stored on the device and to record input directly from the screen. There are no special tools necessary, and the technical difficulty is modest. Disadvantages of this method are that large amounts of data will be exhausted over time, there is a risk of data adjustments being made by mistake, and it does not restore data that has been erased. It will certainly be impractical if the hardware is destroyed. It can be useful for validating outcomes.
2. Logical data extraction: A standard interface between the workstation and the device is built using USB, Wi-Fi, or Bluetooth to send device data to the workstation. Technical complexity is minimal, but unintentional data changes may occur, and data access abstraction is high.
3. Physical data extraction or hex dumping: With the device in diagnostic mode, its flash memory is downloaded. This can be done with conventional interfaces, and works with devices that have little damage. Data analysis and decoding might be difficult (JTAG requires training). Access to all partitions is not guaranteed.
4. Chip-off: A binary image is extracted from the device's removed physical flash memory. This allows for traditional analysis, but can cause physical harm to the device. And examiners need training.
5. Micro read: An electron microscope is used to examine logic gates on a physical level and the observations turned into readable, comprehensible data. This method is extremely resource-intensive and technically challenging.

## Android partitions

Partition layout varies between device manufacturers and versions. Some common partitions:

* Bootloader: stores the phone's bootloader program, which initialises the low-level hardware when the phone boots.
* Boot: contains the kernel and RAM disk required for the phone to boot.
* Recovery: allows the device to boot into the recovery console for updates and maintenance. A minimal Android boot image is stored as a failsafe.
* Userdata: contains the device's internal storage for application data, the bulk of user data, and standard communications.
* System: all the major components other than kernel and RAM disk, including the Android framework, libraries, system binaries, and preinstalled applications.
* Cache: stores frequently accessed data and various other files such as recovery logs and update packages downloaded over the network.
* Radio: devices with phone capabilities have a baseband image stored here.

## Logical data extraction

* Connect the device to a workstation.
* Enable ***USB debugging***.
* Enable the ***Stay awake*** setting.
* Increase ***screen timeout***.
* The device needs to be isolated from the network to make sure that remote wipe options do not work on the device.

### Connecting to a workstation

1. Identify the device cable: The physical USB interface of an Android device might change from manufacturer to manufacturer and from device to device: Mini-A USB, Micro-B USB, Co-axial (Nokia), D Sub-miniature (Samsung and LG devices).
2. Install the device drivers if the device is not recognised. Because Android is allowed to be modified and customised by the manufacturers, there is no single generic driver that works for all Android devices. Each manufacturer writes its own proprietary drivers and distributes them over the internet. Some Android forensic toolkits come with some generic drivers or a set of the most widely used drivers.
3. Connect the unlocked Android device to the computer directly using the USB cable. The Android device will appear as a new drive. Some older Android devices may not be accessible unless the ***Turn on USB storage*** option is enabled. In some Android phones (especially with HTC), the device may expose more than one functionality when connected with a USB cable. Mount it as a disk drive to access the SD card.
4. If the device is unlocked, turn on USB debugging if possible, to give the best chance of accessing the evidence at a later date.

### USB debugging

The primary function of this option is to enable communication between the Android device and a workstation on which the Android SDK is installed. On a Samsung phone, access this under ***Settings -> Developer Options***. Other Android phones may have different environments and configuration features. You may have to force the ***Developer Options*** option by accessing build mode.

In Android 4.2 and above, the developer options screen is hidden. To turn on USB debugging, go into the settings menu, then to ***About phone*** or ***About tablet***, where a field showing the Android ***build number*** appears. For Samsung, tap ***About phone***, then ***Software information*** to find ***build number***. Tapping the Android build number seven times enables developer mode and the "Developer options" menu will appear above the "About phone" menu. From there, USB debugging can be turned on.

From Android 4.2.2, Google introduced the Secure USB debugging option. It only allows hosts that are explicitly authorised by the user to connect to the device using ADB.

When the ***USB debugging*** option is selected, the device will run the adb daemon (`adbd`) in the background and will continuously look for a USB connection. The daemon will usually run under a non-privileged shell user account and thus will not provide access to the complete data. However, on rooted phones, `adbd` will run under the `root` account and thus provide access to all the data. It is not recommended to root a device to gain full access unless all other forensic methods fail. If rooting is necessary, the methods are worth documenting and testing thoroughly before attempting on real evidence.

### ADB

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

The adb backup functionality allows for backing up application data to a local computer over adb. This does not require root. When a developer makes an app, it is set to allow backups by default. It seems the vast majority of developers leave the default setting. Most Google applications disable backups; full application data from apps such as Gmail and Google Maps will therefore not be included.

```text
adb backup [-f <file>] [-apk|-noapk] [-obb|-noobb] [-shared|-noshared] [-all] [-system|-nosystem] [<packages…>]
```

When making a backup, the user must approve it on the device; backups cannot be made without bypassing screen locks.

The resulting backup data is stored as an `.ab` file but is actually a `.tar` file compressed with the Deflate algorithm. If a password was entered on the device when the backup was created, the file will also be AES encrypted.

To add in a tar header, try opening the `.ab` file with a hex editor and replace the first 24 Bytes (`0x18`) with `1F 8B 08 00 00 00 00 00`, then save as `.tar.gz` file. For an encrypted backup, use [nelenkov / android-backup-extractor](https://github.com/nelenkov/android-backup-extractor/releases):

```text
java -jar abe.jar unpack /path/to/backup.ab /path/to/backup.tar <password>
```

### Stay awake

Enable the ***Stay awake*** setting: If the Stay awake option is selected and the device is connected for charging, the device never locks. If the device locks, the acquisition can be halted.

### Screen timeout

Screen timeout is the time for which the device will be effectively active once it is unlocked. The location to access this setting varies depending upon the model of the device. On a Samsung Galaxy, set it by navigating to ***Settings -> Display -> ScreenTimeout***.

## Screen lock bypass

There are several types of screen lock mechanisms offered by Android:

* Pattern lock: a pattern or design on the phone where the same pattern is drawn to unlock the device.
* PIN code: the most common lock option, a 4-digit number that needs to be entered to unlock.
* Passcode: like the PIN, but alphanumeric, including letters as well as digits.
* Smart Lock: can be a Trusted Face, Trusted Location, or a Trusted Device.

Lock screens are the most challenging aspect of Android forensic examinations because there are over 12,000 different Android models from hundreds of different manufacturers, and things change fast. Below are some approaches worth trying.

### Delete gesture.key

This method only works when the device is rooted. Deleting the `gesture.key` file removes the pattern lock on the device, but this permanently changes the device.

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

Custom recoveries (CWM, TWRP, etc.) are made to flash custom ROMs and make under-the-hood modifications to a device. That can also be used for a bypass.

1. Reboot into recovery mode (for example TWRP).
2. Go to ***Advanced -> File Manager***
3. Navigate to `\data\system` and locate the files to remove (for example `gesture.key`, `password.key`, `gatekeeper.pin.key` or `gatekeeper.pattern.key`)
4. Long-press on the `*.key` file to reveal more options and choose ***Rename File***, and add the extension `.old` to the filename.
5. Confirm the renaming.
6. Click ***Reboot System***. Lock screen has been removed completely or accepts any pattern/PIN/password.

### Flashing a new recovery partition

Most Android devices come with a locked bootloader. When Developer options are enabled, you can [unlock the bootloader](https://source.android.com/docs/core/architecture/bootloader/locking_unlocking) to flash new images. The fastboot utility can be used to flash the recovery partition of an Android device with a modified image. It is a diagnostic protocol that comes with the SDK package, used primarily to modify the flash file system through a USB connection from a host computer.

Once the recovery is flashed, boot the device in recovery mode, mount the `/data` and `/system` partitions, and use `adb` to remove the `gesture.key` file. Reboot the phone, and the screen lock can then be bypassed.

### Automated tools

Several automated solutions are available for unlocking Android devices. Commercial tools, such as [XRY](https://www.msab.com/product/xry-extract/), are capable of bypassing screen locks, but most of them require USB debugging to be enabled.

### Device manager

Most Android phones come with a service called Android Device Manager, which helps the owner of a device to locate their lost phone. Such services can also be used to unlock a device, ***if*** the device runs Android 8 or lower. For Android 9 or higher, you may be prompted to provide the lock screen PIN for the Android device you want to locate, so it doesn't work.

While Google has [Find My Device](https://www.google.com/android/find/), Samsung has [SmartThings Find](https://smartthingsfind.samsung.com/login). When you go to the site, log into the Samsung account. A map and a list on the left-hand side appears with all the Samsung devices that are associated with the account and are currently switched on, connected to Wi-Fi, and have Remote Unlock activated. Select the locked device, and the options in a window in the upper right are shown. One of those options is Unlock. Like Android Smart Lock, Remote Unlock must be set up in advance to be effective.

### Forgot Password/Forgot Pattern

Devices running on Android 4.4 and earlier have the default ***Forgot the Pattern*** kind of reset, and it uses the Google Account as the primary reset option. Knowing the username and password of the primary Gmail address configured on the device, and if the Google account was saved on the device, it may be possible to change the PIN, password, or swipe.

### Third-party lock screens

If the screen lock is a third-party app rather than the built-in lock, it can be bypassed by booting into safe mode and disabling it. To boot into safe mode on Android 4.1 or later:

1. Long-press the power button until the power options menu appears.
2. Long-press the Power Off option, and you'll be asked if you want to reboot into safe mode. Tap OK.
3. In safe mode, disable the third-party lock screen app or uninstall it.
4. Reboot the device, and the lock screen will be gone.

## Rooting

Rooting a device may void a warranty, since root opens the system to vulnerabilities and provides the user with superuser capabilities.

The process of rooting varies depending on the underlying device manufacturer. However, rooting any device usually involves exploiting a security bug in the device's firmware and then copying the `su` (superuser) binary to a location in the current process's path (`/system/xbin/su`) and granting it executable permissions with the `chmod` command.

Most of the rooting methods begin by flashing a modified recovery to the recovery partition. After that, you can issue an update, which can root the device.

Starting from Android 7.x, Google has started strictly enforcing [verified boot](https://source.android.com/docs/security/features/verifiedboot/verified-boot) on devices, to guarantee that the software on the device is not modified before booting into the normal mode, and Samsung [patched the kernel to prevent root access](https://en.wikipedia.org/wiki/Samsung_Knox) from being granted to apps even after rooting was successful since the release of Android Oreo. This patch prevents unauthorised apps from changing the system and deters rooting. The tip of the iceberg.

There are over 12,000 different Android models from hundreds of different manufacturers. Almost all of them have been designed so that they are hard to root. For more information about rooting Android phones, check [XDA Developers](https://www.xda-developers.com/root/) for the particular model.

## Filesystem hierarchy

The file hierarchy in Android resembles a [Linux file system hierarchy](linux.md), but based on the device manufacturer and the underlying Linux version, it may have a few insignificant changes.

* The `/boot` partition has the information and files required for the phone to boot. It contains the kernel and RAM disk. Data residing in RAM is rich in value and can be captured during a forensic acquisition.
* The `/system` partition contains system-related files other than the kernel and RAM disk. Never delete.
* `/recovery` is designed for backup purposes and allows the device to boot into recovery mode.
* The `/data` contains the data of each application. Most of the data belonging to the user, such as the contacts, SMS, and dialed numbers, is stored in this folder.
* `/cache` is used to store the frequently accessed data and some logs for faster retrieval. The data residing here may no longer be present in the `/data` partition.
* `/misc` contains information about miscellaneous settings. These settings mostly define the state of the device (on/off), hardware settings, USB settings, etc.
* The `/sdcard` partition holds all the information present on the SD card. It is valuable as it can contain information such as pictures, videos, files, documents, and so on.

## Filesystem

The file systems supported by the Android kernel can be determined by checking the contents of the filesystems file in the `proc` folder:

    root@android:/ # cat /proc/filesystems

The mount command displays different partitions available on the device:

    root@android:/ # mount

The root file system (`rootfs`) is one of the main components of Android and contains all the information required to boot the device. When the device starts the boot process, it needs access to many core files, and thus, it mounts the root file system. This file system is mounted at `/` (root folder), and is the file system on which all the other file systems are slowly mounted. If this file system is corrupt, the device cannot be booted.

The `sysfs` file system mounts the `/sys` folder, which contains information about the configuration of the device:

    root@android:/ # cd /sys
    root@android:/sys # ls

The data present in these folders is mostly related to configuration, and not usually of much significance to a forensic investigator, unless it is necessary to check whether a particular setting was enabled on the phone.

The `devpts` file system presents an interface to the Terminal session on an Android device. It is mounted at `/dev/pts`. Whenever a Terminal connection is established, for instance, when an adb shell is connected to an Android device, a new node is created under `/dev/pts`.

The `cgroup` file system stands for control groups. Android devices use this file system to track their jobs. They are responsible for aggregating the tasks and keeping track of them. This data is generally not very useful during forensic analysis.

The `proc` file system contains information about kernel data structures, processes, and other system-related information under the `/proc` directory. For example, `/proc/filesystems` displays the list of available file systems on the device.

    root@android:/ # cat /proc/cpuinfo

The `tmpfs` file system is a temporary storage on the device that stores the files in RAM (volatile memory). The main advantage of using RAM is faster access and retrieval. But, once the device is restarted or switched off, this data will not be accessible. It is important to examine the data in RAM before a device reboot, or to extract the data via RAM acquisition methods.

## File system types

Yet Another Flash File System 2 (YAFFS2) is an open source, single-threaded file system released in 2002. It is mainly designed to be fast when dealing with the NAND flash. YAFFS2 utilises out of band (OOB), and this is often not captured or decoded correctly during forensic acquisition, which makes analysis difficult. In 2010, there was an announcement stating that in releases after Gingerbread, devices were going to move from YAFFS2 to EXT4.

The EXT4 file system, the fourth extended file system, has gained significance with mobile devices implementing dual-core processors.

VFAT is an extension to the FAT16 and FAT32 file systems. Microsoft's FAT32 file system is supported by most Android devices. It is supported by almost all the major operating systems, including Windows, Linux, and macOS. This enables these systems to easily read, modify, and delete the files present on the FAT32 portion of the Android device. Most of the external SD cards are formatted using the FAT32 file system.

Flash Friendly File System (F2FS) was released in February 2013 to support Samsung devices running the Linux 3.8 kernel. F2FS relies on log-structured methods that optimise the NAND flash memory (supporting offline support features).

Robust File System (RFS) supports NAND flash memory on Samsung devices. RFS can be summarised as a FAT16 (or FAT32) file system where journaling is enabled through a transaction log.

## Application data storage

Android devices store a lot of sensitive data through the use of apps installed by the manufacturer, that come along with Android, wireless, and apps installed by the user from various sources. These store different types of data on the device, which contain information that may be relevant to an investigation.

Data belonging to applications can be stored internally or externally. In the case of external storage (SD card), data can be stored anywhere. In the case of internal storage, the location is in the `/data/data` subdirectory. For example, the default Android email app has a package named `com.android.email`, and the internal data is stored in `/data/data/com.android.email`.

* Shared Preferences provides a framework to store key-value pairs of primitive data types in the `.xml` format. Primitive data types include Boolean, float, int, long, and string. Strings are stored in the Universal Character Set Transformation Format-8 (UTF-8) format. These files are stored in the application's `/data/data/<package_name>/shared_prefs` path.
* The files stored in the internal storage are located in the application's `/data/data` subdirectory. This data is private and cannot be accessed by other applications. Even the device owner is prevented from accessing the files (except `root`).
* External storage can be any removable media. In the case of a removable SD card, data can be used on other devices just by removing the SD card and inserting it into any other device. SD cards are usually formatted with the FAT32 filesystem, but other filesystems, such as EXT3 and EXT4, can also be used. This data is public and can be accessed by other applications, if the requesting app has the necessary permissions. Large files, such as images and videos, loaded by an app are often stored in external storage for faster retrieval.
* SQLite is a popular database format present in many mobile systems, and a source of forensic data. The SQLite files used by the apps are stored at `/data/data/<ApplicationPackageName>/databases`.
* The network can also be used to store and retrieve data on a user's web-based services. To do network operations, the classes in the `java.net.*` and `android.net.*` packages are used to provide developers with the low-level APIs that are necessary to interact with the network, web servers, etc.

## Analysing an image with Autopsy

1. Open the Autopsy tool and select the Create New Case option.
2. Enter all the necessary case details, including the name of the case, the location where data needs to be stored, and click ***Next***.
3. Enter a case number and researcher details, and click on ***Finish***.
4. Click on the ***Add Data Source*** button, add the image file to be analysed, set the correct time zone and click on ***Next***.
5. Choose the modules you want to run on the image: `Android Analyzer`, `Exif Parser`, `Keyword Search`, `PhotoRec Carver`, and `Recent Activity` at minimum. Maybe also the `Extension Mismatch Detector`. Click on ***Next***.

It takes a few minutes to parse through the image depending on its size. There may be some errors or warning messages.

When the image is loaded, expand the file present under Data Sources to see data present in the image: Call logs, contacts, GPS trackpoints and messages are extracted by Android Analyzer module, EXIF metadata is extracted by EXIF Parser module, files with wrong extensions are detected by Extension Mismatch Detector module, and web cookies, web downloads, web history/web searches are extracted by Recent Activity module. Autopsy also supports automatic deleted files recovery from ext4 file systems.

By the way, Autopsy also has an `iOS Forensics using iLEAPP` module.

## Resources

* [Android Debug Bridge (adb)](https://developer.android.com/tools/adb)
* [About DFIR/Tools & Artifacts > Android](https://aboutdfir.com/toolsandartifacts/android/)
* [How to do a forensic analysis of Android 11 artifacts](https://www.semanticscholar.org/paper/How-to-do-a-forensic-analysis-of-Android-11-Delija-Sudec/e9e48ca6c3a5a21c6233c30f220db1a82a89441e)
* [Kingo SuperUser](https://www.kingoapp.com/)
* [Odin](https://www.androidcentral.com/root)
* [Heimdall](https://github.com/Benjamin-Dobell/Heimdall)
