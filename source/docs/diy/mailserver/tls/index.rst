Securing email transport: TLS, DANE & MTA-STS
================================================

Email might feel like digital magic, but without proper encryption, it’s more like a postcard, readable by anyone who
intercepts it. Transport Layer Security (TLS) fixes this by scrambling messages in transit, but there’s a catch:
not all TLS is created equal.

Without these protections, your emails are at risk of:

* Eavesdropping (via unencrypted connections)
* Spoofing (fake servers pretending to be yours)
* Tampering (modified content in transit)

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Mail servers

   overview.md
   tls.md
   dane.md
   mta-sts.md
