Honeyports
=============================================================

Honeyports are the simpler cousin of honeypots: a listening port on a service that should not exist,
set up to detect whoever probes it. The equivalent of leaving a "Do Not Touch" button in plain sight
on a network that has no legitimate reason to have that port open, then watching who cannot resist.

They are particularly useful when signature-based detection has gaps, or when zero-days are bypassing
the defensive stack. Anything that connects to a honeyport has no legitimate reason to be there.

.. toctree::
   :maxdepth: 1
   :caption: The only open port that leads to disappointment.

   honeyports.md
   python-honeyport.md
   powershell-honeyport.md
