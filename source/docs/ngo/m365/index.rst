Microsoft 365 security
========================

.. image:: /_static/images/ngo-m365.png
   :alt: A Teams meeting in progress on a screen in an otherwise empty open-plan office. Someone has shared their entire desktop including a spreadsheet labelled confidential donors 2024 final FINAL v3.

M365 is probably the operational core of the organisation. Email, documents, collaboration,
video calls, scheduling. It is also the most common target for phishing, business email
compromise, and account takeover in the non-profit sector.

The default configuration of a Microsoft 365 tenant that has been running for several years
without a dedicated security architect is not secure by modern standards. That is not a
criticism of whoever set it up. Defaults change. Guidance evolves. What was fine in 2019
is not fine now.

This section covers the M365-specific configuration work that follows from the identity
foundation: securing Exchange, SharePoint, and Teams; understanding what Defender features
you have and which are actually switched on; and getting visibility into what is happening
in the tenant.

.. toctree::
   :maxdepth: 1
   :caption: Most of the work is in the configuration, not the tooling.

   exchange.md
   sharepoint.md
   teams.md
   defender.md
   secure-score.md
