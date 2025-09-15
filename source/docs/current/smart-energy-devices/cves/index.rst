Learning from existing CVE's
=========================================================

Studying published CVEs and short case studies to learn how to validate a PoC quickly and safely — **not to craft
exploits**. The goal is speed and certainty: identify the minimal conditions that must exist for a report to be true,
reproduce those conditions in an isolated lab, gather deterministic evidence (PCAPs, logs, firmware images,
screenshots) and decide whether the finding is reproducible, patch-worthy, or out of scope.

.. toctree::
   :maxdepth: 1
   :caption: Use case studies to build checklists, test matrices and short recipes that make validating or debunking reports without reimplementing attackers’ tools or publishing exploit code.

   cves-inter-utility-exchanges.md
   cves-utility-grid-control.md
   cves-field-edge-devices.md
   cves-consumer-home.md