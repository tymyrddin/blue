Domain Keys Identified Mail (DKIM)
===================================

DKIM is a method for detecting forged sender addresses in emails, a common technique
used in phishing attacks.

It lets official mail servers add a signature to headers of outgoing email and identifies a domain’s public key so
other mail servers can verify the signature. As with SPF, DKIM helps keep mail from being considered spam.
It also lets mail servers detect when mail has been tampered with in transit.

Rspamd is an e-mail filter system, which replaces Amavis and Spamassassin. It also is capable of signing outbound
e-mails with DKIM keys. The status of Rspamd can be monitored via a simple web interface.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: These configuration notes might save you from pulling your hair out during setup.

   overview.md
   dkim.md
   rspamd.md
