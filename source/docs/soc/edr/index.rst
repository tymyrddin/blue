Endpoint detection and response (EDR)
============================================================

In the chaotic world of Security Operations, EDR (Endpoint Detection and Response) is that hyper-vigilant K-9 unit
that sniffs everything—from suspicious PowerShell scripts to Dave’s 3 AM attempt to install "TotallyLegitFreeRAM.exe."
It doesn’t just bark at intruders; it chomps down on threats like a ravenous wolf, then proudly drops the mangled
remains at your feet ("Look! A zero-day! Can I have a treat now?").

Why EDR? Because while SIEM is busy reading the room, EDR is the one tackling the attacker mid-stride—or, occasionally,
face-planting into a false positive ("Alert: High severity! ... Just kidding, it’s Excel."). It’s the muscle to your
SIEM’s brains, the taser to your firewall’s stern lecture. Just don’t be surprised when it mistakes your CEO’s new
USB drive for a cyberweapon. ("Sir, why does your ‘presentation’ contain 17 nested ZIP files?")

EDR is no longer optional. It is a core pillar of cybersecurity and regulations mandate EDR.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Turning 'uh-oh' into 'aha!'

   macos/index
   linux/index
   windows/index

----

.. toctree::
   :maxdepth: 2
   :includehidden:
   :caption: Vulnerability scanners @GitHub

   Windows vulnerability scanner @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/vuln-discovery-windows>
   MacOS vulnerability scanner @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/vuln-discovery-macos>
   Linux vulnerability scanner @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/vuln-discovery-linux>
   Android vulnerability scanner @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/vuln-discovery-android>
   iOS vulnerability scanner @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/vuln-discovery-ios>

----

.. toctree::
   :maxdepth: 1
   :includehidden:
   :caption: EDR shell scripts @GitHub

   Windows EDR powershell script @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/cheatsheet-windows>
   MacOS EDR shell script @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/cheatsheet-macos>
   Linux EDR shell script @GitHub <https://github.com/tymyrddin/codes-edr/blob/main/cheatsheet-linux>

----

.. image:: /_static/images/in-progress.png
  :alt: Forever in progress ...
