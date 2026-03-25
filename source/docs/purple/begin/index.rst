In the beginning ...
=====================================

.. image:: /_static/images/fox.png
   :alt: A fox at the treeline, one paw raised, reading every gap in the fence at once. A phishing hook dangles from a branch above. A door stands open, held by a paper coffee cup. At the base of the wall, a burrow, unpatched and wide enough. The falcon is already circling. The prey has not looked up yet.

The attacker starts somewhere. It might be an API endpoint with overly generous permissions, a web application that
trusts input it really shouldn't, a misconfigured cloud storage bucket, an endpoint with an unpatched kernel, a flat
network that forgot segmentation existed, an OT controller accessible from the IT side, or a human who received a
very convincing email at 16:00 on a Friday. This section covers defensive controls and detection for each of these
initial access vectors — because the kill chain has to start somewhere, and the goal is to make "somewhere" as
inhospitable as possible.

.. toctree::
   :maxdepth: 2

   api/index
   app/index
   cloud/index
   endpoint/index
   network/index
   ot/index
   human/index

.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">Report a Suspicious Dwarf</a>
            </div>
        </div>
