Smart devices and IoT
===================================================================

Connected appliances, cameras, voice assistants, and smart TVs have expanded the home attack surface
considerably. Many ship with default credentials, limited update cycles, and network access that is
broader than the device's actual function requires.

The concern is less often the individual device being directly compromised and more the lateral movement
risk: a vulnerable IoT device on the same network as a computer or phone is a potential stepping stone.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Containing the devices is simpler than securing them individually.

   critical.md
   ../network/vlan.md
   iot.md
   pi-hole.md


