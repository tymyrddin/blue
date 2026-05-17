Runtime hardening and exposure reduction
===================================================================

In application security, lockdown refers to the systematic hardening of an application's environment,
configurations, and runtime to minimise attack surfaces. It combines preventive controls (least privilege,
input validation) with detective measures (logging, anomaly detection) to enforce strict operational
boundaries.

Lockdown limits the damage from vulnerabilities, including zero-days and misconfigurations. It supports
alignment with standards like NIST 800-53, PCI DSS, and OWASP ASVS. Containment during a breach depends
on these same controls: lateral movement is stopped at whatever boundaries exist, which makes the existence
and correctness of those boundaries the critical question.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: A misconfigured environment is not a small oversight. It is the attack surface.

   *
