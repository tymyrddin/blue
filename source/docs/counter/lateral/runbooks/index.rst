Lateral movement hunting
========================

Runbooks for hunting authentication-based movement across the network: pass-the-hash,
pass-the-ticket, remote service creation, WMI and PowerShell remoting, and credential
forwarding via RDP.

Each hunt produces one of three outcomes:

- Nothing found: document the data sources used, the time range, and the analysis method.
  This establishes that the environment was clean on this date.
- False positive: document the legitimate activity that generated the indicator, and add a
  suppression to avoid repeating the investigation.
- True positive: escalate to incident response. Document the indicator chain, timeline,
  and scope. If the hunt found activity that an alert rule would have caught, write the rule.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:

   *
