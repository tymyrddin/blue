Preventing and handling API breaches
===================================================================

APIs are where authentication fails, authorisation is bypassed, and data leaves in a structured format.
The attack surface is broader than web applications: every endpoint, every parameter, and every HTTP method
is potentially reachable without a browser or UI friction. The pages here address the controls that need to
be in place at the API layer.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: An undocumented endpoint is not absent from the attack surface. It is absent from the test plan.

   monitor.md
   scan.md
   notrust.md
   tools.md
   authentication.md
   authorisation.md
   rate-limiting.md
   mass-assignment.md
   business-logic.md
   ai-surface.md
