Battening the hatches
=====================

The stack and failures pages explain how a server's defences fit together and what gives way when
one is missing. These are the procedures: the steps to put a control in place, confirm it is
working, or work out what happened when something went wrong.

They run roughly in the order a server's life does. Locking down access and the network comes
first, since it closes the most exposure for the least effort. Certificates and routine monitoring
follow. The investigation and recovery procedures sit at the end, for the day they are needed.
Each one is written to be followed start to finish by whoever is on hand, security background or not.

.. toctree::
   :maxdepth: 1
   :caption: Access and authentication

   disable-root
   harden-ssh
   key-management
   sudo
   passwords

.. toctree::
   :maxdepth: 1
   :caption: Network and firewall

   ufw
   iptables
   fail2ban

.. toctree::
   :maxdepth: 1
   :caption: Certificates

   tls-ssl
   lets-encrypt

.. toctree::
   :maxdepth: 1
   :caption: Monitoring and hygiene

   systemctl
   centralised-logging
   samhain
   nmap
   log-commands

.. toctree::
   :maxdepth: 1
   :caption: Investigation and recovery

   ssh-auth-error
   intruder-path
   brm
