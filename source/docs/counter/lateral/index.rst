From target to target
===========================

An attacker rarely starts on a machine that holds valuable data. Initial access lands
somewhere: a user's laptop, a phishing-exposed web application, a compromised vendor
account. Lateral movement is closing that gap, crossing from the initial
foothold to domain controllers, backup infrastructure, financial systems, or wherever the
target data lives. The tools are mostly built-in or legitimately signed (LOL); the activity is
in authentication logs, not malware detections.

This phase is what connects persistence to collection. Attackers have a durable foothold but have not yet reached what
they came for. The distance between those two positions is the lateral movement problem, and is rarely a single hop.

.. toctree::
   :maxdepth: 1
   :includehidden:

   trends.md
   detection.md
   runbooks/index
