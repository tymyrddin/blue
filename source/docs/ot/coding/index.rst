Secure coding for OT
==================================

.. image:: /_static/images/compilation.png
   :alt: Compilation

C and C++ give direct access to memory and hardware. That access is the point: a PLC control loop cannot afford the
overhead of a managed runtime. The tradeoff is that the programmer is responsible for every byte boundary, every
integer range, every resource lifecycle. The vulnerabilities that follow from that tradeoff are well-documented and
largely preventable through consistent application of a small set of patterns.

.. toctree::
   :maxdepth: 2
   :caption: The vulnerabilities are old. The environments are not getting simpler.

   memory
   assembly
   hardening
   parsing
   cpp-embedded
