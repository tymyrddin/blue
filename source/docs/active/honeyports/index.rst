Honeyports
=============================================================

Honeyports are the simpler cousin of honeypots: a listening port with no legitimate purpose,
set up to detect whoever probes it. Any connection is a signal; there is no legitimate traffic
to filter out. They are particularly useful when signature-based detection has gaps, or when
zero-days are bypassing the defensive stack.

.. toctree::
   :maxdepth: 1
   :caption: Any connection to a port that serves nothing is worth recording.

   honeyports.md
   python-honeyport.md
   powershell-honeyport.md
