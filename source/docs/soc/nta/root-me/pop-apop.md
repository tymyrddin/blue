# POP-APOP

[root-me challenge POP-APOP](https://www.root-me.org/en/Challenges/Network/POP-APOP): Find the user password in this network frame.

----

1. `wget` the `zip` from root-me
2. Extract the `zip`
3. Dump the `.pcapng` in Wireshark
4. **Follow -> TCP Stream**

```text
+OK Hello little hackers. <1755.1.5f403625.BcWGgpKzUPRC8vscWn0wuA==@vps-7e2f5a72>
APOP bsmith 4ddd4137b84ff2db7291b568289717f0
+OK Logged in.
LIST
+OK 2 messages:
1 6
2 76
.
RETR 1
+OK 6 octets
lutz
.
quit
+OK Logging out.
```

5. [APOP](https://repository.root-me.org/RFC/EN%20-%20rfc1939.txt) uses a digest parameter, calculated by applying MD5 hashing to a string containing a timestamp with angle brackets followed by a secret key. The result of the digest is a 16 octet value sent in hexadecimal, using lowercase ASCII characters.

`hash.txt`:

```text
4ddd4137b84ff2db7291b568289717f0:<1755.1.5f403625.BcWGgpKzUPRC8vscWn0wuA==@vps-7e2f5a72>
```

`hashcat` command:

```text
hashcat -a 0 -m 10 hash.txt /usr/share/wordlists/rockyou.txt
```

## Resources

* [rfc1939](https://repository.root-me.org/RFC/EN%20-%20rfc1939.txt)
