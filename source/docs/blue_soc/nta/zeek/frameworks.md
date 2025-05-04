# Frameworks

Zeek has 15+ frameworks that help analysts to discover the different events of interest.

## Questions

Ensure you are in the right directory to find the pcap file and accompanying files: `Desktop/Exercise-Files/TASK-8`

Investigate the `case1.pcap` file with `intelligence-demo.zeek` script. 

    zeek -C -r case1.pcap intelligence-demo.zeek

Investigate the `intel.log` file. 
**Look at the second finding, where was the intel info found?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-8$ cat intel.log
#separator \x09
#set_separator	,
#empty_field	(empty)
#unset_field	-
#path	intel
#open	2022-11-29-01-10-33
#fields	ts	uid	id.orig_h	id.orig_p	id.resp_h	id.resp_p	seen.indicator	seen.indicator_type	seen.where	seen.node	matched	sources	fuid	file_mime_type	file_desc
#types	time	string	addr	port	addr	port	string	enum	enum	string	set[enum]	set[string]	string	string	string
1561667898.779213	CB7PV32LkE7FysWa7k	10.6.27.102	53770	10.6.27.1	53	smart-fax.com	Intel::DOMAIN	DNS::IN_REQUEST	zeek	Intel::DOMAIN	TASK-8-Demo	-	-	-
1561667898.911759	CVNbG83FLsjLKgtbhi	10.6.27.102	49162	107.180.50.162	80	smart-fax.com	Intel::DOMAIN	HTTP::IN_HOST_HEADER	zeek	Intel::DOMAIN	TASK-8-Demo	-	-	-
#close	2022-11-29-01-10-33
```

Investigate the `http.log` file. **What is the name of the downloaded `.exe` file?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-8$ cat http.log | zeek-cut uri
/ncsi.txt
/Documents/Invoice&MSO-Request.doc
/knr.exe
```

Investigate the `case1.pcap` file with `hash-demo.zeek` script. Investigate the `files.log` file. 

    zeek -C -r case1.pcap hash-demo.zeek

**What is the `MD5` hash of the downloaded `.exe` file?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-8$ cat files.log | zeek-cut md5
cd5a4d3fdd5bffc16bf959ef75cf37bc
b5243ec1df7d1d5304189e7db2744128
cc28e40b46237ab6d5282199ef78c464  <=
```

Investigate the `case1.pcap` file with `file-extract-demo.zeek` script.

    zeek -C -r case1.pcap /opt/zeek/share/zeek/policy/frameworks/files/extract-all-files.zeek

Investigate the `extract_files` folder. Review the contents of the text file. **What is written in the file?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-8/extract_files$ file * | nl
     1	extract-1561667874.743959-HTTP-Fpgan59p6uvNzLFja:  ASCII text, with no line terminators
     2	extract-1561667889.703239-HTTP-FB5o2Hcauv7vpQ8y3:  Composite Document File V2 Document, Little Endian, Os: Windows, Version 6.3, Code page: 1252, Template: Normal.dotm, Last Saved By: Administrator, Revision Number: 2, Name of Creating Application: Microsoft Office Word, Create Time/Date: Thu Jun 27 18:24:00 2019, Last Saved Time/Date: Thu Jun 27 18:24:00 2019, Number of Pages: 1, Number of Words: 0, Number of Characters: 1, Security: 0
     3	extract-1561667899.060086-HTTP-FOghls3WpIjKpvXaEl: PE32 executable (GUI) Intel 80386, for MS Windows
```

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-8/extract_files$ cat extract-1561667874.743959-HTTP-Fpgan59p6uvNzLFja
Microsoft NCSI
```

## Resources

* [Zeek: Frameworks](https://docs.zeek.org/en/master/frameworks/index.html)