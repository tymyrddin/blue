# Brute force

THE NARRATOR: J&Y Enterprise is one of the top coffee retails in the world. They are known as tech-coffee shops 
and serve millions of coffee lover tech geeks and IT specialists every day.

They are famous for specific coffee recipes for the IT community and unique names for these products. Their top five 
recipe names are WannaWhite, ZeroSleep, MacDown, BerryKeep and CryptoY.

J&Y's latest recipe, "Shot4J", attracted great attention at the global coffee festival. J&Y officials promised that 
the product will hit the stores in the coming months.

The super-secret of this recipe is hidden in a digital safe. Attackers are after this recipe, and J&Y enterprises 
are having difficulties protecting their digital assets.

Last week, they received multiple attacks and decided to work with you to help them improve their security level 
and protect their recipe secrets.

This is your assistant, J.A.V.A. (Just Another Virtual Assistant). She is an AI-driven virtual assistant and will 
help you notice possible anomalies. Hey, wait, something is happening...

J.A.V.A.: Welcome, sir. I am sorry for the interruption. It is an emergency. Somebody is knocking on the door!

YOU: Knocking on the door? What do you mean by "knocking on the door"?

J.A.V.A.: We have a brute-force attack, sir.

THE NARRATOR: This is not a comic book! Would you mind going and checking what's going on! Please...

J.A.V.A.: Sir, you need to observe the traffic with Snort and identify the anomaly first. Then you can create a 
rule to stop the brute-force attack. GOOD LUCK!

Start in sniffer mode and capture some data:

```text
sudo snort -dev -l .
```

Investigate with the logfile just created:

```text
sudo snort -r snort.log.1669600005
```

Most packets are sent to port 80 and 22:

```text
sudo snort -r snort.log.  'port 80' -n 10
```

This traffic appears to be normal browsing traffic.

```text
sudo snort -r snort.log.  'port 22' -n 10

...
WARNING: No preprocessors configured for policy 0.
11/28-01:46:45.872757 10.10.245.36:46862 -> 10.10.140.29:22
TCP TTL:64 TOS:0x0 ID:64426 IpLen:20 DgmLen:68 DF
***AP*** Seq: 0x8B1F1461  Ack: 0xA4DD5677  Win: 0x1E1  TcpLen: 32
TCP Options (3) => NOP NOP TS: 1884616219 4119723644 
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+

WARNING: No preprocessors configured for policy 0.
11/28-01:46:45.872773 10.10.140.29:22 -> 10.10.245.36:46862
TCP TTL:64 TOS:0x0 ID:29890 IpLen:20 DgmLen:52 DF
***A**** Seq: 0xA4DD5677  Ack: 0x8B1F1471  Win: 0x1E3  TcpLen: 32
TCP Options (3) => NOP NOP TS: 4119723645 1884616219 
=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
```

This traffic indicates a possible brute-force attack on tcp port 22 (ssh).

```text
sudo nano /etc/snort/rules/local.rules
```

Create a rule:

```text
# $Id: local.rules,v 1.11 2004/07/23 20:15:44 bmc Exp $
# ----------------
# LOCAL RULES
# ----------------
# This file intentionally does not come with signatures.  Put your local
# additions here.

drop tcp any 22 <> any any (msg: "Brute Force Detected"; sid: 100001; rev:1;)
```

Start snort in IPS mode:

```text
sudo snort -c /etc/snort/snort.conf -q -Q --daq afpacket -i eth0:eth1 -A full
```

And flag!
