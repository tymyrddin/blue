# Bootable recovery media

Recovery runbook. Prepares and uses a bootable live environment to reach a server that will not boot, needs filesystem repair, or has been compromised and cannot be trusted to run its own tools. Two tools cover most needs: a live Linux environment for access and repair, and Clonezilla for disk imaging.

## When to use

Preparation: before it is needed, while the system is healthy. Use: when the installed system will not boot, when its own binaries cannot be trusted (suspected rootkit), or when a full disk image is wanted before or after a major change.

## Risk

`dd` writes to whatever device is named and destroys everything on it. Naming the wrong device overwrites a disk in use. Run `lsblk` first and confirm the target is the USB stick, not a system disk, before every `dd`.

## Preparing the media

### Live environment

Any recent Ubuntu LTS desktop ISO provides a full environment with terminal, filesystem tools, and network, with no installation.

```
lsblk                                                      # identify the USB device first
sudo dd if=ubuntu-24.04-desktop-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

### Imaging tool

```
lsblk
sudo dd if=clonezilla-live-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

## Reaching an installed system

Boot from the USB, then mount the installed system and enter it:

```
sudo mount /dev/sda2 /mnt              # the installed root partition
sudo mount /dev/sda1 /mnt/boot/efi     # only if the system uses UEFI
sudo mount --bind /dev  /mnt/dev
sudo mount --bind /proc /mnt/proc
sudo mount --bind /sys  /mnt/sys
sudo chroot /mnt
```

Inside the chroot, GRUB, kernel packages, and broken configuration can be repaired as if running the installed system. Leave cleanly:

```
exit
sudo umount -R /mnt
```

For a suspected compromise, mounting read-only and copying evidence off before any repair preserves the disk state. Do not chroot into and run binaries from a system suspected of holding a rootkit; inspect from the trusted live environment instead.

## Imaging a disk

Clonezilla presents a guided menu on boot. To save an image:

1. Select `device-image`.
2. Select the destination: local disk, NFS, or SMB share.
3. Select the source disk (`savedisk`) or partition (`saveparts`).
4. Choose compression (zstd is fast, gzip more compatible).

To restore, reverse it: `restoredisk` or `restoreparts`, pointing at the saved image.

## Verify

For a repaired system: unmount, remove the USB, and confirm the installed system boots on its own.

For an image: a Clonezilla image that has never been restored is of unknown quality. Test-restore it to a spare disk or VM and confirm the result boots.

## Done

The media boots on the target hardware. Network comes up if the recovery plan depends on it. For imaging, a test restore has succeeded at least once.

## Follow-up

- Keep a note of the partition layout (`lsblk`, `fdisk -l`) with the image, so the restore target is unambiguous.
- For a compromise, recovery media pairs with [the first hour](../../incidents/first-hour.md) and a rebuild from [verified backups](../../incidents/runbooks/backup-verification.md).
