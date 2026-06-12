Operational cost of security controls
=====================================

Security documentation describes what controls do. It rarely describes what they cost to run.
A control that works when deployed correctly and produces zero operational friction does not exist.
Every control involves a tradeoff between the protection it provides and the overhead it creates,
and practitioners navigate that tradeoff constantly.

Vendors do not document this. The framing in most product documentation assumes deployment is
straightforward and operational friction is negligible. It is not. The pages below name places where
the gap between stated benefit and deployed reality is large enough to affect deployment decisions.

.. toctree::
   :maxdepth: 1

   mfa-fatigue.md
   detection-false-positives.md
   hvci-overhead.md
   application-control-creep.md
   casb-dlp-latency.md
   patch-maintenance-windows.md
   network-segmentation.md
   least-privilege.md
   log-volume.md
   backup-restore-testing.md
   runbooks/index

The honest framing across these categories: the controls are worth deploying. The friction is worth
naming, because practitioners who understand it can plan for it, resource it, and make informed
decisions about where to accept a tradeoff. Practitioners who are not told about it encounter it as
failure rather than as an expected property of the environment.

.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">More moves?</a>
            </div>
        </div>
