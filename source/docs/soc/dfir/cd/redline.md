# RedLine

## Scenario

[Cyber Defenders RedLine challenge](https://cyberdefenders.org/blueteam-ctf-challenges/106): As a member of the Security Blue team, your assignment is to analyze a memory dump using Redline and Volatility tools. Your goal is to trace the steps taken by the attacker on the compromised machine and determine how they managed to bypass the Network Intrusion Detection System "NIDS". Your investigation will involve identifying the specific malware family employed in the attack, along with its characteristics. Additionally, your task is to identify and mitigate any traces or footprints left by the attacker.

## Tools

* [Volatility 3](https://docs.remnux.org/discover-the-tools/perform+memory+forensics) on SIFT-REMnux.

----

## Questions

Q1 What is the name of the suspicious process?

```text
sansforensics@siftworkstation: ~/Desktop/cases/c86-REDSTEALER-redline
$ vol3 -f MemoryDump.mem windows.malfind
Volatility 3 Framework 2.5.0
...
Progress:  100.00               Reading Symbol layer                                 Progress:  100.00               PDB scanning finished                                                                                              
PID	Process	Start VPN	End VPN	Tag	Protection	CommitCharge	PrivateMemory	File output	Hexdump	Disasm

5896	oneetx.exe	0x400000	0x437fff	VadS	PAGE_EXECUTE_READWRITE	56	1	Disabled	
4d 5a 90 00 03 00 00 00	MZ......
04 00 00 00 ff ff 00 00	........
b8 00 00 00 00 00 00 00	........
40 00 00 00 00 00 00 00	@.......
00 00 00 00 00 00 00 00	........
00 00 00 00 00 00 00 00	........
00 00 00 00 00 00 00 00	........
00 00 00 00 00 01 00 00	........	
0x400000:	dec	ebp
0x400001:	pop	edx
0x400002:	nop	
0x400003:	add	byte ptr [ebx], al
0x400005:	add	byte ptr [eax], al
0x400007:	add	byte ptr [eax + eax], al
0x40000a:	add	byte ptr [eax], al
7540	smartscreen.ex	0x2505c140000	0x2505c15ffff	VadS	PAGE_EXECUTE_READWRITE	1	1	Disabled	
48 89 54 24 10 48 89 4c	H.T$.H.L
24 08 4c 89 44 24 18 4c	$.L.D$.L
89 4c 24 20 48 8b 41 28	.L$.H.A(
48 8b 48 08 48 8b 51 50	H.H.H.QP
48 83 e2 f8 48 8b ca 48	H...H..H
b8 60 00 14 5c 50 02 00	.`..\P..
00 48 2b c8 48 81 f9 70	.H+.H..p
0f 00 00 76 09 48 c7 c1	...v.H..	
0x2505c140000:	mov	qword ptr [rsp + 0x10], rdx
0x2505c140005:	mov	qword ptr [rsp + 8], rcx
0x2505c14000a:	mov	qword ptr [rsp + 0x18], r8
0x2505c14000f:	mov	qword ptr [rsp + 0x20], r9
0x2505c140014:	mov	rax, qword ptr [rcx + 0x28]
0x2505c140018:	mov	rcx, qword ptr [rax + 8]
0x2505c14001c:	mov	rdx, qword ptr [rcx + 0x50]
0x2505c140020:	and	rdx, 0xfffffffffffffff8
0x2505c140024:	mov	rcx, rdx
0x2505c140027:	movabs	rax, 0x2505c140060
0x2505c140031:	sub	rcx, rax
0x2505c140034:	cmp	rcx, 0xf70
0x2505c14003b:	jbe	0x2505c140046
```

Q2 What is the child process name of the suspicious process?

```text
sansforensics@siftworkstation: ~/Desktop/cases/c86-REDSTEALER-redline
$ vol3 -f MemoryDump.mem windows.pslist
Volatility 3 Framework 2.5.0
Progress:  100.00		PDB scanning finished                        
PID	PPID	ImageFileName	Offset(V)	Threads	Handles	SessionId	Wow64	CreateTime	ExitTime	File output

...
5896	8844	oneetx.exe	0xad8189b41080	5	-	1	True	2023-05-21 22:30:56.000000 	N/A	Disabled
7732	5896	rundll32.exe	0xad818d1912c0	1	-	1	True	2023-05-21 22:31:53.000000 	N/A	Disabled
...
```

Q3 What is the memory protection applied to the suspicious process memory region?

```text
5896	oneetx.exe	0x400000	0x437fff	VadS	PAGE_EXECUTE_READWRITE	56	1	Disabled
```

Q4 What is the name of the process responsible for the VPN connection?

```text
sansforensics@siftworkstation: ~/Desktop/cases/c86-REDSTEALER-redline
$ vol3 -f MemoryDump.mem windows.pstree
Volatility 3 Framework 2.5.0
Progress:  100.00		PDB scanning finished                        
PID	PPID	ImageFileName	Offset(V)	Threads	Handles	SessionId	Wow64	CreateTime	ExitTime

...
*** 6724	3580	Outline.exe	0xad818e578080	0	-	1	True	2023-05-21 22:36:09.000000 	2023-05-21 23:01:24.000000 
**** 4224	6724	Outline.exe	0xad818e88b080	0	-	1	True	2023-05-21 22:36:23.000000 	2023-05-21 23:01:24.000000 
**** 4628	6724	tun2socks.exe	0xad818de82340	0	-	1	True	2023-05-21 22:40:10.000000 	2023-05-21 23:01:24.000000
...
```

Q5 What is the attacker's IP address?

```text
sansforensics@siftworkstation: ~/Desktop/cases/c86-REDSTEALER-redline
$ vol3 -f MemoryDump.mem windows.netscan | grep -i oneetx.exe
0xad818de4aa20.0TCPv4	10.0.85.2DB scan55462fin 77.91.124.20    80      CLOSED	5896	oneetx.exe	2023-05-21 23:01:22.000000 
0xad818e4a6900	UDPv4	0.0.0.0	0	*	0		5480	oneetx.exe	2023-05-21 22:39:47.000000 
0xad818e4a6900	UDPv6	::	0	*	0		5480	oneetx.exe	2023-05-21 22:39:47.000000 
0xad818e4a9650	UDPv4	0.0.0.0	0	*	0		5480	oneetx.exe	2023-05-21 22:39:47.000000
```

Q6 Based on the previous artifacts. What is the name of the malware family?

[MalwareBazaar Database RedLineStealer](https://bazaar.abuse.ch/sample/cb1db618ce36feea3e333e74e920a76332340f0094fe777aba6d95d08c80743b/)

Q7 What is the full URL of the PHP file that the attacker visited?

```text
hxxp[://]77[.]91[.]124[.]20/store/games/index[.]php
```

Q8 What is the full path of the malicious executable?

```text
sansforensics@siftworkstation: ~/Desktop/cases/c86-REDSTEALER-redline
$ vol3 -f MemoryDump.mem windows.filescan | grep -i oneetx.exe
0xad818d436c70.0\Users\Tammam\AppData\Local\Temp\c3912af058\oneetx.exe	216
0xad818da36c30	\Users\Tammam\AppData\Local\Temp\c3912af058\oneetx.exe	216
0xad818ef1a0b0	\Users\Tammam\AppData\Local\Temp\c3912af058\oneetx.exe	216
```
