Keeping mail trusted
====================

Running a mail server is mostly a matter of being trusted: by the servers receiving the mail, who
decide whether it lands in the inbox or the spam folder, and by the rest of the internet, which
will blocklist a server that misbehaves. The stack and the relay-exposure pages explain the
mechanisms; these are the procedures to set them up and keep them right.

They build in dependency order. The server itself comes first, with the relay closed and transport
encrypted, then the authenticated path for users, then the three DNS records that let other servers
verify the domain's mail, and finally spam filtering for what comes in.

.. toctree::
   :maxdepth: 1
   :caption: Server and transport

   postfix
   mail-tls
   sasl

.. toctree::
   :maxdepth: 1
   :caption: Sender authentication

   spf
   dkim
   dmarc

.. toctree::
   :maxdepth: 1
   :caption: Spam filtering

   rspamd
