# Writing IDS rules

## HTTP

`local.rules`:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.
alert tcp any any <> any 80 (msg: "HTTP Packet Detected"; sid: 100001; rev:1;)
alert tcp any 80  <> any any (msg: "HTTP Packet Detected"; sid: 100002; rev:2;)
```

Get statistics and create a `snort.log` file:

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-2 (HTTP)$ sudo snort -c local.rules -dev -l . -r mx-3.pcap
===============================================================================
Run time for packet processing was 1.10785 seconds
Snort processed 460 packets.
Snort ran for 0 days 0 hours 0 minutes 1 seconds
   Pkts/sec:          460
===============================================================================
Memory usage summary:
  Total non-mmapped bytes (arena):       2289664
  Bytes in mapped regions (hblkhd):      17391616
  Total allocated space (uordblks):      2066640
  Total free space (fordblks):           223024
  Topmost releasable block (keepcost):   65888
===============================================================================
Packet I/O Totals:
   Received:          460
   Analyzed:          460 (100.000%)
    Dropped:            0 (  0.000%)
   Filtered:            0 (  0.000%)
Outstanding:            0 (  0.000%)
   Injected:            0
===============================================================================
Breakdown by protocol (includes rebuilt packets):
        Eth:          460 (100.000%)
       VLAN:            0 (  0.000%)
        IP4:          444 ( 96.522%)
       Frag:            0 (  0.000%)
       ICMP:          272 ( 59.130%)
        UDP:            8 (  1.739%)
        TCP:          164 ( 35.652%)
        IP6:            0 (  0.000%)
    IP6 Ext:            0 (  0.000%)
   IP6 Opts:            0 (  0.000%)
      Frag6:            0 (  0.000%)
      ICMP6:            0 (  0.000%)
       UDP6:            0 (  0.000%)
       TCP6:            0 (  0.000%)
     Teredo:            0 (  0.000%)
    ICMP-IP:            0 (  0.000%)
    IP4/IP4:            0 (  0.000%)
    IP4/IP6:            0 (  0.000%)
    IP6/IP4:            0 (  0.000%)
    IP6/IP6:            0 (  0.000%)
        GRE:            0 (  0.000%)
    GRE Eth:            0 (  0.000%)
   GRE VLAN:            0 (  0.000%)
    GRE IP4:            0 (  0.000%)
    GRE IP6:            0 (  0.000%)
GRE IP6 Ext:            0 (  0.000%)
   GRE PPTP:            0 (  0.000%)
    GRE ARP:            0 (  0.000%)
    GRE IPX:            0 (  0.000%)
   GRE Loop:            0 (  0.000%)
       MPLS:            0 (  0.000%)
        ARP:           16 (  3.478%)
        IPX:            0 (  0.000%)
   Eth Loop:            0 (  0.000%)
   Eth Disc:            0 (  0.000%)
   IP4 Disc:            0 (  0.000%)
   IP6 Disc:            0 (  0.000%)
   TCP Disc:            0 (  0.000%)
   UDP Disc:            0 (  0.000%)
  ICMP Disc:            0 (  0.000%)
All Discard:            0 (  0.000%)
      Other:            0 (  0.000%)
Bad Chk Sum:            0 (  0.000%)
    Bad TTL:            0 (  0.000%)
     S5 G 1:            0 (  0.000%)
     S5 G 2:            0 (  0.000%)
      Total:          460
===============================================================================
Action Stats:
     Alerts:          328 ( 71.304%)
     Logged:          328 ( 71.304%)
     Passed:            0 (  0.000%)
Limits:
      Match:            0
      Queue:            0
        Log:            0
      Event:            0
      Alert:            0
Verdicts:
      Allow:          460 (100.000%)
      Block:            0 (  0.000%)
    Replace:            0 (  0.000%)
  Whitelist:            0 (  0.000%)
  Blacklist:            0 (  0.000%)
     Ignore:            0 (  0.000%)
      Retry:            0 (  0.000%)
===============================================================================
Snort exiting
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-2 (HTTP)$ 
```

Investigating packet 63 using the generated `snort.log` file:

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-2 (HTTP)$ sudo snort -r snort.log.1669574637 -n 63
...
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
05/13-10:17:09.123830 65.208.228.223:80 -> 145.254.160.237:3372
TCP TTL:47 TOS:0x0 ID:49312 IpLen:20 DgmLen:1420 DF
***A**** Seq: 0x114C66F0  Ack: 0x38AFFFF3  Win: 0x1920  TcpLen: 20
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
...
```

Packet 64:

```text
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
05/13-10:17:09.123830 65.208.228.223:80 -> 145.254.160.237:3372
TCP TTL:47 TOS:0x0 ID:49312 IpLen:20 DgmLen:1420 DF
***A**** Seq: 0x114C66F0  Ack: 0x38AFFFF3  Win: 0x1920  TcpLen: 20
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
...
```

## FTP

`local.rules`:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any 21 (msg: "FTP Packet Detected"; sid: 100001; rev:1;)
alert tcp any 21 <> any any (msg: "FTP Packet Detected"; sid: 100002; rev:2;)
```

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-3 (FTP)$ sudo snort -c local.rules -dev -l . -r ftp-png-gif.pcap 
...
```

To discover the FTP service name (get enough packets for the handshake to complete):

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-3 (FTP)$ sudo snort -r snort.log.1669576870 -d "tcp and port 21" -n 10
```

