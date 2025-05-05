Windows EDR techniques
=======================

Welcome to Windows EDR—the digital equivalent of a paranoid bouncer at a nightclub. It side-eyes every script, interrogates each DLL like it’s smuggling contraband, and treats regsvr32.exe as if it’s a known felon (because let’s be honest, it often is).

* Techniques it loves: Memory scraping for malware masquerading as "legit" system processes (looking at you, ``svchost.exe`` #4729).
* False positives: When it flags your IT admin’s custom script as "APT-grade tradecraft" (spoiler: it’s just a batch file to reboot printers).
* Real-world translation: "Why is ``NotMalware.exe`` trying to disable my EDR? Hmm. SUSPICIOUS."


.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Bottom line: Windows EDR doesn’t trust anyone—especially not you.

   README.md
   process.md
   memory.md
   asr.md
   network.md
   logging.md
   response.md
