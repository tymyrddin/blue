Who holds the keys
==================

Most of what goes wrong for a small organisation is not a clever attack. It is an access that
nobody remembered: a key never revoked, a secret left in a repository, an account that outlived its
owner. These procedures are the quiet work that keeps that from accumulating.

They follow the arc of a person's relationship with the systems: joining, with the accounts and
multi-factor setup done properly from the start; the day-to-day handling of secrets and access
while they are around; and the leaving, plus the review for when an access turns up that should not
exist.

.. toctree::
   :maxdepth: 1
   :caption: Joining

   security-onboarding
   mfa-rollout

.. toctree::
   :maxdepth: 1
   :caption: Day to day

   secret-rotation
   cicd-credentials
   saas-access-review
   third-party-access

.. toctree::
   :maxdepth: 1
   :caption: Leaving and review

   offboarding
   oauth-review
