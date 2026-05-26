Plausibility as cover
=====================

The attacker's goal is plausibility. The defender's challenge is deciding whether
something boringly normal is actually hostile.

Evasion is not a single technique. It is a property that different techniques acquire
when they are used against a specific detection environment. A living-off-the-land
binary is evasive because it is signed and expected. A long-dwell implant is evasive
because nothing trips an alert until it moves. A fileless payload is evasive because
there is no file to find. What connects them is that the attacker has made a deliberate
choice about what the defender's tooling will and will not see.

The countermeasures follow the same logic. Behavioural baselines catch LOLbins because
the binary is legitimate but the behaviour is not. Network analysis catches C2 because
the protocol is unremarkable but the pattern is not. Deception technology catches
long-dwell implants because the environment eventually changes and the implant does not
know what has been added. The attacker's advantage is knowing what generates alerts;
the defender's advantage is that the attacker cannot know everything that has changed.

.. toctree::
   :maxdepth: 1
   :includehidden:

   trends.md
   behavioural-detection.md
   deception.md
   network-analysis.md
   c2-signatures.md
   hardening.md
   serverless.md
   containers.md
   long-window.md
   matrix.md
   runbooks/index
