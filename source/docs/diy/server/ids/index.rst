Continuous host monitoring and threat detection
==================================================

A host-based intrusion detection system (HIDS) is a system that monitors a host on which it is installed to detect
an intrusion and/or misuse, and responds by logging the activity and notifying the system administrators.

* Install HIDS right after installing the system.
* Tripwire creates a database of information related to your system, then compares that to what it finds when ran regularly, which it should, in order to get some real use out of it.
* Rkhunter is a Unix-based tool that scans for rootkits, backdoors and possible local exploits.
* Samhain provides file integrity checking, log file monitoring/analysis, rootkit detection, port monitoring, detection of rogue SUID executables, and hidden processes. Like having tripwire and rkhunter rolled into one. <=

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Defend against a live attack

   samhain.md
   maltrail.md
