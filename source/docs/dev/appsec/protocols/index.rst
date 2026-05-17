TLS/SSL hardening
===================================================================

TLS protects data in transit from interception and modification. A misconfigured deployment can undermine that
protection entirely: a deprecated protocol version, a weak cipher suite, or a missing certificate chain presents
an exploitable surface despite the encryption label. The pages here cover protocol selection, certificate
management, key exchange, known attack classes, and monitoring to detect drift.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Encrypted is not the same as correctly encrypted.

   tls-ssl.md
   certs.md
   forward.md
   vulns.md
   monitoring.md
   mtls.md
   pq.md