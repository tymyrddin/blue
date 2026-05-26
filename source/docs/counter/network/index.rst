Traffic patterns as evidence
============================

Network visibility splits into two layers: what the wire says and what the logs record.
Flow data and packet captures reveal communication patterns that endpoint telemetry misses
entirely — beaconing intervals, DNS query shapes, TLS fingerprints, and east-west scanning
that never touches a host's application layer. The attack surface is the protocol stack;
the evidence lives in connection metadata.

.. toctree::
   :maxdepth: 1
   :includehidden:

   exposure.md
   detection.md
   runbooks/index
