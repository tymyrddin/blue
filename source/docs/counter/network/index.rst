Traffic patterns as evidence
============================

Network visibility splits into two layers: what the wire says and what the logs record.
Flow data and packet captures reveal communication patterns that endpoint telemetry misses
entirely: beaconing intervals, DNS query shapes, TLS fingerprints, and east-west scanning
that never touches a host's application layer. The attack surface is the protocol stack;
the evidence lives in connection metadata.

.. toctree::
   :maxdepth: 1
   :includehidden:

   exposure.md
   detection.md
   correlation.md
   runbooks/index


.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">Leave a trace</a>
            </div>
        </div>
