Detection engineering
======================================================

Detection engineering is the practice of designing, building, and testing rules that identify malicious or anomalous
behaviour in your environment. With the Red Lantern simulator, you can develop and validate detection logic against
known attack patterns without needing live traffic or risking production systems.

The Department of Silent Stability has learned (sometimes the hard way) that good detection rules are:

- Precise enough to catch real attacks
- Resilient enough to survive background noise
- Documented well enough that someone else can understand them at 3:00.
- Tested thoroughly before they wake up the entire response team


.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: The unreal embassy & live-fire drills

   generic.md
   decoders.md
   wazuh.md
   testing.md
   integrations.md
   other-siems.md

.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact">Check the Barrel's Bottom</a>
            </div>
        </div>