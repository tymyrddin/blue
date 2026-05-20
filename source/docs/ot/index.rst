OT and ICS security
====================================

.. image:: /_static/images/ot-company-location.png
   :alt: UUPL

A circuit breaker that opens on command is doing its job. One that opens because an attacker sent the
command is also doing its job. The two are indistinguishable until the lights go out. The systems
controlling power, heat, water, and industrial processes were engineered for the first. The second was not
in the requirements.

This section covers the gap: protocols designed without authentication, architecture built for availability
rather than defence, coding patterns for embedded systems where memory safety has physical consequences,
and ten incidents that document what the gap looks like when it is used.

.. toctree::
   :maxdepth: 1
   :caption: The gap between reliable and secure is where the work lives.

   coding/index
   architecture/index
   protocols/index
   incidents/index
   labs/index

.. toctree::
   :maxdepth: 1
   :caption: Boring but can be useful on occasion.

   mitre-attack-ics