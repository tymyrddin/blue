# Reverse shell

You: J.A.V.A. can you do a quick scan for me? We haven't investigated the outbound traffic yet.

J.A.V.A.: Yes, sir. Outbound traffic investigation has begun.

THE NARRATOR: The outbound traffic? Why?

YOU: We have stopped some inbound access attempts, so we didn't let the bad guys get in. How about the bad guys 
who are already inside? Also, no need to mention the insider risks, huh? The dwell time is still around 1-3 months, 
and I am quite new here, so it is worth checking the outgoing traffic as well.

J.A.V.A.: Sir, persistent outbound traffic is detected. Possibly a reverse shell...

YOU: You got it!

J.A.V.A.: Sir, you need to observe the traffic with Snort and identify the anomaly first. Then you 
can create a rule to stop the reverse shell. GOOD LUCK!

Start in sniffer mode and capture some data:

```text
sudo snort -dev -l .
```

Investigate with the logfile just created:

```text
sudo snort -r snort.log.1669602099
```

Port 4444?

```text
$ sudo snort -r snort.log.1669602099 'port 4444' -n 10
...
WARNING: No preprocessors configured for policy 0.
11/28-02:21:39.625212 10.10.144.156:4444 -> 10.10.196.55:54128
TCP TTL:64 TOS:0x0 ID:9999 IpLen:20 DgmLen:52 DF
***A***F Seq: 0x2FE7575D  Ack: 0x56C876C1  Win: 0x1E9  TcpLen: 32
TCP Options (3) => NOP NOP TS: 1980585364 2358417664 
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
11/28-02:21:39.645400 10.10.196.55:54128 -> 10.10.144.156:4444
TCP TTL:64 TOS:0x0 ID:11389 IpLen:20 DgmLen:52 DF
***A**** Seq: 0x56C876C1  Ack: 0x2FE7575E  Win: 0x1EB  TcpLen: 32
TCP Options (3) => NOP NOP TS: 2358417665 1980585364 
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
```

TCP port 4444. Metasploit.

Create a rule:

```text
sudo nano /etc/snort/rules/local.rules
```

```text
# $Id: local.rules,v 1.11 2004/07/23 20:15:44 bmc Exp $
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

drop tcp any 4444 <> any any (msg: "Reverse Shell Port Detected"; sid: 100001; rev:1;)
```

Start snort in IPS mode:

```text
sudo snort -c /etc/snort/snort.conf -q -Q --daq afpacket -i eth0:eth1 -A full
```

And flag!


