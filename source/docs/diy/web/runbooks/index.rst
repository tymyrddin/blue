Minding the shopfront
=====================

A web server is the part of the infrastructure most exposed to view, and the part most often
probed. The stack and failures pages cover how the browser-facing controls fit together; these are
the procedures to put them in place and confirm they hold.

They start with the information a server gives away for free, move through the security headers that
tell the browser what to enforce, add the protective modules that filter bad requests, and end with
the logging and the header check that confirm the rest actually took effect.

.. toctree::
   :maxdepth: 1
   :caption: Information exposure

   hide-info
   directory-listing

.. toctree::
   :maxdepth: 1
   :caption: Security headers

   hsts
   csp
   xframe
   cookie
   cors

.. toctree::
   :maxdepth: 1
   :caption: Protective modules

   mod_security
   mod_evasive

.. toctree::
   :maxdepth: 1
   :caption: Logging and verification

   logging
   check
