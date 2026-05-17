Securing web applications
============================================

Web applications combine authentication, authorisation, session management, database access, and file handling
into a single interface. Each of those components has recognisable failure modes, and most real-world
vulnerabilities are variations on a small set of patterns. The pages here address those patterns at the code
level: what produces the vulnerability, and what prevents it.

.. toctree::
   :maxdepth: 2
   :caption: Most vulnerabilities are recognisable patterns. The work is applying the controls consistently.

   lockdown/index
   coding/index
   libraries/index
   protocols/index
   databases/index
   api/index
   testing/index
