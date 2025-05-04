# Command & Control level 5

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Command-Control-level-5): Berthier, the malware seems to be manually maintened on the workstations. Therefore, it’s likely that the hackers have found all the computers’ passwords. Since ACME’s computer fleet seems to be up-to-date, it’s probably only due to password weakness. John, the system administrator doesn’t believe you. Prove him wrong!

Find john's password. The uncompressed memory dump md5 hash is `e3a902d4d44e0f7bd9cb29865e0a15de`

----

Get file:

```text
┌──(kali㉿kali)-[~/Downloads/root-me]
└─$ wget http://challenge01.root-me.org/forensic/ch2/ch2.tbz2
```

Unpack:

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic]
└─$ tar -jxvf ch2.tbz2
ch2.dmp

```

Using volatility3, dump the Windows user password hashes:

```text
┌──(kali㉿kali)-[~/Downloads/volatility3]
└─$ ./vol.py -f ../root-me/forensic/ch2.dmp windows.hashdump.Hashdump
Volatility 3 Framework 2.4.2
Progress:  100.00               PDB scanning finished                        
User    rid     lmhash  nthash

Administrator   500     aad3b435b51404eeaad3b435b51404ee        31d6cfe0d16ae931b73c59d7e0c089c0
Guest           501     aad3b435b51404eeaad3b435b51404ee        31d6cfe0d16ae931b73c59d7e0c089c0
John Doe        1000    aad3b435b51404eeaad3b435b51404ee        b9f917853e3dbf6e6831ecce60725930
```

