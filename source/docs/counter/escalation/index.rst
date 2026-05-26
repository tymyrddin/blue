The gap between access and authority
=====================================

Privilege escalation is the phase between initial foothold and the access level needed
to move laterally, establish persistence, or reach the target data. The techniques here
operate on two distinct surfaces: the integrity and token model on Windows, and the
capability and permission model on Linux. Container escape occupies a third lane,
where the escalation target is the host rather than a higher user identity.

What the techniques share is that they are almost always enabled by configuration rather
than vulnerability. An uncustomised service account with SeImpersonatePrivilege, a SUID
binary carrying SUID without a legitimate reason, a sudo rule added for convenience and never reviewed, a
container deployed with --privileged because the developer needed to debug something. The
preconditions tend to outlast the reasons they were created.

.. toctree::
   :maxdepth: 1
   :includehidden:

   linux-containers.md
   windows.md
   runbooks/index