To detect failed FTP login attempts in the given `pcap`:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any (msg: "Failed FTP Login Attempt Detected"; content:"530 User" ; sid: 100001; rev:1;)
```

To detect successful FTP logins:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any (msg: "Successful FTP Login Attempt Detected"; content:"230 User" ; sid: 100001; rev:1;)
```

Each FTP login attempt with a valid username and bad password prompts a default message with the pattern; 
"331 Password". Try to filter the given pattern in the FTP traffic. Try to filter the given username.

To detect failed FTP login attempts with a valid username but a bad password or no password:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any (msg: "Successful FTP Login Attempt Detected"; content:"331 Password" ; sid: 100001; rev:1;)
```

To detect failed FTP login attempts with "Administrator" username but a bad password or no password:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any (msg: "Successful FTP Login Attempt Detected"; content:"331 Password"; content:"Administrator"; sid: 100001; rev:1;)
```

## Images

### PNG

Use the Hex Signature `89 50 4E 47 0D 0A 1A 0A` to detect PNG:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any  (msg: "PNG File Found"; content:"|89 50 4E 47 0D 0A 1A 0A|"; sid: 100001; rev:1;)
```

1 packet detected. To identify the software name embedded in the packet:

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-4 (PNG)$ sudo snort -d -r snort.log.1669584904 
Running in packet dump mode

        --== Initializing Snort ==--
Initializing Output Plugins!
pcap DAQ configured to read-file.
Acquiring network traffic from "snort.log.1669584904".

        --== Initialization Complete ==--

   ,,_     -*> Snort! <*-
  o"  )~   Version 2.9.7.0 GRE (Build 149) 
   ''''    By Martin Roesch & The Snort Team: http://www.snort.org/contact#team
           Copyright (C) 2014 Cisco and/or its affiliates. All rights reserved.
           Copyright (C) 1998-2013 Sourcefire, Inc., et al.
           Using libpcap version 1.9.1 (with TPACKET_V3)
           Using PCRE version: 8.39 2016-06-14
           Using ZLIB version: 1.2.11

Commencing packet processing (pid=2328)
WARNING: No preprocessors configured for policy 0.
01/05-20:15:59.817928 176.255.203.40:80 -> 192.168.47.171:2732
TCP TTL:128 TOS:0x0 ID:63105 IpLen:20 DgmLen:1174
***AP*** Seq: 0x3D2348B0  Ack: 0x8C8DF67F  Win: 0xFAF0  TcpLen: 20
89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52  .PNG........IHDR
00 00 01 E0 00 00 01 E0 08 06 00 00 00 7D D4 BE  .............}..
95 00 00 00 19 74 45 58 74 53 6F 66 74 77 61 72  .....tEXtSoftwar
65 00 41 64 6F 62 65 20 49 6D 61 67 65 52 65 61  e.Adobe ImageRea
64 79 71 C9 65 3C 00 00 16 2E 49 44 41 54 78 DA  dyq.e<....IDATx.
...
```

### GIF

Use the `GIF87a` and/or `GIF89a` to detect PNG:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any  (msg: "GIF87a File Found"; content:"GIF87a"; sid: 100001; rev:1;)
```

4 packets found. To identify the software name embedded in the packet:

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-4 (PNG)$ sudo snort -d -r snort.log.1669586274 
Running in packet dump mode

        --== Initializing Snort ==--
Initializing Output Plugins!
pcap DAQ configured to read-file.
Acquiring network traffic from "snort.log.1669586274".

        --== Initialization Complete ==--

   ,,_     -*> Snort! <*-
  o"  )~   Version 2.9.7.0 GRE (Build 149) 
   ''''    By Martin Roesch & The Snort Team: http://www.snort.org/contact#team
           Copyright (C) 2014 Cisco and/or its affiliates. All rights reserved.
           Copyright (C) 1998-2013 Sourcefire, Inc., et al.
           Using libpcap version 1.9.1 (with TPACKET_V3)
           Using PCRE version: 8.39 2016-06-14
           Using ZLIB version: 1.2.11

Commencing packet processing (pid=2442)
WARNING: No preprocessors configured for policy 0.
01/05-20:15:46.525001 77.72.118.168:80 -> 192.168.47.171:2738
TCP TTL:128 TOS:0x0 ID:63078 IpLen:20 DgmLen:83
***AP**F Seq: 0x11976E7A  Ack: 0xC8BE2DE7  Win: 0xFAF0  TcpLen: 20
47 49 46 38 39 61 01 00 01 00 80 00 00 FF FF FF  GIF89a..........
00 00 00 21 F9 04 01 00 00 00 00 2C 00 00 00 00  ...!.......,....
01 00 01 00 00 02 02 44 01 00 3B                 .......D..;

=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
```

