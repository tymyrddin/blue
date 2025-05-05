# Second job interview

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Second-job-interview): After passing [the first interview](interview1.md) with flying colors you are now called in again.
You’ve got to analyse a new file.

----

What?

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/interview2]
└─$ file forensic.E01    
forensic.E01: EWF/Expert Witness/EnCase image file format
```

```text                                                                                                                                                                      
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/interview2]
└─$ ewfinfo forensic.E01 
ewfinfo 20140813

Acquiry information
        Case number:            2
        Description:            Root-me Challenge - Level : Forensic of course !!!
        Examiner name:          makhno - IT forensic investigator
        Evidence number:        1
        Notes:                  A Microsoft encryption ... ;-)
        Acquisition date:       Sat Jul  2 17:27:33 2016
        System date:            Sat Jul  2 17:27:33 2016
        Operating system used:  Linux
        Software version used:  20140608
        Password:               N/A

EWF information
        File format:            EnCase 6
        Sectors per chunk:      64
        Error granularity:      64
        Compression method:     deflate
        Compression level:      best compression
        Set identifier:         2c3d379a-f2df-8b49-b866-6ff5817fe4a2

Media information
        Media type:             fixed disk
        Is physical:            yes
        Bytes per sector:       512
        Number of sectors:      1202180
        Media size:             587 MiB (615516160 bytes)

Digest hash information
        MD5:                    9f6a0da4d8658c0980d97627be8f6eb9
```

Extract the FVEK from the memory dump using the bitlocker plugin for volatility (or another tool).

```text
Cipher  : AES-128
FVEK    : e7e576581fe26aa7c71a7e711c778da2
TWEAK   : b72f4e075edb7e734dfb08638cf29652
```

And mount with `bdemount`.
