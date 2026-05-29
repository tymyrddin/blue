Holding the line on the host
============================

Containers promise isolation and deliver it only up to a point. A misconfigured one extends the
attack surface straight onto the host. The stack and failures pages explain how the confinement
controls fit together; the procedures here are for checking and keeping them right.

The review runbook is the one to run on a schedule: it walks the running containers for the
misconfigurations that reach the host and says what to act on. The step-by-step hardening
procedures, running as non-root, dropping capabilities, applying a seccomp or AppArmor profile, and
keeping secrets out of images, are still a gap rather than a finished set, and will be added here as
they are written.

.. toctree::
   :maxdepth: 1
   :caption: Assurance

   container-review