## Torrent metafiles

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any  (msg: "Torrent File Found"; content:"torrent"; sid: 100001; rev:1;)
```

Application:

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-5 (TorrentMetafile)$ sudo snort -d -r snort.log.1669587367 
Running in packet dump mode

        --== Initializing Snort ==--
Initializing Output Plugins!
pcap DAQ configured to read-file.
Acquiring network traffic from "snort.log.1669587367".

        --== Initialization Complete ==--

   ,,_     -*> Snort! <*-
  o"  )~   Version 2.9.7.0 GRE (Build 149) 
   ''''    By Martin Roesch & The Snort Team: http://www.snort.org/contact#team
           Copyright (C) 2014 Cisco and/or its affiliates. All rights reserved.
           Copyright (C) 1998-2013 Sourcefire, Inc., et al.
           Using libpcap version 1.9.1 (with TPACKET_V3)
           Using PCRE version: 8.39 2016-06-14
           Using ZLIB version: 1.2.11

Commencing packet processing (pid=2560)
WARNING: No preprocessors configured for policy 0.
07/03-07:54:06.930000 213.122.214.127:3868 -> 69.44.153.178:2710
TCP TTL:128 TOS:0x0 ID:21834 IpLen:20 DgmLen:404 DF
***AP*** Seq: 0xE9A59016  Ack: 0xED0BC172  Win: 0x2238  TcpLen: 20
47 45 54 20 2F 61 6E 6E 6F 75 6E 63 65 3F 69 6E  GET /announce?in
66 6F 5F 68 61 73 68 3D 25 30 31 64 25 46 45 25  fo_hash=%01d%FE%
37 45 25 46 31 25 31 30 25 35 43 57 76 41 70 25  7E%F1%10%5CWvAp%
45 44 25 46 36 25 30 33 25 43 34 39 25 44 36 42  ED%F6%03%C49%D6B
25 31 34 25 46 31 26 70 65 65 72 5F 69 64 3D 25  %14%F1&peer_id=%
42 38 6A 73 25 37 46 25 45 38 25 30 43 25 41 46  B8js%7F%E8%0C%AF
68 25 30 32 59 25 39 36 37 25 32 34 65 25 32 37  h%02Y%967%24e%27
56 25 45 45 4D 25 31 36 25 35 42 26 70 6F 72 74  V%EEM%16%5B&port
3D 34 31 37 33 30 26 75 70 6C 6F 61 64 65 64 3D  =41730&uploaded=
30 26 64 6F 77 6E 6C 6F 61 64 65 64 3D 30 26 6C  0&downloaded=0&l
65 66 74 3D 33 37 36 37 38 36 39 26 63 6F 6D 70  eft=3767869&comp
61 63 74 3D 31 26 69 70 3D 31 32 37 2E 30 2E 30  act=1&ip=127.0.0
2E 31 26 65 76 65 6E 74 3D 73 74 61 72 74 65 64  .1&event=started
20 48 54 54 50 2F 31 2E 31 0D 0A 41 63 63 65 70   HTTP/1.1..Accep
74 3A 20 61 70 70 6C 69 63 61 74 69 6F 6E 2F 78  t: application/x
2D 62 69 74 74 6F 72 72 65 6E 74 0D 0A 41 63 63  -bittorrent..Acc
65 70 74 2D 45 6E 63 6F 64 69 6E 67 3A 20 67 7A  ept-Encoding: gz
69 70 0D 0A 55 73 65 72 2D 41 67 65 6E 74 3A 20  ip..User-Agent: 
52 41 5A 41 20 32 2E 31 2E 30 2E 30 0D 0A 48 6F  RAZA 2.1.0.0..Ho
73 74 3A 20 74 72 61 63 6B 65 72 32 2E 74 6F 72  st: tracker2.tor
72 65 6E 74 62 6F 78 2E 63 6F 6D 3A 32 37 31 30  rentbox.com:2710
0D 0A 43 6F 6E 6E 65 63 74 69 6F 6E 3A 20 4B 65  ..Connection: Ke
65 70 2D 41 6C 69 76 65 0D 0A 0D 0A              ep-Alive....

=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
```

## Resources

* [List of file signatures](https://en.wikipedia.org/wiki/List_of_file_signatures)
* [Basic snort rules syntax and usage (updated 2021)](https://resources.infosecinstitute.com/topic/snort-rules-workshop-part-one/)

