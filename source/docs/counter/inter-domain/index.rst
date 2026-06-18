Inter-domain routing as a target
================================

Inter-domain routing trusts announcements by default. A network states which prefixes it holds and which paths
it has heard, and neighbours accept that mostly on habit and contract rather than proof. The defensive job
splits the usual way: shrink the room an attacker needs before anything is announced, and read the public
control plane closely enough to catch the announcement when it comes. A third part stands behind both, holding
posture against a campaign measured in years rather than packets, where the answer is to deny the preconditions
rather than to catch the act.

The attacker's-side reconnaissance, target selection, relationship inference, coverage survey, baselining, is
documented in the red notes on `casing the clacks <https://red.tymyrddin.dev/docs/scarlet/reconnaissance/>`_.
A brief origin-validation control already lives in the network notes on
`reducing network attack surface <../network/exposure.md>`_; the pages here are the fuller, routing-specific
treatment.

.. toctree::
   :maxdepth: 1
   :includehidden:

   exposure.md
   detection.md
   posture.md


.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">Hold the line</a>
            </div>
        </div>
