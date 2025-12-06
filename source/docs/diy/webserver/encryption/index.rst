TLS/SSL protocol security
===================================

Outdated TLS versions (TLS 1.0 & 1.1) are digital Swiss cheese:full of holes attackers can waltz right through.

These creaky old protocols are riddled with known exploits (POODLE, BEAST, CRIME, and more, cybersecurity’s greatest
hits of "how did this ever ship?"). Modern browsers have rightfully euthanized support for them, if your web servers
still allow these fossils, you're essentially rolling out a red carpet for attackers.


.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Mandate TLS 1.2 (minimum) or, better yet, TLS 1.3 everywhere.

   tls.md
   cipher.md
   forward-secrecy.md
