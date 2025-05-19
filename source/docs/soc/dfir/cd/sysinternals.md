# Sysinternals

## Scenario

[Cyber Defenders Sysinternals challenge](https://cyberdefenders.org/blueteam-ctf-challenges/100): A user thought they were downloading the SysInternals tool suite and attempted to open it, but the tools did not launch and became inaccessible. Since then, the user has observed that their system has gradually slowed down and become less responsive.

## Tools used

* [Eric Zimmerman's Tools](https://ericzimmerman.github.io/#!index.md)
* [VirusTotal](https://www.virustotal.com/gui/home/search)
* Autopsy

----

## Questions

Q1 What was the malicious executable file name that the user downloaded?

![Sysinternals Executable name](/_static/images/sysinternals-q1.png)

Q2 When was the last time the malicious executable file was modified? 12-hour format

![Sysinternals Modify time](/_static/images/sysinternals-q2.png)

Q3 What is the SHA1 hash value of the malware?

![Sysinternals Hash](/_static/images/sysinternals-q3.png)

Extract `/img_SysInternals.E01/Windows/appcompat/Programs/Amcache.hve`.

Then use Zimmerman's AmcacheParser:

    .\AmcacheParser.exe -f "F:\Tmp\Amcache.hve" --csv F:\Tmp

![Sysinternals Unassociated](/_static/images/sysinternals-q3b.png)

Q4 What is the malware's family?

[VirusTotal family labels](https://www.virustotal.com/gui/file/72e6d1728a546c2f3ee32c063ed09fa6ba8c46ac33b0dd2e354087c1ad26ef48/detection)

Q5 What is the first mapped domain's Fully Qualified Domain Name (FQDN)?

[VirusTotal FQDM most detected](https://www.virustotal.com/gui/file/72e6d1728a546c2f3ee32c063ed09fa6ba8c46ac33b0dd2e354087c1ad26ef48/relations)

Q6 The mapped domain is linked to an IP address. What is that IP address?

![Sysinternals IP address](/_static/images/sysinternals-q6.png)

Q7 What is the name of the executable dropped by the first-stage executable?

![Sysinternals IP address](/_static/images/sysinternals-q7.png)

Q8 What is the name of the service installed by 2nd stage executable?

![Sysinternals IP address](/_static/images/sysinternals-q8.png)

Q9 What is the extension of files deleted by the 2nd stage executable?

Nasty, nasty question. Either run the sample in a sandbox, or search for the answer on the internet in analysis reports of the malware. pf.
