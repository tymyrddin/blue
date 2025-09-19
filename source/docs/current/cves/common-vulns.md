# Common vulnerability classes

Smart energy devices suffer from many of the same issues as general IoT, but with energy-specific consequences:

- Default credentials, weak authentication, or hardcoded keys.
- Exposed web interfaces or admin portals accessible over the network.
- Buffer overflows, input validation errors, and logic flaws.
- Firmware signing bypasses and insecure update mechanisms.
- Poor use of TLS/cryptography: self-signed certificates, expired certs, or no certificate validation.

Understanding these classes helps anticipate what kinds of flaws may exist, even without access to specific exploits.
