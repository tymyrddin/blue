# Enabling WPA3

WPA2 has been the standard home Wi-Fi encryption protocol since 2004. It is not broken in
the sense of being trivially bypassed, but it has a known weakness: a four-way handshake
that can be captured from the air and then attacked offline. Given a captured handshake and
a weak passphrase, the password can be recovered without any ongoing access to the network.

WPA3 addresses this with a different key exchange (Simultaneous Authentication of Equals)
that does not expose the equivalent of a captured handshake to offline dictionary attacks.
Each session uses a unique key, so capturing traffic does not help an attacker who was not
present for the authentication. The practical difference is that a strong WPA2 password is
sufficient against most attackers; WPA3 maintains that property even against a future
attacker who recorded your handshake years ago.

## Enabling it

1. Access router settings through the admin interface (usually 192.168.1.1 or 192.168.0.1
   in a browser, or through the router manufacturer's app).
2. Find Wireless Security, Wireless Settings, or similar, depending on the manufacturer.
3. Select WPA3-Personal.

If WPA3-Personal is not available, WPA2/WPA3 Mixed Mode is the next choice: devices that
support WPA3 use it, while older devices fall back to WPA2. This is the practical setting
for most households with a mix of device ages.

Avoid WEP and TKIP entirely. Both have documented attack tooling and offer little real
protection.

## If the router does not support WPA3

Routers released before 2019 often do not support WPA3. If the option is absent, a strong
and unique WPA2 passphrase (20 or more random characters, not a phrase or word) is the
effective mitigation. A router old enough to predate WPA3 is also likely to be past its
firmware update lifespan, which is a separate reason to consider replacing it.
