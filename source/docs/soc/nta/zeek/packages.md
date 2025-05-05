# Packages

Zeek Package Manager helps users install third-party scripts and plugins to extend Zeek functionalities with ease. 
The package manager is installed with Zeek and available with the zkg command. Users can install, load, remove, 
update and create packages with the `zkg` tool.

## Questions

Ensure you are in the right directory to find the pcap file and accompanying files: `Desktop/Exercise-Files/TASK-9`

Investigate the `http.pcap` file with the `zeek-sniffpass` module. 

    zeek -Cr http.pcap /opt/zeek/share/zeek/site/zeek-sniffpass

Investigate the `notice.log` file. **Which username has more module hits?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-9/cleartext-pass$ cat notice.log | zeek-cut msg
Password found for user BroZeek
Password found for user BroZeek
Password found for user BroZeek
Password found for user ZeekBro
Password found for user ZeekBro
```

Investigate the `case2.pcap` file with `geoip-conn` module.  

    zeek -Cr case2.pcap /opt/zeek/share/zeek/site/geoip-conn

Investigate the `conn.log file`. **What is the name of the identified City?** **Which IP address is associated with the identified City?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-9/geoip-conn$ cat conn.log | zeek-cut geo.resp.city
Chicago
...
```

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-9/geoip-conn$ cat conn.log | zeek-cut geo.resp.city id.resp_h
	23.77.86.54
	...
```

Investigate the `case2.pcap` file with `sumstats-counttable.zeek` script.
**How many types of status codes are there in the given traffic capture?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-9/geoip-conn$ zeek -Cr case2.pcap sumstats-counttable.zeek
Host: 23.77.86.54
status code: 301, count: 4
Host: 116.203.71.114
status code: 302, count: 4
status code: 404, count: 6
status code: 301, count: 4
status code: 200, count: 26
```

## Resources

* [Zeek Package Browser](https://packages.zeek.org/)
* [zeek/packages](https://github.com/zeek/packages)
