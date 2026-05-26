Surviving the reboot
====================

Persistence is the attacker's way of saying "I was here, and I intend to stay." A foothold gained through a phishing
email or an unpatched service is fragile; persistence is the part that survives a reboot, a password reset, or even
a reimaged endpoint. It is, in short, the bit that turns a bad day into a bad quarter.

The good news is that persistence mechanisms leave marks. Registry keys, scheduled tasks, WMI subscriptions,
rogue service principals, web shells quietly humming away in a web root: all of them are durable artefacts waiting
to be found. The bad news is that a managed environment already contains thousands of legitimate ones, and the
malicious entry is designed to look like its neighbours.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:

   notes/index
   runbooks/index
