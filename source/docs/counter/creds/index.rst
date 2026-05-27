Harvesting stored secrets
=========================

Credential access sits between initial access and lateral movement. Once an attacker holds
valid credentials, further movement becomes authentication rather than exploitation: fewer
alerts, less noise, harder to distinguish from legitimate use.

The detection surface here differs from most other phases. Credential theft often produces
no network traffic and no file writes visible to endpoint scanners. The tells are in event
logs: process access to LSASS, handle requests on protected registry hives, shadow copy
creation followed by a file copy of NTDS.dit. Authentication abuse leaves a different
pattern: failure events spread across many accounts rather than concentrating on one, at
intervals that reflect tool pacing rather than human login behaviour.

Kerberoasting and DCSync are covered in lateral/ and ad/ respectively. Both require an
existing authenticated foothold and are tightly coupled to the Kerberos and replication
detection logic in those sections.

.. toctree::
   :maxdepth: 1
   :includehidden:

   dumping.md
   spraying.md
   runbooks/index


.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">Share a secret</a>
            </div>
        </div>
