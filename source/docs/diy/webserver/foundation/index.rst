Build a more secure foundation for web applications
=====================================================

* Remove all unnecessary web server modules. A lot of web servers by default come with several modules that introduce security risks.
* Modify default configuration settings.
* Install and run a web application firewall (WAF). Most web servers support the open-source ModSecurity firewall.
* If possible, either patch server software to the latest version automatically or turn on notifications for manual patching.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Foundation

   modules.md
   services.md
   file-system.md
   http-methods.md
   users.md
   mod_security.md
   mod_evasive.md
   logging.md

