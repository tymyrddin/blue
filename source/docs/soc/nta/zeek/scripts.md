# Scripts

Zeek has its own event-driven scripting language, which is as powerful as high-level languages and allows us to 
investigate and correlate the detected events. Scripts can also be used to apply a policy.

| **What**                                                                                                                                                          | **Where**                                                                        |
|:------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| Zeek has base scripts installed by default, and <br>these are not intended to be modified.                                                                        | These scripts are located in <br>`/opt/zeek/share/zeek/base`.                    |
| User-generated or modified scripts should be located <br>in a specific path.                                                                                      | These scripts are located in <br>`/opt/zeek/share/zeek/site`.                    |
| Policy scripts are located in a specific path.                                                                                                                    | These scripts are located in <br>`/opt/zeek/share/zeek/policy`.                  |
| To automatically load/use a script in live sniffing <br>mode, identify the script in the Zeek configuration file. <br>You can also use a script for a single run. | The configuration file is located in <br>`/opt/zeek/share/zeek/site/local.zeek`. |

* Zeek scripts use the `.zeek` extension.
* Do not modify anything under the `zeek/base` directory. User-generated and modified scripts should be in the `zeek/site` directory. 
* You can call scripts in live monitoring mode by loading them with the command load `@/script/path` or load `@script-name` in `local.zeek` file. 
* Zeek is event-oriented, not packet-oriented! Use/write scripts to handle the event of interest.

## GUI vs scripts

Sample script:

```text
event dhcp_message (c: connection, is_orig: bool, msg: DHCP::Msg, options: DHCP::Options)
{
print options$host_name;
}
```

Use:

```text
ubuntu@ubuntu$ zeek -C -r smallFlows.pcap dhcp-hostname.zeek 
student01-PC
vinlap01
```

## Customized script locations

    /opt/zeek/share/zeek/base/bif
    /opt/zeek/share/zeek/base/bif/plugins
    /opt/zeek/share/zeek/base/protocols

## Questions

Ensure you are in the right directory to find the pcap file and accompanying files: `Desktop/Exercise-Files/TASK-6`

Investigate the `smallFlows.pcap` file. Investigate the `dhcp.log` file. 

    zeek -C -r smallFlows.pcap dhcp-hostname.zeek

**What is the domain value of the `vinlap01` host?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-6/smallflow$ cat dhcp.log
#separator \x09
#set_separator	,
#empty_field	(empty)
#unset_field	-
#path	dhcp
#open	2022-11-29-00-36-54
#fields	ts	uids	client_addr	server_addr	mac	host_name	client_fqdn	domain	requested_addr	assigned_addr	lease_time	client_message	server_message	msg_types	duration
#types	time	set[string]	addr	addr	string	string	string	string	addr	addr	interval	string	string	vector[string]	interval
1295981573.013593	CCeH6O2TYiCIiNUQV9	192.168.3.131	-	40:61:86:9a:f1:f5	student01-PC	-	-	-	-	-	-	-INFORM	0.000000
1295981640.291009	CIwdwt1EsLJNcVGLEe,CJeD8z4JyIrDrPEeB5	172.16.255.1	-00:1e:68:51:4f:a9	vinlap01	-	astaro_vineyard	-	-	--	-	INFORM,ACK	0.000591
#close	2022-11-29-00-36-56
```

Investigate the `bigFlows.pcap` file. 

    zeek -C -r bigFlows.pcap dhcp-hostname.zeek

Investigate the `dhcp.log` file. 
**What is the number of identified unique hostnames?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-6/bigflow$ cat dhcp.log | zeek-cut host_name | sort -rn | uniq | wc -l
18   <= -1
```

Investigate the `dhcp.log` file. 
**What is the identified domain value?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-6/bigflow$ cat dhcp.log | zeek-cut domain
jaalam.net
```

Investigate the `dns.log` file. 
**What is the number of unique queries?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-6/bigflow$ cat dns.log | zeek-cut query | grep -v -e '*' -e '-' | sort -rn | uniq | wc -l
1109
```

## Resources

* [Zeek's official training platform](https://try.bro.org/#/?example=hello)