# Scripts and signatures

Zeek scripts can refer to signatures and other Zeek scripts. This flexibility provides a massive advantage in 
event correlation.

## Questions

Ensure you are in the right directory to find the pcap file and accompanying files: `Desktop/Exercise-Files/TASK-7`

Go to folder `TASK-7/101`. Investigate the `sample.pcap` file with the `103.zeek` script. Investigate the terminal 
output. **What is the number of the detected new connections?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-7/101$ zeek -C -r sample.pcap 103.zeek | grep "New Connection Found" | wc -l
87
```

Go to folder `TASK-7/201`. Investigate the `ftp.pcap` file with `ftp-admin.sig` signature and `201.zeek` script. 
Investigate the `signatures.log` file. 

    zeek -C -r ftp.pcap -s ftp-admin.sig 201.zeek

**What is the number of signature hits?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-7/201$ cat signatures.log | grep "ftp-admin" | wc -l
1401
```

Investigate the `signatures.log` file. 
**What is the total number of `administrator` username detections?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-7/201$ cat signatures.log | grep "administrator" | wc -l
731
```

Investigate the `ftp.pcap` file with all local scripts, and investigate the `loaded_scripts.log` file. 
**What is the total number of loaded scripts?**

    zeek -C -r ftp.pcap local

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-7/201$ cat loaded_scripts.log | grep ".zeek" | wc -l
498
```

Go to folder `TASK-7/202`. Investigate the `ftp-brute.pcap` file with the 
`/opt/zeek/share/zeek/policy/protocols/ftp/detect-bruteforcing.zeek` script. 

    zeek -C -r ftp-brute.pcap /opt/zeek/share/zeek/policy/protocols/ftp/detect-bruteforcing.zeek

Investigate the `notice.log` file. 
**What is the total number of brute-force detections?**

```text
ubuntu@ip-10-10-218-60:~/Desktop/Exercise-Files/TASK-7/202$ cat notice.log | grep "Bruteforcing" | wc -l
2
```