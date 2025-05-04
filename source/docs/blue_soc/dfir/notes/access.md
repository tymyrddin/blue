# Accessing images

## Filesystem

[The Linux kernel supports a large number of filesystems](https://en.wikipedia.org/wiki/Category:File_systems_supported_by_the_Linux_kernel), which can be useful when performing some DFIR tasks. Filesystem support is not necessary when performing forensic acquisition, because the imaging process is operating on the block device below the filesystem and partition scheme.

To provide a consistent interface for different types of filesystems, the Linux kernel implements a Virtual File System (VFS) abstraction layer. This allows mounting of regular storage media filesystems (`EXT*`, `NTFS`, `FAT`, ...), network-based filesystems (`nfs`, `sambafs/smbfs`, ...), userspace filesystems based on [FUSE](https://en.wikipedia.org/wiki/Filesystem_in_Userspace), stackable filesystems (`encryptfs`, `unionfs`, ...), and other special pseudo filesystems (`sysfs`, `proc`, ...).

### Mounting

Filesystems that reside on disk devices in Unix and Linux require explicit mounting before being accessible as a regular directory structure. Mounting a filesystem means it is made available to use with standard file access tools (file managers, applications, ...), similar to drive letters in the DOS/Windows world. Linux doesn’t use drive letters; mounted disks become part of the local filesystem and are attached to any chosen part of the filesystem tree, the mount point.

To mount a USB stick on an investigator system using (`/mnt`) as the mount point:

```shell
sudo mount /dev/sdb1 /mnt
```

To unmount, use the `umount` command (not unmount) with either the device name or the mount point.

```shell
sudo umount /dev/sdb1
sudo umount /mnt
```

After the filesystem is unmounted, the raw disk is still visible to the kernel and accessible by block device tools, even though the filesystem is not mounted. An unmounted disk is safe to physically detach from an investigator’s acquisition system.

***Do not attach or mount suspect drives without a write blocker***. There is a high risk of modifying, damaging, and destroying digital evidence. Modern OSes will update the last-accessed timestamps as the files and directories
are accessed. Any userspace daemons (search indexers, thumbnail generators, and so on) might write to the disk and overwrite evidence, filesystems might attempt repairs, journaling filesystems might write out journal data, and other human accidents might occur.

In cases where the Linux kernel does not detect the filesystem, it may have to be explicitly specified. A filesystem will not be correctly detected for any of the following reasons:

* The filesystem is not supported by the host system (missing kernel module or unsupported filesystem).
* The partition table is corrupted or missing.
* The partition has been deleted.
* The filesystem offset on the disk is unknown.
* The filesystem needs to be made accessible (unlock device, decrypt partition, and so on).

## Drives

Attached drives will appear as block devices in the `/dev` directory when they’re detected by the kernel. Raw disk device files have a specific naming convention: `sd*` for SCSI and SATA, `hd*` for IDE, `md*` for RAID arrays, `nvme*n*` for NVME drives, and other names for less common or proprietary disk device drivers.

Individual partitions discovered by the kernel are represented by numbered raw devices (for example, `hda1`, `hda2`, `sda1`, `sda2`, and so forth).

When a new device is attached to (or removed from) a host, an interrupt notifies the kernel of a hardware change. The kernel informs the `udev` system, which creates appropriate devices with proper permissions, executes setup (or removal) scripts and programs, and sends messages to other daemons (via dbus, for example).

## Forensically acquired image files

### Loop devices

Example of creating a block device for an `image.raw` file:

```shell
sudo losetup --read-only --find --show image.raw
```

The flags specify that the loop should be `--read-only` and the next available loop device should be used (`--find`) and displayed on completion (`--show`). The filename specified (`image.raw`) will then become available as an attached block device.

Running the `losetup` command without parameters displays the status of all configured loop devices. These images can be accessed with any tool that operate on block devices.

When done, simply detach it:

```shell
sudo losetup --detach /dev/loop0
```

It is possible to specify an offset each time running a forensic tool, but it is easier to have a separate device for each partition. You can create a sepa- rate loop device with the losetup command for a specific partition by specifying the correct offset flag (`--offset`) and size flag (`--sizelimit`). A more commonly accepted way is to use the device mapper.

### Device mapping

The `kpartx` tool automates the creation of partition devices for a particular image file. A forensically acquired image with four partitions is used in the following example to demonstrate the kpartx tool making mapper devices for each partition:

```shell
sudo kpartx -r -a -v image.raw
```

The `kpartx` tool reads the partition table on a disk or image file, creates a loop device for the whole image, and then creates mapper devices for each partition. The `-r` flag ensures the drive loop and partition mappings are read-only, and the `-a` flag instructs `kpartx` to map everything it finds. Use the verbose flag `-v` to document the command output and to indicate what was just mapped.

A loop device is created (`/dev/loop0`) for the whole image file and is accessible as a raw block device. In addition, partition
devices are now available in the `/dev/mapper` directory, which can be accessed using forensic tools that operate on partitions, without specifying any offsets.

Some commands for such partitions:

```shell
sudo fsstat /dev/mapper/loop0p3
sudo mkdir p3
sudo mount --read-only /dev/mapper/loop0p3 p3
sudo mc ./p3
...
sudo umount p3
sudo rmdir p3
```

When the drive loop and partition mappings are no longer needed, remove them all by using the kpartx delete (`-d`) flag:

```shell
sudo kpartx -d image.raw
```

The loop and mappings are deleted, not the drive image, and the drive image is not modified.

### Forensic format images

The `ewflib` software package includes a tool called `ewfmount` to "mount" the contents of a forensic image, making it accessible as a regular raw image file.

As root:

```shell
mkdir raw
ewfmount image.E01 raw
ls -l raw
hexedit -s raw/ewf1
kpartx -r -a -v raw/ewf1
sudo mkdir p1
mount --read-only /dev/mapper/loop0p1 p1
ls p1
...
umount p1
kpartx -d raw/ewf1
fusermount -u raw
rmdir p1 raw
```

### xmount

The xmount (crossmount) tool creates a virtual disk image that can be booted using VM software like VirtualBox or ***kvm-
qemu***. The tool simulates a read-write drive, but it protects the image in a read-only state. Multiple VM output formats are possible, including raw, dmg, vdi, vhd, vmdk, and vmdks.

## VM images

Accessing common VM image file types such as qcow2, vdi, vmdk, and vhd.

### QEMU QCOW2

The `libqcow-utils` package contains the `qcowinfo` and `qcowmount` tools. Both can be used in the same way as `ewfinfo` and `ewfmount` tools. Given a `*.qcow2` file, the `qemu-img` command can provide a summary of the file:

```shell
qemu-img info image.qcow2
```

To access a `qcow` image in a raw image representation with `nbd`, load the nbd kernel module (or autoload the nbd module at boot by adding it to the `/etc/modules` file):

```shell
modprobe nbd
dmesg | grep nbd
qemu-nbd --read-only --connect /dev/nbd0 image.qcow2
dmesg | grep nbd0
mmls /dev/nbd0
fls /dev/nbd0p1
mkdir p1
mount /dev/nbd0p1 p1
ls p1
...
umount p1
qemu-nbd --read-only --disconnect /dev/nbd0
rmdir p1
```

### VirtualBox VDI

The VirtualBox software package includes a number of utilities; the VBoxManage tool provides information about the VDI image:

```shell
VBoxManage showhdinfo image.vdi
```

The same `qemu-nbd` command can be used:

```shell
qemu-nbd -c /dev/nbd0 image.vdi
dmesg
```

### VMWare VMDK

Retrieve information about the assembled image and each of the "Extents" using `vmdkinfo`:

```shell
vmdkinfo image.vmdk
mkdir whatever
vmdkmount image.vmdk whatever
ls -ls whatever
mmls whatever/vmdk1
```

Using `kpartx`, will create the associated disk and partition block devices. You can then use forensic analysis tools on them directly or mount them on the local machine to browse the filesystem.

### Microsoft VHD

Use the `qemu-nbd` method or use the `libvhdi-utils` with `vhdiinfo` and `vhdimount`.

## Encrypted filesystems

It is assumed the keys or passwords are available from memory dumps, escrow/backup in enterprise organisations, individuals legally compelled to provide them, victims offering to help, commercial recovery services/software, or other sources.

### Microsoft BitLocker

Microsoft’s current default filesystem encryption is BitLocker. It encrypts at the block level, protecting entire volumes. A variant of BitLocker designed for removable media is called BitLocker-To-Go, which uses encrypted container files on a regular unencrypted filesystem.

As root:

```text
# dislocker-metadata -V bitlocker-image.raw
# mkdir clear files
# dislocker-fuse -u -V bitlocker-image.raw clear
Enter the user password:
# ls -l clear/
# fsstat clear/dislocker-file
# mount -o loop,ro clear/dislocker-file files
# ls files
...
# umount files
# fusermount -u clear
# rmdir files clear
```

As non-privileged user:

```shell
$ dislocker-metadata -V bitlocker-image.raw
$ mkdir clear files
$ dislocker-fuse -u -V bitlocker-image.raw -- -o allow_root clear
$ sudo mount -o loop,ro,uid=[username] clear/dislocker-file files
...
$ sudo umount files
$ fusermount -u clear
$ rmdir clear files
```

For an acquired image with a partition table, the offsets (in bytes) must be calculated.

```text
# mmls image0.raw
...
Units are in 512-byte sectors

    Slot    Start       End	    Length      Description
...
03: 00:01   0004098048  0625140399  0621042352  NTFS (0x07)
```

```text
# echo $((4098048*512))
2098200576
```

Use the calculated number of bytes offset value for the `bdeinfo` and `bdemount` commands:

```text
# bdeinfo -o 2098200576 image0.raw
```

```text
# mkdir raw
# bdemount -o 2098200576 -r xxxx-...-xxxx image.raw raw
```

### Apple FileVault

Apple’s filesystem encryption built into OS X is FileVault. It is also a block-level encryption system.

Before using the `libfvde` tools, the correct byte offset of the FileVault-encrypted volume must be calculated. The mmls command provides the sector offset of the volume, which needs to be converted to bytes:

```text
# mmls image.raw
...
Units are in 512-byte sectors

    Slot    Start       End	    Length      Description
...
05: 01      0000409640  0235708599  0235298960  HDD
```

```text
# echo $((409640*512))
209735680
```

Use the calculated number of bytes offset value for the `fvdeinfo` and `fvdemount` commands:

```text
# fvdeinfo -o 209735680 image.raw
```

To decrypt the FileVault volume, you can recover the `EncryptedRoot.plist.wipekey` file and provide either a user password or recovery key. You can find and extract the wipekey file using Sleuth Kit tools (and an `END` sector offset, not a byte offset):

```text
# fls -r -o 235708600 image.raw | grep EncryptedRoot.plist.wipekey
+++++ r/r 1036: EncryptedRoot.plist.wipekey
# icat -o 235708600 image.raw 1036 > EncryptedRoot.plist.wipekey
```

Then use this key to create a FUSE mount of a decrypted representation of the volume:

```text
# mkdir clear
# fvdemount -o 209735680 -r XXXX-...-XXXX -e EncryptedRoot.plist.wipekey image.raw clear
# ls -l clear
# fsstat clear/fvde1
# mkdir files
# mount -o loop,ro clear/fvde1 files
# ls -l files
...
# umount files
# rmdir files
# fusermount -u clear
# rmdir clear
```

### Linux LUKS

A number of file encryption systems are available in the open source world. Some, like eCryptfs or encfs, are directory based. Others, like GPG and various crypt tools, operate on individual files.

For a forensically acquired image with a LUKS-encrypted filesystem, the first step requires calculating the byte offset of the LUKS-encrypted partition.

```text
# mmls image.raw
...
Units are in 512-byte sectors

    Slot    Start       End	    Length      Description
...
02: 00:00   0000002048  0058626287  0058624240  Linux (0x83)
```

```text
# echo $((2048*512))
1048576
```

Then use the byte offset to create a loop device of the encrypted partition by using `losetup`:

```text
# losetup --read-only --find --show -o 1048576 luks.raw
```

Find information about the encrypted partition using cryptsetup's `luksDump` command:

```text
# cryptsetup luksDump /dev/loop0
```

With the password to the LUKS-encrypted filesystem, you can use cryptsetup's `open` command on the loop0 device to create a mapper device. After a successful key has been entered, a new (decrypted) partition device will appear in the `/dev/mapper` directory and can be operated on using standard forensic tools.

```text
# cryptsetup -v --readonly open /dev/loop0 clear
Enter passphrase for /hyb/luks/luks.raw:
Key slot 0 unlocked.
Command successful.
# fsstat /dev/mapper/clear
# mkdir clear
# mount --read-only /dev/mapper/clear clear
# ls clear
...
# umount clear
# rmdir clear
# cryptsetup close clear
# losetup --detach /dev/loop0
```

A LUKS-encrypted disk with a bootable OS may have an additional Logical Volume Manager (LVM) layer. Such disks may have additional devices that appear in the `/dev/mapper` directory (root, swap, and so on). You can access or mount each of these devices individually. During the cleanup process, remove the partition devices with `dmsetup` before closing the LVM device with cryptsetup.

Images encrypted with plain `dm-crypt` and `loop-AES` can also be decrypted using the cryptstetup tool. The cryptsetup open command needs to have either `plain` or `loopaes` specified using the `--type` flag. Using `--type loopaes` will also require a key file.

### TrueCrypt and VeraCrypt

After development of TrueCrypt was stopped, several forks emerged. VeraCrypt offers backward compatibility and new extensions.

A simple encrypted TrueCrypt or VeraCrypt container file. The `--file-system=none` flag prevents VeraCrypt from mounting any filesystems:

```text
$ veracrypt --mount-options=readonly --filesystem=none secrets.tc
Enter password for /whatever/secrets.tc:
Enter PIM for /whatever/secrets.tc:
Enter keyfile [none]:
```

List all the decrypted containers on the host system by slot number:

```text
$ veracrypt -l
1: /whatever/secrets.tc /dev/mapper/veracrypt1 -
```

Request more information about the container by specifying the slot number:

```text
$ veracrypt --volume-properties --slot=1
```

The device `/dev/loop0` is encrypted as a raw image (the same as the file on the filesystem). The device shown in the volume properties, `/dev/mapper/veracrypt1`, is the decrypted volume, which can be operated on directly using forensic tools:

```text
$ sudo fls /dev/mapper/veracrypt1
```

To mount the mapper device on the local machine and browse the filesystem with regular tools:

```text
$ mkdir clear
$ sudo mount -o ro,uid=username /dev/mapper/veracrypt1 clear
$ ls -l clear
...
```

Cleanup:

```text
$ sudo umount clear
$ rmdir clear
$ veracrypt -d --slot=1
```

One feature of TrueCrypt and VeraCrypt is that it is possible to have two passwords that reveal two separate volumes. The mapped device of a hidden volume produces a filesystem that you can directly analyse with forensic tools.

```text
$ veracrypt -d --slot=1
$ veracrypt --mount-options=readonly --filesystem=none hidden.raw
Enter password for /whatever/hidden.raw: [YYYYYYYYYYY]
...
$ veracrypt --volume-properties --slot=1
Slot: 1
Volume: /whatever/hidden.raw
Virtual Device: /dev/mapper/veracrypt1
Mount Directory:
Size: 499 MB
Type: Hidden
Read-Only: Yes
...
$ sudo fls /dev/mapper/veracrypt1
...
r/r 19: the real hidden secrets.pdf
...
```

## Resources

* [LUKS cryptsetup wiki](https://gitlab.com/cryptsetup/cryptsetup/-/wikis/home)


