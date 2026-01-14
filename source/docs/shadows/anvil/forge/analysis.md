# Artefact analysis

How to extract usable artefacts from Obsidian Desk outputs:

## Common artefact sources

1. Network service analysis
   - HTTP headers and banners
   - TLS certificates
   - SSH/ Telnet banners
   - UDP service responses

2. Filesystem analysis
   - `/etc/issue`, `/etc/os-release`
   - Web application files
   - Binary strings with version info
   - Configuration file defaults

3. Binary analysis
   - Strings output
   - Embedded web resources
   - Compilation timestamps
   - Library versions