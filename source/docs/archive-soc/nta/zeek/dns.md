# Anomalous DNS

An alert triggered: `Anomalous DNS Activity`.

The case was assigned to you. Inspect the PCAP and retrieve the artefacts to confirm this alert is a true positive. 

## Questions

Investigate the `dns-tunneling.pcap` file. 

    zeek -Cr dns-tunneling.pcap

Investigate the `dns.log` file. 

```text
ubuntu@ip-10-10-177-209:~/Desktop/Exercise-Files/anomalous-dns$ head dns.log
#separator \x09
#set_separator	,
#empty_field	(empty)
#unset_field	-
#path	dns
#open	2022-11-29-02-25-45
#fields	ts	uid	id.orig_h	id.orig_p	id.resp_h	id.resp_p	proto	trans_id	rtt	query	qclass	qclass_name	qtype	qtype_name	rcode	rcode_name	AA	TC	RD	RA	Z	answers	TTLs	rejected
#types	time	string	addr	port	addr	port	enum	count	intervalstring	count	string	count	string	count	string	bool	bool	bool	bool	count	vector[string]	vector[interval]	bool
1623212924.825154	CrFIrVDZv1s1wIMvg	10.20.57.3	59580	10.10.2.22	53	udp	5374	0.855652	e7f1018ea0310f25bba0610936fd1cc2af.cisco-update.com	1	C_INTERNET	15	MX	0	NOERRORFF	T	T	0	3591018ea0f08b48069ca0ffff640c1cfb.cisco-update.com	58.000000	F
1623212925.678141	Cgwae92G7gBAmh0KWh	10.20.57.3	47888	10.10.2.22	53	udp	7434	0.158643	0cfe016cb105e87901f6020958d084ff84.cisco-update.com	1	C_INTERNET	15	MX	0	NOERRORFF	T	T	0	22e1016cb1f9131fda4f34ffff52a924b3.cisco-update.com	58.000000	F
```

**What is the number of DNS records linked to the IPv6 address?**

```text
ubuntu@ip-10-10-177-209:~/Desktop/Exercise-Files/anomalous-dns$ cat dns.log | zeek-cut qtype_name | grep -i AAAA | wc -l
320
```

Investigate the `conn.log` file. 

```text
ubuntu@ip-10-10-177-209:~/Desktop/Exercise-Files/anomalous-dns$ head conn.log
#separator \x09
#set_separator	,
#empty_field	(empty)
#unset_field	-
#path	conn
#open	2022-11-29-02-25-45
#fields	ts	uid	id.orig_h	id.orig_p	id.resp_h	id.resp_p	proto	service	duration	orig_bytes	resp_bytes	conn_state	local_orig	local_resp	missed_bytes	history	orig_pkts	orig_ip_bytes	resp_pkts	resp_ip_bytes	tunnel_parents
#types	time	string	addr	port	addr	port	enum	string	intervalcount	count	string	bool	bool	count	string	count	count	count	count	set[string]
1623212924.825154	CrFIrVDZv1s1wIMvg	10.20.57.3	59580	10.10.2.22	53	udp	dns	0.855652	80	175	SF	-	-0	Dd	1	108	1	203	-
1623212925.678141	Cgwae92G7gBAmh0KWh	10.20.57.3	47888	10.10.2.22	53	udp	dns	0.158643	80	175	SF	-	-0	Dd	1	108	1	203	-
```

**What is the longest connection duration?**

```text
ubuntu@ip-10-10-177-209:~/Desktop/Exercise-Files/anomalous-dns$ cat conn.log | zeek-cut duration | sort -n | uniq
...
9.420791
```

Investigate the `dns.log` file. Filter all unique DNS queries. **What is the number of unique domain queries?**

You need to use the DNS query values for summarising and counting the number of unique domains. There are lots of 
`***.cisco-update.com` DNS queries, you need to filter the main address and find out the rest of the queries that 
don't contain the `***.cisco-update.com` pattern. You can filter the main `***.cisco-update.com` DNS pattern as 
`cisco-update.com` with `cat dns.log | zeek-cut query | rev | cut -d '.' -f 1-2 | rev | head`

```text
ubuntu@ip-10-10-177-209:~/Desktop/Exercise-Files/anomalous-dns$ cat dns.log | zeek-cut query | rev | cut -d '.' -f 1-2 | rev | sort | uniq
_tcp.local
cisco-update.com
in-addr.arpa
ip6.arpa
rhodes.edu
ubuntu.com
```

```text
ubuntu@ip-10-10-177-209:~/Desktop/Exercise-Files/anomalous-dns$ cat dns.log | zeek-cut query | rev | cut -d '.' -f 1-2 | rev | sort | uniq | wc -l
6
```

There are a massive amount of DNS queries sent to the same domain. This is abnormal. Let's find out which hosts are 
involved in this activity. **What is the IP address of the source host?**

```text
ubuntu@ip-10-10-177-209:~/Desktop/Exercise-Files/anomalous-dns$ cat dns.log | zeek-cut id.orig_h | sort | uniq
10.20.57.3
fe80::202a:f0b1:7d9c:bd9e
```
