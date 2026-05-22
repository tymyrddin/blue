# Job interview

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Job-interview): You are invited to an interview for a forensics investigator position at the NSA. For your first technical evaluation they ask you to analyse this file. Prove to them that you are a fitting candidate for this job.

SHA256 hash : `b35f4cd4bad19301e6970b30c1c713883b657858ef86d2b7247272c9d0f23591`


What?

```text                                                                                                                   
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/interview1]
└─$ ls
ch16.zip  image_forensic.e01

┌──(kali㉿kali)-[~/Downloads/root-me/forensic/interview1]
└─$ mkdir rawimage
                                                                                                                                  
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/interview1]
└─$ ewfmount image_forensic.e01 ./rawimage/
ewfmount 20140813
                                                                                                                                  
┌──(kali㉿kali)-[~/Downloads/root-me/forensic/interview1]
└─$ cd rawimage/
                                                                                                                                  
┌──(kali㉿kali)-[~/…/root-me/forensic/interview1/rawimage]
└─$ ls
ewf1
                                                                                                                                  
┌──(kali㉿kali)-[~/…/root-me/forensic/interview1/rawimage]
└─$ file ewf1
ewf1: POSIX tar archive (GNU)
```

Unpack:

```text
┌──(kali㉿kali)-[~/…/root-me/forensic/interview1/rawimage]
└─$ tar -xsf ewf1
```

There is a `bcache24.bmc` file, an RDP cached bitmap file. Copy and use bmc-tools to extract it:

```text
┌──(kali㉿kali)-[~/…/root-me/forensic/interview1/
└─$ mkdir bcache24bmc
```

```text
┌──(kali㉿kali)-[~/…/root-me/forensic/interview1/
└─$ ./bmc-tools.py -s bcache24.bmc -d bcache24bmc/ -v
```
