# Android analysis

## Filesystem hierarchy

The file hierarchy in Android resembles a [Linux file system hierarchy](linux.md), but based on the device manufacturer and the underlying Linux version, it may have a few insignificant changes. 

* The `/boot` partition has the information and files required for the phone to boot. It contains the kernel and RAM disk. Data residing in RAM is rich in value and can be captured during a forensic acquisition. 
* The `/system` partition contains system-related files other than the kernel and RAM disk. Never delete.
* `/recovery` is designed for backup purposes and allows the device to boot into recovery mode.
* The `/data` contains the data of each application. Most of the data belonging to the user, such as the contacts, SMS, and dialed numbers, is stored in this folder.
* `/cache` is used to store the frequently accessed data and some logs for faster retrieval. The data residing here may no longer be present in the `/data`partition.
* `/misc` contains information about miscellaneous settings. These settings mostly define the state of the device (on/off), hardware settings, USB settings, etc.
* The `/sdcard` partition tholds all the information present on the SD card. It is valuable as it can contain information such as pictures, videos, files, documents, and so on.

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

The `tmpfs` file system is a temporary storage on the device that stores the files in RAM (volatile memory). The main advantage of using RAM is faster access and retrieval. But, once the device is restarted or switched off, this data will not be accessible anymore. Hence, it's important to examine the data in RAM before a device reboot happens, or to extract the data via RAM acquisition methods.

## File system types

Yet Another Flash File System 2 (YAFFS2) is an open source, single-threaded file system released in 2002. It is mainly designed to be fast when dealing with the NAND flash. YAFFS2 utilizes out of band (OOB), and this is often not captured or decoded correctly during forensic acquisition, which makes analysis difficult. In 2010, there was an announcement stating that in releases after Gingerbread, devices were going to move from YAFFS2 to EXT4. 

The EXT4 file system, the fourth extended file system, has gained significance with mobile devices implementing dual-core processors. 

VFAT is an extension to the FAT16 and FAT32 file systems. Microsoft's FAT32 file system is supported by most Android devices. It is supported by almost all the major operating systems, including Windows, Linux, and macOS. This enables these systems to easily read, modify, and delete the files present on the FAT32 portion of the Android device. Most of the external SD cards are formatted using the FAT32 file system.

Flash Friendly File System (F2FS) was released in February 2013 to support Samsung devices running the Linux 3.8 kernel. F2FS relies on log-structured methods that optimize the NAND flash memory (supporting offline support features). 

Robust File System (RFS) supports NAND flash memory on Samsung devices. RFS can be summarized as a FAT16 (or FAT32) file system where journaling is enabled through a transaction log.

## Application data storage

Android devices store a lot of sensitive data through the use of apps installed by the manufacturer, that come along with Android, wireless, and apps installed by the user from various sources. These store different types of data on the device, which contain information that may be relevant to an investigation.

Data belonging to applications can be stored internally or externally. In the case of external storage (SD card), data can be stored anywhere. In the case of internal storage, the location is in the `/data/data` subdirectory. For example, the default Android email app has a package named `com.android.email`, and the internal data is stored in `/data/data/com.android.email`.

* ***Shared Preferences*** provides a framework to store key-value pairs of primitive data types in the `.xml` format. Primitive data types include Boolean, float, int, long, and string. Strings are stored in the Universal Character Set Transformation Format-8 (UTF-8) format. These files are stored in the application's `/data/data/<package_name>/shared_prefs` path.
*  The files stored in the internal storage are located in the application's `/data/data` subdirectory. This data is private and cannot be accessed by other applications. Even the device owner is prevented from accessing the files (except `root`).
* External storage can be any removable media. In the case of a removable SD card, data can be used on other devices just by removing the SD card and inserting it into any other device. SD cards are usually formatted with the FAT32 filesystem, but other filesystems, such as EXT3 and EXT4, can also be used. This data is public and can be accessed by other applications, if the requesting app has the necessary permissions. Large files, such as images and videos, loaded by an app are often stored in external storage for faster retrieval.
* SQLite is a popular database format present in many mobile systems, and a source of forensic data. The SQLite files used by the apps are stored at `/data/data/<ApplicationPackageName>/databases`. 
* The network can also be used to store and retrieve data on a user's web-based services. To do network operations, the classes in the `java.net.*` and `android.net.*` packages are used to provide developers with the low-level APIs that are necessary to interact with the network, web servers, etc.

## Analysing an image using Autopsy

1. Open the Autopsy tool and select the Create New Case option.
2. Enter all the necessary case details, including the name of the case, the location where data needs to be stored, ... and click ***Next***.
3. Enter a case number and researcher details, and click on ***Finish***.
4. Click on the ***Add Data Source*** button, add the image file to be analysed, set the correct time zone and click on ***Next***.
5. Choose the modules you want to run on the image: `Android Analyzer`, `Exif Parser`, `Keyword Search`, `PhotoRec Carver`, and `Recent Activity` at minimum. Maybe also the `Extension Mismatch Detector`. Click on ***Next***.

It takes a few minutes to parse through the image depending on its size. There may be some errors or warning messages.

When the image is loaded, expand the file present under Data Sources to see data present in the image: Call logs, contacts, GPS trackpoints and messages are extracted by Android Analyzer module, EXIF metadata is extracted by EXIF Parser module, files with wrong extensions are detected by Extension Mismatch Detector module, and web cookies, web downloads, web history/web searches are extracted by Recent Activity module. And Autopsy also supports automatic deleted files recovery from ext4 file systems.

By the way, Autopsy also has a `iOS Forensics using iLEAPP` module.

## Resources

* [About DFIR/Tools & Artifacts > Android](https://aboutdfir.com/toolsandartifacts/android/)
* [SANS: A Forensic Analysis of Android Mobile Private Browsing Artifacts](https://sansorg.egnyte.com/dl/t22LV8S8y9), Lee Crognale, 2022
