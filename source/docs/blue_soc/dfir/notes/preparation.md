# Preparing for acquisition

Assuming "dead" disk acquisition (drives and PCs already powered off):

* Understanding the host hardware configuration is useful for performance tuning, capacity planning, maintaining a stable platform, troubleshooting, isolating faults, and reducing the risk of human error. 
* After physically attaching the subject drive to the examiner workstation (using a write-blocking mechanism), identify the block device associated with the subject drive: list the storage media devices, confirm any unique identifiers associated with the physical drive, and determine the corresponding device file in `/dev`.
* Query the drive for firmware and SMART information.
* If need be, remove HPA and DCO, and security built into the hardware of some drives.

## Image sizes and disk space requirements

* Can the attached storage be analysed in place without taking a forensic image?
* What is the size of the subject disk?
* What is the available space on the examiner’s machine? 
* What is the potential for image compression?
* How much space do forensic tools need for processing and temporary files?
* What is the estimated number of files to be extracted for further analysis?
* How much memory and swap space is available on the examiner’s machine?
* Is there a possibility of more subject disks being added to the same case or incident?
* Is there an expectation to separately extract all slack or unallocated disk space?
* Are there plans to extract individual partitions (possibly including swap)?
* Is there a potential need to convert from one forensic format to another?
* Do disk images need to be prepared for transport to another location?
* Do subject disks contain virtual machine images to separately extract and analyse?
* Do subject disks contain large numbers of compressed and archive files?
* Are subject disks using full-disk encryption?
* Is there a need to burn images to another disk or DVDs for storage or transport?
* Is there a need to carve files from a damaged or partially overwritten filesystem?
* How are backups of the examiner host performed?

## Hardware

For a quick overview of the host hardware:

    # lshw -businfo

To specifically look for an attached device type:

    # lshw -businfo -class storage
    # lshw -businfo -class disk

List all devices attached to the PCI bus:

    # lspci

Lists all SATA mass storage controller (class ID 01, subclass ID 06) devices:

    # lspci -d ::0106

Enumerate all the SCSI, IDE, RAID, ATA, SATA, SAS, and NVME mass storage controller devices:

    # for i in 00 01 04 05 06 07 08; do lspci -d ::01$i; done

List all devices with the USB serial bus controller class (class ID 0C, subclass ID 03):

    # lspci -d ::0C03

List all FireWire, USB, and Fibre Channel serial bus controllers:

    # for i in 00 03 04; do lspci -d ::0C$i; done

If a drive is attached via USB, it will not appear on the PCI bus. List USB devices separately using `lsusb`:

    # lsusb -v

## Subject drive

Retrieve more information by specifying a disk's `vendor:productID`:

    # lsusb -vd 0781:5583

`lsscsi` is useful for linking kernel device paths with device files in `/dev`:

    # lsscsi -v

To determine which device was added at a known time:

    # dmesg -T

## Disk capabilities and features

The `hdparm` tool operates by sending requests to the OS disk drivers (using `ioctls`) to retrieve information about the disk. From a forensics perspective, a number of items may be of interest or useful to document:

* Details about the drive geometry (physical and logical)
* The disk's supported standards, features, and capabilities
* States and flags related to the drive configuration
* DCO and HPA information
* Security information
* Vendor information, such as make, model, and serial number
* The WWN device identifier (if it exists)
* Time needed for secure erase (for most disks, this is roughly the acquisition time)

```text
# hdparm -I /dev/sda
```

The `smartctl` command is part of the smartmontools package and provides access to the SMART interface built into nearly all modern hard drives. The `smartctl` command queries attached ATA, SATA, SAS, and SCSI hardware. SMART provides a number of variables and statistics about a disk, some of which could be of interest to a forensic investigator:

* Statistics about errors on the disk and the overall health of the disk
* Number of times the disk was powered on
* Number of hours the disk was in operation
* Number of bytes read and written (often expressed in gigabytes)
* Various SMART logs (temperature history, ...)

```text
# smartctl -x /dev/sda
```

## Hidden sectors

### DCO

Detection:

```text
# hdparm -I /dev/sdl
```

Query for the features modified by a DCO:

    # hdparm --dco-identify /dev/sdl

Run `hdparm` to ensure the drive configuration is not locked or frozen:

```text
# hdparm -I /dev/sdl
...
Security:
...
    not locked
    not frozen
...
```

If frozen, hot plugging the drive power cable after booting could make the drive spin up in an unfrozen state.

Running the `hdparm` command with the `--dco-restore` option:

```text
# hdparm --yes-i-know-what-i-am-doing --dco-restore /dev/sdl
/dev/sdl:
 issuing DCO restore command
```

