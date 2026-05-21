# Bootable recovery media

A bootable live environment gives access to a working system independent of the installed OS,
which is useful when the installed system will not boot, needs filesystem repair, or has been
compromised. Two tools cover most recovery needs: a general live environment for filesystem access
and repair, and Clonezilla for disk imaging.

## General live environment (Ubuntu)

Any recent Ubuntu LTS desktop ISO provides a full environment with terminal access, filesystem
tools, and network access. It does not require installation.

Write to USB (replace `sdX` with the correct device; verify with `lsblk` first):

```bash
lsblk
dd if=ubuntu-24.04-desktop-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

Boot from the USB. To access and repair an installed system, mount it and chroot in:

```bash
# Mount the installed root partition
sudo mount /dev/sda2 /mnt

# If the system uses UEFI
sudo mount /dev/sda1 /mnt/boot/efi

# Bind the virtual filesystems
sudo mount --bind /dev  /mnt/dev
sudo mount --bind /proc /mnt/proc
sudo mount --bind /sys  /mnt/sys

# Enter the installed system
sudo chroot /mnt
```

From inside the chroot, GRUB, kernel packages, broken configuration, and most other OS-level
issues can be addressed as if running the installed system. Exit with `exit` and unmount:

```bash
exit
sudo umount -R /mnt
```

## Disk imaging (Clonezilla)

Clonezilla specialises in block-level disk and partition imaging, faster and more reliable than
file-level copying for full system backups and restores. Use it to take an image of a working
system before major changes, or to restore from a known-good state after a compromise.

Write to USB:

```bash
dd if=clonezilla-live-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

On boot, Clonezilla presents a guided menu. The typical save workflow:

1. Select `device-image`
2. Select the image destination: local disk, NFS share, or SMB share
3. Select the source disk (`savedisk`) or partition (`saveparts`)
4. Choose a compression option (zstd is fast; gzip is more compatible)

Restoring reverses the steps: select `restoredisk` or `restoreparts` and point to the saved image.

## Testing

Recovery media is worth testing before it is needed. Boot from the USB on the target machine,
confirm the environment starts, and verify that the network comes up if the recovery plan depends
on it. Clonezilla images that have never been tested restoring are images of unknown quality.

Keep a note of the partition layout (`lsblk`, `fdisk -l`) alongside the image so the restore
target is unambiguous.
