Systems that were never meant to be networked
=============================================

OT environments were designed around availability and physical process continuity, not confidentiality.
The security model that came later is mostly borrowed from IT, and it fits poorly. Protocols lack
authentication. Devices cannot be patched without production downtime. The historian at the IT/OT
boundary is often the only place where the two networks touch, which makes it the natural pivot
point for an attacker who has crossed from one side to the other. Or worse.

Detection spans three layers that rarely share data: IT security monitoring, OT network monitoring,
and process monitoring. An anomaly visible in one layer often has no corresponding signal in the
others. The physical consequence model also differs: a misconfigured firewall rule is recoverable;
a PLC that delivers the wrong setpoint to an industrial process may not be.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Controls and detection:

   exposure.md
   detection.md
   runbooks/index
