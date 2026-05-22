| ![Volatility](/_static/images/volatility-room-banner.png)
|:--:|
| [THM Room: Volatility](https://tryhackme.com/room/volatility) |

# BOB! THIS ISN'T A HORSE! (Volatility)

Your SOC has informed you that they have gathered a memory dump from a quarantined endpoint thought to have been 
compromised by a banking trojan masquerading as an Adobe document. Your job is to use your knowledge of threat 
intelligence and reverse engineering to perform memory forensics on the infected host.

You have been informed of a suspicious IP in connection to the file that could be helpful: `41.168.5.140`

The memory file is located in `/Scenarios/Investigations/Investigation-1.vmem`

```text
thmanalyst@ubuntu:~$ python3 /opt/volatility3/vol.py -f /Scenarios/Investigations/Investigation-1.vmem windows.info
Volatility 3 Framework 1.0.1
Progress:  100.00		PDB scanning finished                     
Variable	Value

Kernel Base	0x804d7000
DTB	0x2fe000
Symbols	file:///opt/volatility3/volatility3/symbols/windows/ntkrnlpa.pdb/30B5FB31AE7E4ACAABA750AA241FF331-1.json.xz
Is64Bit	False
IsPAE	True
primary	0 WindowsIntelPAE
memory_layer	1 FileLayer
KdDebuggerDataBlock	0x80545ae0
NTBuildLab	2600.xpsp.080413-2111
CSDVersion	3
KdVersionBlock	0x80545ab8
Major/Minor	15.2600
MachineType	332
KeNumberProcessors	1
SystemTime	2012-07-22 02:45:08
NtSystemRoot	C:\WINDOWS
NtProductType	NtProductWinNt
NtMajorVersion	5
NtMinorVersion	1
PE MajorOperatingSystemVersion	5
PE MinorOperatingSystemVersion	1
PE Machine	332
PE TimeDateStamp	Sun Apr 13 18:31:06 2008
thmanalyst@ubuntu:~$ 
```

Checking processes:

```text
thmanalyst@ubuntu:~$ python3 /opt/volatility3/vol.py -f /Scenarios/Investigations/Investigation-1.vmem windows.psscan
Volatility 3 Framework 1.0.1
Progress:  100.00		PDB scanning finished                     
PID	PPID	ImageFileName	Offset	Threads	Handles	SessionId	Wow64	CreateTime	ExitTime	File output

908	652	svchost.exe	0x2029ab8	9	226	0	False	2012-07-22 02:42:33.000000 	N/A	Disabled
664	608	lsass.exe	0x202a3b8	24	330	0	False	2012-07-22 02:42:32.000000 	N/A	Disabled
652	608	services.exe	0x202ab28	16	243	0	False	2012-07-22 02:42:32.000000 	N/A	Disabled
1640	1484	reader_sl.exe	0x207bda0	5	39	0	False	2012-07-22 02:42:36.000000 	N/A	Disabled
1512	652	spoolsv.exe	0x20b17b8	14	113	0	False	2012-07-22 02:42:36.000000 	N/A	Disabled
1588	1004	wuauclt.exe	0x225bda0	5	132	0	False	2012-07-22 02:44:01.000000 	N/A	Disabled
788	652	alg.exe	0x22e8da0	7	104	0	False	2012-07-22 02:43:01.000000 	N/A	Disabled
1484	1464	explorer.exe	0x23dea70	17	415	0	False	2012-07-22 02:42:36.000000 	N/A	Disabled
1056	652	svchost.exe	0x23dfda0	5	60	0	False	2012-07-22 02:42:33.000000 	N/A	Disabled
1136	1004	wuauclt.exe	0x23fcda0	8	173	0	False	2012-07-22 02:43:46.000000 	N/A	Disabled
1220	652	svchost.exe	0x2495650	15	197	0	False	2012-07-22 02:42:35.000000 	N/A	Disabled
608	368	winlogon.exe	0x2498700	23	519	0	False	2012-07-22 02:42:32.000000 	N/A	Disabled
584	368	csrss.exe	0x24a0598	9	326	0	False	2012-07-22 02:42:32.000000 	N/A	Disabled
368	4	smss.exe	0x24f1020	3	19	N/A	False	2012-07-22 02:42:31.000000 	N/A	Disabled
1004	652	svchost.exe	0x25001d0	64	1118	0	False	2012-07-22 02:42:33.000000 	N/A	Disabled
824	652	svchost.exe	0x2511360	20	194	0	False	2012-07-22 02:42:33.000000 	N/A	Disabled
4	0	System	0x25c89c8	53	240	N/A	False	N/A	N/A	Disabled
thmanalyst@ubuntu:~$ 
```
`reader_sl.exe` is suspicious. What is its parent process?

```text
$ python3 /opt/volatility3/vol.py -f /Scenarios/Investigations/Investigation-1.vmem windows.pstree
Volatility 3 Framework 1.0.1
Progress:  100.00		PDB scanning finished                     
PID	PPID	ImageFileName	Offset(V)	Threads	Handles	SessionId	Wow64	CreateTime	ExitTime

4	0	System	0x8205bda0	53	240	N/A	False	N/A	N/A
* 368	4	smss.exe	0x8205bda0	3	19	N/A	False	2012-07-22 02:42:31.000000 	N/A
...
1484	1464	explorer.exe	0x8205bda0	17	415	0	False	2012-07-22 02:42:36.000000 	N/A
* 1640	1484	reader_sl.exe	0x8205bda0	5	39	0	False	2012-07-22 02:42:36.000000 	N/A
thmanalyst@ubuntu:~$
```

User-agent?

```text
thmanalyst@ubuntu:~$ python3 /opt/volatility3/vol.py -f /Scenarios/Investigations/Investigation-1.vmem -o /home/thmanalyst windows.memmap.Memmap --pid 1640 --dump
...
thmanalyst@ubuntu:~$ ls
pid.1640.dmp
```

Once the dump is stored use, `strings *.dmp | grep -i "user-agent"`:

```text
strings *.dmp | grep -i "user-agent"
thmanalyst@ubuntu:~$ strings *.dmp | grep -i "user-agent"
User-Agent
User-Agent: Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; en-US)
 cs(User-Agent)
USER-AGENT:
User-Agent:
thmanalyst@ubuntu:~$ 
```

Was Chase Bank one of the suspicious bank domains found?

```text
thmanalyst@ubuntu:~$ strings *.dmp | grep "chase"
*chase.com*
...
<td class="steptextoff" align="center" title="Step two of three has not been completed.">Credit Card confirmation<img src="https://chaseonline.chase.com/images//spacer.gif" alt="Step two of three has not been completed." width="1" height="1"/></td>
...
```