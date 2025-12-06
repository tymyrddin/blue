DNSSEC: Better than nothing, but not a silver bullet
=====================================================

The Domain Name System (DNS) is the phonebook of the internet, except that, by default, it’s about as secure as a
phonebook written in pencil. If you are running one, consider DNSSEC (DNS Security Extensions), the cryptographic
armor that prevents attackers from scribbling fake entries.

DNSSEC is like seatbelts for DNS. It won’t stop all attacks, but it makes spoofing a lot harder. Combine it with
DoH/DoT for full security.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Go forth and make DNS spoofers cry!

   dnssec.md
   howto.md