Run `hdparm -I /dev/sdl` again and note the DCO hidden area's exact sector offset, useful for extracting only the DCO sectors for separate analysis.

The tableau-parm tool has an `-r` flag that should remove the DCO (and possibly the HPA) from the drive.

### HPA

Detection:

```text
# hdparm -N /dev/sdl

/dev/sdl:
 max sectors = 879095852/976773168, HPA is enabled
```

To (temporarily) temporarily remove the HPA:

```text
# hdparm --yes-i-know-what-i-am-doing -N 976773168 /dev/sdl
```

For permanent removal:

```text
# hdparm --yes-i-know-what-i-am-doing -N p976773168 /dev/sdl
```

As with DCO, note the HPA hidden area's exact sector offset, useful for extracting only the HPA sectors for separate analysis.

### System area

Access to the system area (service area, negative sectors, or maintenance sectors) is done through proprietary vendor commands, which are usually not public. In some cases, it is possible to bypass the standard SATA, USB, or SAS interfaces and access storage media using debug or diagnostic ports built into the drive electronics. Media access in this manner is not standard across manufacturers or even across drives from the same manufacturer.

Some commercial tools exist (see ACELab PC-3000 and Atola Insight Forensic).

## Security features

### Passwords

The `Security` output from `hdparm` will indicate if a drive is frozen. Many USB bridges automatically spin up an attached disk in an unfrozen state, but if a problem persists, try:

* Checking the BIOS for settings to enable/disable the freeze command
* Use a forensic boot CD that prevents freeze commands from being issued
* Attach the disk to a separate controller card (not built into the mainboard)
* Hot plug the disk into the system (if supported)
* Use a mainboard that does not issue freeze commands

If the user password is known and the drive security is not frozen, unlock the drive with:

```text
# hdparm --security-unlock "user password" /dev/sdb
```

If the master password is known and the security level is set to `high`, use the master password to unlock the drive with:

```text
# hdparm --user-master m --security-unlock "master password" /dev/sdb
```

If no passwords are known, access to the disk is not possible with regular tools. The password information is stored on the service/system areas of a disk and is generally not accessible without special hardware or tools. But ...

* The master password might be set to a factory default and can be used to gain access to the drive (if the security level is set to high and not maximum).
* Using brute force is not efficient, because the drive must be reset after five failed attempts, but with a small set of likely passwords, worth a try.
* It may be that passwords are hidden or stored in an accessible location.
* Passwords may have been reused across different accounts or devices.
* The password may be volunteered by the owner (like the victim) or a cooperating accomplice.
* A person may be legally compelled to provide passwords.
* Key escrow or backups may provide passwords.
* Specialized data recovery companies provide services and hardware tools that can recover or reset ATA Security Feature Set passwords from the service areas of a disk. Data recovery firms often list the disks they support.
* The hard disk vendor may be able to provide assistance to disable or reset the ATA password.
* Hardware and firmware hacks and published methods by researchers may exist that provide access for certain hard drive models.

### SED

Self-encrypting drives (SEDs) are a form of full-disk encryption (FDE), but unlike software-based FDE (TrueCrypt, FileVault, LUKS, and so on) where the OS manages the encryption, SEDs have encryption capabilities built directly into the drive electronics and firmware. SEDs are OS-agnostic and based on vendor-independent standards.

When an Opal disk is in a locked state, only the shadow MBR is visible to the host. It is a group of unencrypted sectors that is executed as a normal MBR. This alternate boot area can execute code to request a password, access a Trusted Platform Module (TPM) chip or smartcard, or get other credentials. Once the disk has been unlocked, the proper MBR becomes visible, and a normal boot process can begin.

The `sedutil` tool was created to manage Opal SED encryption under Linux.

To scan the local system for all Opal-compliant SED drives:

```text
# sedutil-cli --scan
```

To query a drive to find information about the Opal status:

```text
# sedutil-cli --query /dev/sda
```

To disable locking (with password password):

```text
# sedutil-cli --disableLockingRange 0 password /dev/sda
```

To tell the disk the shadow MBR is not needed (with password password):

```text
# sedutil-cli --setMBRDone on password /dev/sda
```

Try the status command again, and if it is no longer locked, and the shadow MBR no longer visible, the proper MBR and the rest of the decrypted disk are available, and they can be accessed with regular forensic tools.

***WARNING***: Some Opal disks may behave differently with this tool. In real scenarios, the key might not be a simple password but instead be tied to the TPM or some other security mechanism. If the wrong commands are given, the data on the disk can be irrevocably destroyed (in an instant if the key is destroyed).

### Encrypted flash thumb drives

