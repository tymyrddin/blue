Watching data being gathered
================================

Before anything leaves the network, it has to be collected. Attackers enumerate
filesystems, scrape credentials from memory, archive mailboxes, and stage data in
a location they control before attempting to move it out. Collection is often the
quietest phase: it involves legitimate-looking file operations, standard archive
utilities, and tools already present on the system. Detecting it requires watching
for the shape of the activity rather than the tools themselves.

.. toctree::
   :maxdepth: 1
   :includehidden:

   trends.md
   detection.md
   ueba-tuning.md
   runbooks/index


.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">Break the quiet</a>
            </div>
        </div>
