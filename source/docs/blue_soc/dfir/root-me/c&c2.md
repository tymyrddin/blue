# Command & Control level 2

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Command-Control-level-2): Congratulations Berthier, thanks to your help the computer has been identified. You have requested a memory dump but before starting your analysis you wanted to take a look at the antivirus' logs. Unfortunately, you forgot to write down the workstation’s hostname. But since you have its memory dump you should be able to get it back!

The validation flag is the workstation’s hostname. The uncompressed memory dump md5 hash is `e3a902d4d44e0f7bd9cb29865e0a15de`

----

Get file:

```text
┌──(kali㉿kali)-[~/Downloads/root-me]
└─$ wget http://challenge01.root-me.org/forensic/ch2/ch2.tbz2
```

Unpack:

```text
┌──(kali㉿kali)-[~/Downloads/root-me/forensic]
└─$ tar -jxvf ch2.tbz2
ch2.dmp

```

Using volatility3, get info:

```text
┌──(kali㉿kali)-[~/Downloads/volatility3]
└─$ ./vol.py -f ../root-me/forensic/ch2.dmp windows.info
...
Variable        Value

Kernel Base     0x82801000
DTB     0x185000
Symbols file:///home/kali/Downloads/volatility3/volatility3/symbols/windows/ntkrpamp.pdb/5B308B4ED6464159B87117C711E7340C-2.json.z
Is64Bit False
IsPAE   True
layer_name      0 WindowsIntelPAE
memory_layer    1 FileLayer
KdDebuggerDataBlock     0x82929be8
NTBuildLab      7600.16385.x86fre.win7_rtm.09071
CSDVersion      0
KdVersionBlock  0x82929bc0
Major/Minor     15.7600
MachineType     332
KeNumberProcessors      1
SystemTime      2013-01-12 16:59:18
NtSystemRoot    C:\Windows
NtProductType   NtProductWinNt
NtMajorVersion  6
NtMinorVersion  1
PE MajorOperatingSystemVersion  6
PE MinorOperatingSystemVersion  1
PE Machine      332
PE TimeDateStamp        Mon Jul 13 23:15:19 2009
```

Dump the hives:

```text
┌──(kali㉿kali)-[~/Downloads/volatility3]
└─$ ./vol.py -f ../root-me/forensic/ch2.dmp hivelist        
Volatility 3 Framework 2.4.2
Progress:  100.00               PDB scanning finished                        
Offset  FileFullPath    File output

0x8b20c008              Disabled
0x8b21c008      \REGISTRY\MACHINE\SYSTEM        Disabled
0x8b23c008      \REGISTRY\MACHINE\HARDWARE      Disabled
0x8ee66008      \Device\HarddiskVolume1\Boot\BCD        Disabled
0x8ee66740      \SystemRoot\System32\Config\SOFTWARE    Disabled
0x90cab9d0      \SystemRoot\System32\Config\DEFAULT     Disabled
0x9670e9d0      \??\C:\Users\John Doe\ntuser.dat        Disabled
0x9670f9d0      \??\C:\Users\John Doe\AppData\Local\Microsoft\Windows\UsrClass.dat      Disabled
0x9aad6148      \SystemRoot\System32\Config\SAM Disabled
0x9ab25008      \SystemRoot\System32\Config\SECURITY    Disabled
0x9aba79d0      \??\C:\Windows\ServiceProfiles\LocalService\NTUSER.DAT  Disabled
0x9abb1720      \??\C:\Windows\ServiceProfiles\NetworkService\NTUSER.DAT        Disabled
```

Dump the registry key for getting the `ComputerName`:

```text
┌──(kali㉿kali)-[~/Downloads/volatility3]
└─$ ./vol.py -f ../root-me/forensic/ch2.dmp windows.registry.printkey --key "ControlSet001\Control\ComputerName\ComputerName"          
Volatility 3 Framework 2.4.2
Progress:  100.00               PDB scanning finished                        
Last Write Time Hive Offset     Type    Key     Name    Data    Volatile

-       0x8b20c008      Key     ?\ControlSet001\Control\ComputerName\ComputerName       -               -
2013-01-12 00:58:30.000000      0x8b21c008      REG_SZ  \REGISTRY\MACHINE\SYSTEM\ControlSet001\Control\ComputerName\ComputerName(Default)        "mnmsrvc"       False
2013-01-12 00:58:30.000000      0x8b21c008      REG_SZ  \REGISTRY\MACHINE\SYSTEM\ControlSet001\Control\ComputerName\ComputerNameComputerName     "WIN-ETSA91RK***"       False
...
```
