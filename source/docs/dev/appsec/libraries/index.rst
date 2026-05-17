Library and dependency security
===================================================================

Modern applications depend on far more third-party code than first-party code. The ratio for a typical
Node.js or Python application often exceeds 10:1 when transitive dependencies are counted. Each dependency
is a potential attack vector: a vulnerability in a library, a compromised package publish, or a malicious
typosquatted name can affect every application that pulls it in. The pages here cover the main ecosystems
and the controls available in each.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: The application's attack surface includes every package it imports.

   overview.md
   npm.md
   js-frameworks.md
   pypi.md
   python-frameworks.md