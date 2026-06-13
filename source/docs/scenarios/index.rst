Campaigns, manoeuvres and scenarios
==========================================

.. image:: /_static/images/discworld-map.png
   :alt: Map of discworld

Transition from a slow-burning fantasy crisis (like a Golem outage) into modern, technical blue-team incident
response and serious countermoves.

.. toctree::
   :maxdepth: 1

   clacks-routing-attack.md
   golem-free-will-injection.md
   poisoned-survey-data.md
   golem-trust-outage.md
   golem-trust-denial.md
   power-telemetry-falsification.md
   power-generator-resonance.md
   supply-chokepoints.md
   compliance-lockdown.md
   continuity-exfiltration.md
   ngo-feed-intercept.md

A second set shares one premise. Fungolia is the closest ally and the most watched: the city's secrets
sit mirrored on its network by treaty, so a state that owns the ally's wire owns the access the city
granted. The city is never the target, only exposed, and it learns of each attack by watching its own
border. The four here read as the defender's side of the exercises run by
`MycoSec <https://red.tymyrddin.dev/docs/earthworks/mycosec/>`_, the Fungolian red-team consultancy
whose deliberately exposed labs make the ground for them.

.. toctree::
   :maxdepth: 1

   ipv6-autoconfig-takeover.md
   dhcp-route-poisoning.md
   ai-autonomous-intrusion.md
   broken-trust.md

A third pair needs no tap at all. `FungusFiber Internet <https://red.tymyrddin.dev/docs/earthworks/fungusfiber/>`_ is Fungolia's regional registry, the firm whose
core routers announce which way the frontier's traffic goes, and routing is a public commons: a route
hijacked there is announced to the whole internet, the city's registry included. The Establishment runs
its own registry and reads the same global table everyone reads, so it sees a bad origin the
moment it propagates, no covert access required. The exposure is the city's own, its traffic to and
through the frontier rides those routes, and whoever owns the ally's registry owns the path the packets
take.

.. toctree::
   :maxdepth: 1

   bgp-route-hijack.md
   ai-bgp-hijack.md

Two more come from inside Fungolia, from the Ministry of Digital Affairs' own files. Here the breached
party and the body reconstructing the breach are both Fungolian: `FMDA <https://red.tymyrddin.dev/docs/earthworks/fmda/>`_, the ministry that allocates the
country's spectrum and registries and schedules its emergency committees, investigates attacks on its
sister ministries and writes down every step the adversary took. The alliance reads along because the
material in those ministries is not Fungolia's alone, a foreign ministry holds the arrangement's
negotiating positions, an energy department holds infrastructure half the Circle Sea leans on, and a
breach in Fungolia's underground bureaucracy is one the city has a stake in too.

.. toctree::
   :maxdepth: 1

   cloud-identity-exfil.md
   wiper-diversion.md

.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">More unserious seriousness, on the house</a>
            </div>
        </div>
