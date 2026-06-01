# Artefact analysis

Where the usable artefacts come from once the Obsidian Desk has done its work. The short version: the device tends to announce itself in three places, and these are them.

## Network service analysis

What the device says when something connects to it:

- HTTP headers and banners
- TLS certificates
- SSH and Telnet banners
- UDP service responses

## Filesystem analysis

What the firmware carries on disk:

- `/etc/issue`, `/etc/os-release`
- Web application files
- Binary strings with version info
- Configuration file defaults

## Binary analysis

What falls out of the binaries themselves:

- Strings output
- Embedded web resources
- Compilation timestamps
- Library versions
