Bulletproofing self-hosted servers
================================================

Running your own container, web, and mail servers is empowering—until it becomes a liability. Small setups are prime
targets precisely because they often lack enterprise-grade defences. But with the right approach, you can build a
"poor man’s enterprise stack" that’s both functional and resilient.

Core Threats to Small On-Prem Systems

* Containers Gone Rogue → Unpatched images, exposed Docker sockets.
* Webserver Exploits → SQLi, brute force attacks, outdated PHP.
* Mailserver Abuse → Open relays, spoofed domains, spam blacklists.

.. toctree::
   :maxdepth: 2
   :caption: Enterprise security, minus the enterprise budget (and headaches)

   audits/index
   server/index
   webserver/index
   mailserver/index