USB thumb drives sold as "secure" devices often come with a proprietary software encryption solution provided by the vendor. Some drives offer OS-independent encryption with authentication using keypads, fingerprint readers, or smartcards.

## Removable media

### Optical media drives

To get details about an attached optical drive (internal or external):

    # cd-drive

To retrieve information about inserted media:

    # cd-info

### Magnetic tape drives

To retrieve information about the drive vendor, serial number, and device information:

    # lshw -class tape

When a tape device is attached to a Linux system, a number of devices are created for it:

    # ls -1 /dev/*st0*

The `st*` devices auto-rewind the tape after each command (which is not always desired), and the `nst*` devices are the non-rewinding devices. For forensic acquisition, use the `nst*` devices (without an additional `a`, `l`, or `m` character).

To query the status of an LTO tape drive with a loaded tape:

    # tapeinfo -f /dev/nst0

To rewind a tape and take it offline (eject):

    # mt -f /dev/nst0 status

### Memory cards

Memory cards typically attach to a host using a USB adapter with multiple slots for different types of memory cards. When attached, the adapter creates a removable SCSI device for each slot (even when the slots are empty).

Inserted media are made available as USB mass storage devices with a linear sequence of "sectors", which can be forensically acquired.

Hardware-querying tools, such as hdparm and smartctl, may produce unreliable results, because memory cards do not have the ATA features of more complex drives with dedicated drive circuitry.

## Other storage devices

### Apple

TDM allows Apple computers with OpenBoot firmware or newer firmware to boot into a state where the Mac system appears as an external disk enclosure and the internal disks are available as SCSI target devices. Connect it to a Linux machine using a Thunderbolt to FireWire adapter, and boot the Apple device while holding the T key.

### NVME drives

NVME drives compete with SATA Express in the way they attach directly to a PCI Express bus. Use the `nvme` tool from the `nvme-cli` software package to list the attached NVME devices, and check each NVME drive for multiple namespaces (`# nvme list-ns /dev/nvme1`).

### Devices with block or character access

* Any device that is detected as a block device by the Linux kernel can be imaged. 
* Some devices will appear as a block device the moment they are attached to the host system. Some devices need to be switched into a different "disk" mode before they can become accessible as a block device. Most likely, this mode can be selected from the device's user interface.
* Some USB devices are multifunctional and may provide other USB modes in addition to storage. Switch the mode on these devices to usb-storage before acquiring them. A Linux tool called `usb_modeswitch` is able to query some multifunction USB devices and switch modes.

## iOS

The first step in a forensic examination of an iOS device is identifying the device model. The model of an iOS device can be used to help the examiner develop an understanding of the underlying components and capabilities of the device, which can be used to drive the methods for acquisition and examination. Legacy iOS devices should not be disregarded, because they may surface as part of an investigation. Examiners must be aware of all iOS devices, as old devices are sometimes still in use and may be tied to a criminal investigation.

There are several ways to acquire data from an iOS device: logical, filesystem, and physical acquisition techniques, including techniques of acquiring jailbroken devices and methods to bypass passcodes. 

Physical acquisition is the preferred acquisition method as it recovers as close as possible a bit-by-bit copy of the data from the device; but, it is not possible to use physical acquisition on all iOS devices.

Backup files may exist or be the only method to extract data from the device. iOS device backups contain essential information that may be the only source of evidence. 

## Android

Unlike iOS, several variants of Android exist as many devices run the Android operating system and each may have different file systems and unique features. The fact that Android is open and customizable also changes the digital forensics of it. Expect the unexpected when handling an Android device.

A proper forensic workstation setup is required prior to conducting investigations on an Android device. Using open source methods to acquire and analyze Android devices requires the installation of specific software on a forensic workstation. If the method of forensic acquisition requires the Android device to be unlocked, determine the best method by which to gain access to the device. Depending on the forensic acquisition method and scope of the investigation, rooting the device can provide complete access to the files present on the device.

Once the device is accessible, an examiner can extract the data using manual, logical, or physical data extraction techniques. Logical techniques extract the data by interacting with the device using tools such as ADB. Physical techniques access a larger set of data; they are complex and require expertise.

Recovery of the deleted data on Android devices depends on various factors, which heavily rely on access to the data residing in the internal memory and SD card. While the recovery of deleted items from external storage, such as an SD card, is easy, the recovery of deleted items from the internal memory takes considerable effort. SQLite file-parsing and file-carving techniques are two methods that are used to recover deleted data extracted from an Android device.

## Resources

* [ACELab PC-3000](https://www.acelab.eu.com/catalog/)
* [Atola Insight Forensic](https://www.atola.com/products/insight/supported-drives.html)
* [Trusted computing group](https://trustedcomputinggroup.org/)

