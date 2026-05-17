Security testing
===================================================================

Security testing finds what code review and functional testing leave undetected, largely because neither starts
from the assumption of an adversarial user. The disciplines here span the full development lifecycle:
design-stage threat modelling, static and dynamic analysis during development, scanning and penetration
testing before production, and continuous monitoring once the application is live. No single technique
catches everything; the coverage gaps between them are where the interesting failures tend to sit.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Security gaps do not announce themselves. Finding them first requires looking deliberately.

   overview.md
   *