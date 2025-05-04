macOS EDR techniques
=======================

Mac EDR is like a yoga instructor who moonlights as a CIA operative. It’s sleek, expensive, and deeply concerned about your security hygiene ("You downloaded WHAT from the internet?").

* Techniques it loves: Side-eyeing unsigned apps, interrogating Gatekeeper like it’s hiding secrets, and treating bash history like a criminal confession.
* False positives: When it flags a developer’s homebrew install as "nation-state activity" (meanwhile, actual malware is vibing in a notarized ``.dmg``).
* Real-world translation: "Oh, you ‘accidentally’ disabled SIP? Let me just… re-enable that for you. For your own good."


.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Bottom line: Mac EDR is 50% security, 50% passive-aggressive wellness coach.

   README.md
   process.md
   memory.md
   behavioural.md
   network.md
