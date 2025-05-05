# Command & Control level 3

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Command-Control-level-3): Berthier, the antivirus software didn’t find anything. It’s up to you now. 

Try to find the malware in the memory dump. The validation flag is the md5 checksum of the full path of the executable. The uncompressed memory dump md5 hash is `e3a902d4d44e0f7bd9cb29865e0a15de`

----

```text
┌──(kali㉿kali)-[~/Downloads/volatility3]
└─$ ./vol.py -f ch2.dmp windows.pstree
Volatility 3 Framework 2.4.2
Progress:  100.00               PDB scanning finished                        
PID     PPID    ImageFileName   Offset(V)       Threads Handles SessionId       Wow64   CreateTime      ExitTime

4       0       System  0x87978b78      103     3257    N/A     False   2013-01-12 16:38:09.000000      N/A
* 308   4       smss.exe        0x88c3ed40      2       29      N/A     False   2013-01-12 16:38:09.000000      N/A
404     396     csrss.exe       0x8929fd40      9       469     0       False   2013-01-12 16:38:14.000000      N/A
456     396     wininit.exe     0x892ac2b8      3       77      0       False   2013-01-12 16:38:14.000000      N/A
* 560   456     services.exe    0x896294c0      6       205     0       False   2013-01-12 16:38:16.000000      N/A
** 904  560     svchost.exe     0x89852918      17      409     0       False   2013-01-12 16:38:24.000000      N/A
*** 2496        904     dwm.exe 0x87ad44d0      5       77      1       False   2013-01-12 16:40:25.000000      N/A
** 1172 560     svchost.exe     0x898b2790      15      475     0       False   2013-01-12 16:38:27.000000      N/A
** 3352 560     svchost.exe     0x89f3d2c0      9       141     0       False   2013-01-12 16:40:58.000000      N/A
** 928  560     svchost.exe     0x8986b030      26      869     0       False   2013-01-12 16:38:24.000000      N/A
** 3624 560     svchost.exe     0x89f1d3e8      14      348     0       False   2013-01-12 16:41:22.000000      N/A
** 1712 560     spoolsv.exe     0x8a0f9c40      14      338     0       False   2013-01-12 16:38:58.000000      N/A
** 1968 560     vmtoolsd.exe    0x8a1d84e0      6       220     0       False   2013-01-12 16:39:14.000000      N/A
** 2352 560     taskhost.exe    0x87ac0620      8       149     1       False   2013-01-12 16:40:24.000000      N/A
** 692  560     svchost.exe     0x8962f030      10      353     0       False   2013-01-12 16:38:21.000000      N/A
** 1084 560     svchost.exe     0x898911a8      10      257     0       False   2013-01-12 16:38:26.000000      N/A
** 448  560     VMUpgradeHelpe  0x8a1f5030      4       89      0       False   2013-01-12 16:39:21.000000      N/A
*** 468 448     csrss.exe       0x88d03a00      10      471     1       False   2013-01-12 16:38:14.000000      N/A
**** 2600       468     conhost.exe     0x87a9c288      1       35      1       False   2013-01-12 16:40:28.000000      N/A
**** 3228       468     conhost.exe     0x87c595b0      2       54      1       False   2013-01-12 16:44:50.000000      N/A
**** 2168       468     conhost.exe     0x954826b0      2       49      1       False   2013-01-12 16:55:50.000000      N/A
*** 500 448     winlogon.exe    0x892ced40      3       111     1       False   2013-01-12 16:38:14.000000      N/A
** 832  560     svchost.exe     0x89805420      19      435     0       False   2013-01-12 16:38:23.000000      N/A
*** 1720        832     audiodg.exe     0x87c90d40      5       117     0       False   2013-01-12 16:58:11.000000      N/A
** 1220 560     AvastSvc.exe    0x898a7868      66      1180    0       False   2013-01-12 16:38:28.000000      N/A
** 1612 560     TPAutoConnSvc.  0x9542a030      9       135     0       False   2013-01-12 16:39:23.000000      N/A
*** 2568        1612    TPAutoConnect.  0x87ae2880      5       146     1       False   2013-01-12 16:40:28.000000      N/A
** 1872 560     sppsvc.exe      0x88cded40      4       143     0       False   2013-01-12 16:39:02.000000      N/A
** 336  560     wlms.exe        0x9541c7e0      4       45      0       False   2013-01-12 16:39:21.000000      N/A
** 1748 560     svchost.exe     0x8a102748      18      310     0       False   2013-01-12 16:38:58.000000      N/A
** 2900 560     SearchIndexer.  0x898fbb18      13      636     0       False   2013-01-12 16:40:38.000000      N/A
** 3176 560     wmpnetwk.exe    0x87bd35b8      9       240     0       False   2013-01-12 16:40:48.000000      N/A
** 764  560     svchost.exe     0x897b5c20      7       263     0       False   2013-01-12 16:38:23.000000      N/A
* 584   456     lsm.exe         0x8962f7e8      10      142     0       False   2013-01-12 16:38:16.000000      N/A
* 576   456     lsass.exe       0x896427b8      6       566     0       False   2013-01-12 16:38:16.000000      N/A
2548    2484    explorer.exe    0x87ac6030      24      766     1       False   2013-01-12 16:40:27.000000      N/A
* 2720  2548    AvastUI.exe     0x87b784b0      14      220     1       False   2013-01-12 16:40:31.000000      N/A
* 2660  2548    VMwareTray.exe  0x87b82438      5       80      1       False   2013-01-12 16:40:29.000000      N/A
* 1232  2548    taskmgr.exe     0x95495c18      6       116     1       False   2013-01-12 16:42:29.000000      N/A
* 3152  2548    cmd.exe         0x87bf7030      1       23      1       False   2013-01-12 16:44:50.000000      N/A
** 3144 3152    winpmem-1.3.1.  0x87cbfd40      1       23      1       False   2013-01-12 16:59:17.000000      N/A
* 1136  2548    iexplore.exe    0x9549f678      18      454     1       False   2013-01-12 16:57:44.000000      N/A
** 3044 1136    iexplore.exe    0x87d4d338      37      937     1       False   2013-01-12 16:57:46.000000      N/A
* 2676  2548    VMwareUser.exe  0x87aa9220      8       190     1       False   2013-01-12 16:40:30.000000      N/A
* 2772  2548    iexplore.exe    0x87b6b030      2       74      1       False   2013-01-12 16:40:34.000000      N/A
** 1616 2772    cmd.exe 0x89898030      2       101     1       False   2013-01-12 16:55:49.000000      N/A
* 2744  2548    StikyNot.exe    0x898fe8c0      8       135     1       False   2013-01-12 16:40:32.000000      N/A
* 3452  2548    swriter.exe     0x87c6a2a0      1       19      1       False   2013-01-12 16:41:01.000000      N/A
** 3512 3452    soffice.exe     0x87ba4030      1       28      1       False   2013-01-12 16:41:03.000000      N/A
*** 3564        3512    soffice.bin     0x87b8ca58      12      400     1       False   2013-01-12 16:41:05.000000      N/A
3556    3544    soffice.bin     0x95483d18      0       -       1       False   2013-01-12 16:41:05.000000      2013-01-12 16:41:39.000000
```

