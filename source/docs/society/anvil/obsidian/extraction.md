# Firmware extraction and workspace creation

The step between acquiring a binary and learning anything from it. The goal is to unpack a verified firmware image, establish that it is intact, and lay out the standard analysis workspace the Obsidian Desk works from. Until that workspace exists, the research phase has nowhere to stand.

What it assumes you are holding: a single acquired firmware binary (say, `firmware.bin`) and its `source.yaml`, which records the hash and where it came from.

## File and structure analysis

A look at the layout before the unpacking, so the process has a plan rather than a hope.

```bash
# Determine file type and identify embedded components
file firmware.bin
binwalk firmware.bin
hexdump -C -n 512 firmware.bin | less
```

`binwalk` is the one that does the heavy lifting; its offsets and signatures are the extraction map. The full output of these three is worth keeping in a `triage.log` in the working directory, because it is the thing you will want to reread when something does not line up later.

## Partition extraction and filesystem handling

With the map from the previous step, the main components come out.

Automated extraction with `binwalk`:

```bash
binwalk -e -M firmware.bin
```

This recursively carves the identified files into a `_firmware.bin.extracted/` directory, which then repays a careful look.

Manual extraction with `dd`, for precision or for when the automated pass gives up:

```bash
dd if=firmware.bin of=rootfs.squashfs bs=1 skip=<offset> count=<size>
```

The `skip` (offset) and `count` (size) values come from the analysis above.

Mounting common embedded filesystems, read-only, to browse the device's operating system:

```bash
# For SquashFS (very common)
sudo mount -t squashfs -o loop,ro rootfs.squashfs /mnt/analysis/
```

A glance through `/mnt/analysis/` confirms the expected directories (`/etc`, `/bin`, `/usr`, `/www`) are present, and quietly flags it when they are not.

## Populating the analysis workspace

Building the research-ready structure inside the `analysis/` hierarchy.

Copy the filesystem:

```bash
mkdir -p analysis/vendor/device/version/extracted/rootfs
sudo cp -r /mnt/analysis/* analysis/vendor/device/version/extracted/rootfs/
sudo chown -R $USER:$USER analysis/vendor/device/version/
```

Stage the key binaries: the network daemons, the web server, and anything else worth a closer look go into `extracted/binaries/`.

Finalise the documentation:

* The `triage.log` moves into the analysis directory.
* The `notes.md` file gets created, and its first line is the source hash: `Source Binary: raw/vendor/device/version/firmware.bin (sha256:xxx)`. Everything in the workspace traces back to that line.
* Initial observations get appended: architecture, kernel version, the services that turned up.

The structure a target ends up with:

```
analysis/vendor/device/version/
├── extracted/
│   ├── rootfs/          # Complete device filesystem
│   └── binaries/        # Copied key executables
├── triage.log          # Output from file, binwalk, strings
└── notes.md            # Source hash and initial notes
```

This directory, with a browsable filesystem and a logged structure, is the direct input for the research phase.

A tidy exit:

```bash
sudo umount /mnt/analysis/  # Cleanly unmount
rm -f rootfs.squashfs       # Remove temporary extract
```

## Integrity and verification

Firmware that cannot be proven unchanged is not evidence. It is gossip.

### Hashing for provenance

Immediately after acquisition, and before anything touches the artefact, the hashes get taken:

```bash
sha256sum firmware.bin > firmware.bin.sha256
sha1sum firmware.bin >> firmware.bin.sha256
md5sum firmware.bin >> firmware.bin.sha256
```

They are calculated once, stored alongside the artefact, and never recalculated over a modified file. A hash taken after the fact is a hash of whatever you did to it.

## Metadata and provenance

Every artefact carries a structured metadata record. YAML is the canonical format.

```yaml
# File: source.yaml
device_context:
  vendor: Siemens
  model: SIMATIC S7-1212C
  hw_revision: "V3.0"
  serial: S123456789
  condition: Used, decommissioned line #5
acquisition:
  date: 2025-01-15
  method: UART bootloader dump
  operator: AB
  lab_id: LAB-rack-02
  toolchain: screen 4.08, custom script v1.2
artefact:
  filename: S7-1212C_V4.5_fullflash.bin
  sha256: a1b2c3…
  notes: Reconstructed from 3 MTD partitions
```

If you cannot say where a file came from, it does not exist.

## Storage and cataloguing

Improvised directory names are a false economy: the automation will assume you did not improvise, and behave accordingly. Consistency is the whole game here.

### Lab filing structure

A baseline layout:

```
.
├── analysis
│   ├── moxa
│   │   └── nport
│   │       └── 5250ai-m12
│   │           └── 2.0
│   └── vertiv
│       └── liebert
│           └── is-unity
│               └── 8.4.7.0
├── artefacts
│   ├── moxa
│   │   └── nport
│   │       └── 5250ai-m12
│   │           └── 2.0
│   └── vertiv
│       └── liebert
│           └── is-unity
│               └── 8.4.7.0
├── firmwares
│   ├── extracted
│   │   ├── moxa
│   │   │   └── nport
│   │   │       └── 5250ai-m12
│   │   │           └── 2.0
│   │   └── vertiv
│       └── liebert
│           └── is-unity
│               └── 8.4.7.0
│   └── raw
│       ├── moxa
│       │   └── nport
│       │       └── 5250ai-m12
│       │           ├── 2.0
│       │           │   ├── moxa-nport-5250ai-m12-models-firmware-v2.0.rom
│       │           │   ├── moxa-nport-5250ai-m12-models-firmware-v2.0.rom.sha512
│       │           │   ├── notes.md
│       │           │   └── source.yaml
│       │           └── moxa-nport-5250ai-m12-models-firmware-v2.0.rom.sha512
│       └── vertiv
│           └── liebert
│               └── is-unity
│                   └── 8.4.7.0
├── lab-notes
└── reports
    ├── moxa
    │   └── nport
    │       └── 5250ai-m12
    │           └── 2.0
    └── vertiv
        └── liebert
            └── is-unity
                └── 8.4.7.0

48 directories, 6 files
```

The conventions that keep it honest:

* Raw firmware is read-only.
* Extracted artefacts are derived, never overwritten back onto the source.
* Notes reference artefacts by hash, not filename.
* Deletions go through supervisor sign-off.

The vault is not a scratch directory. It is evidence storage, and it behaves like one.
Last updated: 01 June 2026
