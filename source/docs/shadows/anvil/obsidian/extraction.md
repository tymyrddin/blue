# Firmware extraction & workspace creation

This is the analytical and procedural step following firmware acquisition. Its goal is to systematically unpack a verified firmware binary, establish its integrity, and construct the standardised analysis workspace for the Obsidian Desk. The completed workspace is the mandatory prerequisite for all Vulnerability Research.

**Prerequisite:** A single, acquired firmware binary file (e.g., `firmware.bin`) and its associated `source.yaml` metadata, confirming its hash and origin.

## 1. File and structure analysis

Before extraction, understand the binary's layout to plan the process.

```bash
# Determine file type and identify embedded components
file firmware.bin
binwalk firmware.bin
hexdump -C -n 512 firmware.bin | less
```

*   **`binwalk` is primary.** Its output showing offsets and signatures is your extraction map.
*   **Action:** Record the full output of these commands to a `triage.log` file in your working directory.

## 2. Partition extraction and filesystem handling

Using the map from Step 1, extract the main operational components.

*   **Automated extraction with `binwalk`:**
    ```bash
    binwalk -e -M firmware.bin
    ```
    This recursively carves out identified files into a `_firmware.bin.extracted/` directory. Inspect its contents.
*   **Manual extraction with `dd`:**
    For precision or when automated extraction fails, use `dd` with specific `skip` (offset) and `count` (size) values from your analysis.
    ```bash
    dd if=firmware.bin of=rootfs.squashfs bs=1 skip=<offset> count=<size>
    ```
*   **Mounting Common Embedded Filesystems:**
    To browse the device's operating system, mount extracted filesystem images read-only.
    ```bash
    # For SquashFS (very common)
    sudo mount -t squashfs -o loop,ro rootfs.squashfs /mnt/analysis/
    ```
    Browse `/mnt/analysis/` to confirm expected directories (`/etc`, `/bin`, `/usr`, `/www`) are present.

## 3. Populate the analysis workspace

Construct the research-ready directory structure within the `analysis/` hierarchy.

1.  **Copy the Filesystem:**
    ```bash
    mkdir -p analysis/vendor/device/version/extracted/rootfs
    sudo cp -r /mnt/analysis/* analysis/vendor/device/version/extracted/rootfs/
    sudo chown -R $USER:$USER analysis/vendor/device/version/
    ```
2.  **Stage Key Binaries:** Identify and copy critical executables (e.g., network daemons, web server) to `extracted/binaries/` for later analysis.
3.  **Finalise Documentation:**
    *   Move the `triage.log` file into the analysis directory.
    *   Create the `notes.md` file. Its **first line must be the source hash:** `**Source Binary:** raw/vendor/device/version/firmware.bin (sha256:xxx)`.
    *   Append initial observations: architecture, kernel version, key services found.

The resulting standard structure for a target is:
```
analysis/vendor/device/version/
├── extracted/
│   ├── rootfs/          # Complete device filesystem
│   └── binaries/        # Copied key executables
├── triage.log          # Output from file, binwalk, strings
└── notes.md            # Source hash and initial notes
```

**Hand-off Condition:** This directory, with a browsable filesystem and a logged structure, is the direct input for the Vulnerability Research phase.

### Post-Process
```bash
sudo umount /mnt/analysis/  # Cleanly unmount
rm -f rootfs.squashfs       # Remove temporary extract
```

## Integrity and verification

Firmware that cannot be proven unchanged is not evidence; it is gossip.

### Hashing and checksums for provenance

Immediately after acquisition and before any analysis, calculate cryptographic hashes.

```bash
sha256sum firmware.bin > firmware.bin.sha256
sha1sum firmware.bin >> firmware.bin.sha256
md5sum firmware.bin >> firmware.bin.sha256
```

Hashes are calculated **once**, stored alongside the artefact, and never recalculated over modified files.

## Metadata and provenance (canonical format)

Every artefact requires a structured metadata record. YAML is the canonical format.

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

Do not improvise directory names. Automation will assume you did not. Consistency is everything.

### Lab filing structure

Example baseline layout:
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

**Rules:**
*   Raw firmware is read-only.
*   Extracted artefacts are derived, not replaced.
*   Notes reference artefacts by hash, not filename.
*   Deletions require supervisor sign-off.

The vault is not a scratch directory. It is evidence storage.
