Holding the line on the host
============================

Containers promise isolation and deliver it only up to a point. A misconfigured one extends the
attack surface straight onto the host. The stack and failures pages explain how the confinement
controls fit together; the procedures here are for checking and keeping them right.

The hardening procedures build the confinement in layers: run as non-root, drop the capabilities the
container does not need, apply a seccomp or AppArmor profile beneath them, and keep secrets out of
the image. The review runbook is the one to run on a schedule, walking the running containers for
the misconfigurations that reach the host and saying what to act on.

.. toctree::
   :maxdepth: 1
   :caption: Hardening

   run-as-non-root
   drop-capabilities
   seccomp-apparmor
   image-secrets

.. toctree::
   :maxdepth: 1
   :caption: Assurance

   container-review
