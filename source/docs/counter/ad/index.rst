The domain as an attack graph
=============================

Active Directory is the authentication and authorisation backbone of most enterprise
Windows environments. It is also a substantial attack surface in its own right. The
techniques here exploit the Kerberos protocol's design, the certificate authority
infrastructure built on AD CS, and the replication protocol that synchronises domain
controllers. The common thread is that they abuse trust mechanisms the domain was
built around, using credentials and protocol operations the environment considers
routine.

An attacker who reaches a domain user account, however unprivileged, gains access to
a range of operations Active Directory permits by design: requesting service tickets,
querying certificate templates, reading ACL edges that map a path to Domain Admins.
The exposure is structural, not incidental, and it predates the attacker's arrival.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:

   notes/index
   runbooks/index
