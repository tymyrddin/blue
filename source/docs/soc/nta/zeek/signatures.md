# Signatures

Zeek supports signatures to have rules and event correlations to find noteworthy activities on the network. 
Zeek signatures use low-level pattern matching and cover conditions similar to Snort rules. Unlike Snort rules, 
Zeek rules are not the primary event detection point. Zeek has a scripting language and can chain multiple events 
to find an event of interest.

Zeek signatures are composed of three logical paths; signature id, conditions and action.

| Logical path     | Breakdown                                                                                                              |
|:-----------------|------------------------------------------------------------------------------------------------------------------------|
| **Signature id** | **Unique** signature name.                                                                                             |
| **Conditions**   | **Header**: Filtering the packet headers for specific source and destination addresses, <br>protocol and port numbers. |
|                  | **Content**: Filtering the packet payload for specific value/pattern.                                                  |                                               
| **Action**       | **Default action**: Create the `signatures.log` file in case of a signature match.                                     |
|                  | **Additional action**: Trigger a Zeek script.                                                                          |

The most common conditions and filters for Zeek signatures:

| **Condition Field**         | **Available Filters**                                                                                                                                                                                                                                                                                                                  |
|:----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Header**                  | `src-ip`: Source IP.<br>`dst-ip`: Destination IP.<br>`src-port`: Source port.<br>`dst-port`: Destination port.<br>`ip-proto`: Target protocol. Supported protocols; TCP, UDP, ICMP, ICMP6, IP, IP6                                                                                                                                     |
| **Content**                 | `payload`: Packet payload.<br>`http-request`: Decoded HTTP requests.<br>`http-request-header`: Client-side HTTP headers.<br>`http-request-body`: Client-side HTTP request bodys.<br>`http-reply-header`: Server-side HTTP headers.<br>`http-reply-body`: Server-side HTTP request bodys.<br>`ftp`: Command line input of FTP sessions. |
| **Context**                 | `same-ip`: Filtering the source and destination addresses for duplication.                                                                                                                                                                                                                                                             |
| **Action**                  | `event`: Signature match message.                                                                                                                                                                                                                                                                                                      |
| **Comparison<br>Operators** | ==, !=, <, <=, >, >=                                                                                                                                                                                                                                                                                                                   |
| **NOTE!**                   | Filters accept string, numeric and regex values.                                                                                                                                                                                                                                                                                       |

To run Zeek with a signature file:

```text
zeek -C -r sample.pcap -s sample.sig
```

- `-C`: Ignore checksum errors.
- `-r`: Read pcap file.
- `-s`: Use signature file.

## Questions

Ensure you are in the right directory to find the `pcap` file and accompanying files: `Desktop/Exercise-Files/TASK-5`.

### HTTP

Investigate the `http.pcap` file. Create the HTTP signature and investigate the `pcap`. 

```text
nano http-password.sig
```

HTTP signature:

```text
signature http-password {
    ip-proto == tcp
    dst-port == 80
    payload /.*password.*/
    event "Clear-text password found."
}
```

Run `zeek`:

    zeek -C -r http.pcap -s http-password.sig

**What is the source IP of the first event?**

    cat signatures.log | zeek-cut src_addr
    10.10.57.178 <=
    10.10.57.178

**What is the source port of the second event?**

    cat signatures.log | zeek-cut src_port
    38706
    38712 <=

Investigate the `conn.log`.
**What is the total number of the sent and received packets from source port `38706`?**

    cat conn.log | zeek-cut id.orig_p id.resp_h id.resp_p proto service orig_pkts orig_ip_bytes resp_pkts
    38704	44.228.249.3	80	tcp	-	4	216	2
    38706	44.228.249.3	80	tcp	http	11	1815	9  <= Total 20
    38708	44.228.249.3	80	tcp	-	4	216	2
    38710	44.228.249.3	80	tcp	-	4	216	2
    38712	44.228.249.3	80	tcp	http	6	1272	5

### FTP

Create signature file and investigate the `ftp.pcap` file.

```text
signature ftp-username {
    ip-proto == tcp
    ftp /.*USER.*dmin.*/
    event "FTP Username Input Found!"
}

signature ftp-brute {
    ip-proto == tcp
    payload /.*530.*Login.*incorrect.*/
    event "FTP Brute-force Attempt!"
}
```

Run `zeek`:

    zeek -C -r ftp.pcap -s ftp-bruteforce.sig

Investigate the `notice.log`. **What is the number of unique events?**

Top of the file:

    cat notice.log | head -10

```text
#separator \x09
#set_separator	,
#empty_field	(empty)
#unset_field	-
#path	notice
#open	2022-11-28-21-49-01
#fields	ts	uid	id.orig_h	id.orig_p	id.resp_h	id.resp_p	fuid	file_mime_type	file_descproto	note	msg	sub	src	dst	p	n	peer_descr	actions	email_dest	suppress_for	remote_location.country_code	remote_location.region	remote_location.city	remote_location.latitude	remote_location.longitude
#types	time	string	addr	port	addr	port	string	string	string	enum	enum	string	string	addr	addr	port	count	string	set[enum]	set[string]	interval	string	string	string	double	double
1024380731.015090	CCKUOW2neqARiqxzI6	10.234.125.254	2217	10.121.70.151	21	-	-	-	tcp	Signatures::Sensitive_Signature	10.121.70.151: FTP Brute-force Attempt!	530 Login incorrect.\x0d\x0a	10.121.70.151	10.234.125.254	21	-	-	Notice::ACTION_LOG	(empty)	3600.000000	-	-	-	--
1024380731.043248	C57fWGbeB8QktlHv5	10.234.125.254	2220	10.121.70.151	21	-	-	-	tcp	Signatures::Sensitive_Signature	10.121.70.151: FTP Brute-force Attempt!	530 Login incorrect.\x0d\x0a	10.121.70.151	10.234.125.254	21	-	-	Notice::ACTION_LOG	(empty)	3600.000000	-	-	-	-
```

And construct command:

    cat notice.log | zeek-cut uid | sort | uniq | wc -l
    1413

**What is the number of `ftp-brute` signature matches?**

    cat signatures.log | grep "ftp-brute" | wc -l
    1410

