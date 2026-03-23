Persistence notes
=================

Persistence mechanisms are, by definition, written to survive. That means they
leave durable artefacts: registry entries, scheduled tasks, WMI subscriptions,
cloud IAM entities, application backdoors. Unlike a transient exploit payload
that lives only in memory for seconds, a persistence mechanism exists until
someone removes it. This gives defenders time, sometimes significant time,
to find it.

The challenge is volume. A managed Windows endpoint has dozens of scheduled
tasks, hundreds of services, and thousands of registry autorun keys. A cloud
environment has hundreds of IAM entities. Finding the one malicious entry
requires either a signature match (name, hash, behaviour) or an anomaly in a
baseline.

.. toctree::
   :maxdepth: 1
   :includehidden:

   trends.md
   checklist.md
