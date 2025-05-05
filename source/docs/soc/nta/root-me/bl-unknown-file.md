# Bluetooth Unknown file

[root-me challenge Bluetooth - Unknown file](https://www.root-me.org/en/Challenges/Network/Bluetooth-Unknown-file): Your friend working at NSA recovered an unreadable file from a hacker’s computer. The only thing he knows is that it comes from a communication between a computer and a phone.

The answer is the SHA-1 hash of the concatenation of the MAC address (uppercase) and the name of the phone.

**Example:**

    AB:CD:EF:12:34:56myPhone -> 023cc433c380c2618ed961000a681f1d4c44f8f1

----

1. `wget` the `bin` from root-me
2. `file ch18.bin`
3. `strings ch18.bin`
4. `hcidump -r ch18.bin`
5. Extract MAC address and phone name, concat
6. Hash it
