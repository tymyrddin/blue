OT protocol security
==================================

.. image:: /_static/images/ot-controls.png
   :alt: OT controls

Most OT protocols were designed in an era when the network carrying them was assumed to be physically isolated and
operationally controlled. Authentication was unnecessary because strangers could not reach the wire. Encryption was
unnecessary because the data was process telemetry, not state secrets. That assumption has eroded, and the protocols
have not changed as fast as the networks they run on.

The pages here cover the security properties each protocol was built with, the gaps that follow from those design
choices, and the compensating controls available when the protocol itself offers nothing.

.. toctree::
   :maxdepth: 1
   :caption: The protocol was designed for reliability. Security was someone else's problem.

   modbus
   dnp3
   opcua
   iec61850
   ethernetip
   profinet
   bacnet
   mqtt
   iec60870-5-104
   opcda
   iccp
   hart-ip
   iec62351