Apparently there is `cmd.exe` (PID 3152) RUNNING AS child of `explorer.exe` (PID 2548). Trying the most common place to find registry keys for persistence:

```text
┌──(kali㉿kali)-[~/Downloads/volatility3]
└─$ ./vol.py -f ../root-me/forensic/ch2.dmp windows.registry.printkey --key "Software\Microsoft\Windows\CurrentVersion\Run"
Volatility 3 Framework 2.4.2
Progress:  100.00               PDB scanning finished                        
Last Write Time Hive Offset     Type    Key     Name    Data    Volatile

-       0x8b20c008      Key     ?\Software\Microsoft\Windows\CurrentVersion\Run -               -
...
-       0x90cab9d0      Key     ?\Software\Microsoft\Windows\CurrentVersion\Run -               -
2013-01-12 14:13:19.000000      0x9670e9d0      REG_SZ  \??\C:\Users\John Doe\ntuser.dat\Software\Microsoft\Windows\CurrentVersion\Run   RESTART_STICKY_NOTES    "C:\Windows\System32\StikyNot.exe"      False
2013-01-12 14:13:19.000000      0x9670e9d0      REG_SZ  \??\C:\Users\John Doe\ntuser.dat\Software\Microsoft\Windows\CurrentVersion\Run   IEPreload       ""C:\Users\John Doe\AppData\Roaming\Microsoft\Internet Explorer\Quick Launch\iexplore.exe""     False
-       0x9670f9d0      Key     ?\Software\Microsoft\Windows\CurrentVersion\Run -               -
```

[md5sum](https://www.md5hashgenerator.com/) the full path.
