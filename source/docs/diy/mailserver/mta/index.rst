Securing Postfix: MTA & SASL authentication essentials
=========================================================

A Message Transfer Agent (MTA) like Postfix is the postal service of your email system, it routes messages in and out.
But without SASL (Simple Authentication and Security Layer), it’s like leaving your post office door wide open for
anyone to abuse.

* Postfix (MTA) – Handles mail delivery, queues, and routing.
* SASL – Verifies users before allowing mail relay (stopping unauthorised senders).

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Postfix routes your emails, SASL guards the gate

   postfix.md
   sasl.md
