The surface designed to be accessible
=====================================

Controls for reducing API attack surface and detecting when APIs are being enumerated or abused.
APIs are designed to be reachable, which makes the attack surface structural rather than
incidental: the same accessibility that serves legitimate clients serves automated recon
tools and credential-stuffing bots. Detection requires watching for the shape of abuse,
not just the presence of errors.

.. toctree::
   :maxdepth: 1
   :includehidden:

   exposure.md
   detection.md
   runbooks/index


.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">Send a request</a>
            </div>
        </div>
