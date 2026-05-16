# Enable WPA3 encryption

WPA2 can be cracked offline given a captured handshake and sufficient compute. WPA3 addresses this with
a protocol that does not expose the handshake to offline dictionary attacks.

## Steps

1. In router settings, find Wireless Security.
2. Select WPA3-Personal. If unavailable, WPA2/WPA3 Mixed Mode retains compatibility with older devices
   while providing WPA3 for those that support it.
3. Avoid WEP and TKIP entirely: both are cryptographically weak and have documented attack tooling.
