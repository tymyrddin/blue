# Command & Control level 6

[root-me challenge](https://www.root-me.org/en/Challenges/Forensic/Command-Control-level-6): Berthier, before blocking any of the malware’s traffic on our firewalls, we need to make sure we found all its C&C. This will let us know if there are other infected hosts on our network and be certain we’ve locked the attackers out. That’s it Berthier, we’re almost there, reverse this malware!

The validation password is a fully qualified domain name : `hote.domaine.tld`. The uncompressed memory dump md5 hash is `e3a902d4d44e0f7bd9cb29865e0a15de`. NB : This challenge requires the clearance of [level 3](c&c3.md).

----

Run the malware in a Windows VM and make an analysis of the traffic queries with WireShark. Or run it in an online sandbox.
Or, analyse it with IDA or Ghidra.

