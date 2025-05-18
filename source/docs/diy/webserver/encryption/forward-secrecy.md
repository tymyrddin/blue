# Configure forward secrecy

Perfect Forward Secrecy (PFS) is a style of encryption that enables short-term, private key exchanges between clients and servers. PFS can be found within transport layer security (SSL/TLS) and prevents adversaries from decrypting data from other sessions, past or future, even if the private keys used in an individual session are stolen at some point.

It does this by using unique session keys, generated automatically each time a connection is made. The keys do not use prior knowledge when they are generated, eliminating the need for long-term storage of keys and preventing sensitive data from being accessed using existing ones that have been compromised.

This makes it much harder for attackers to obtain the session key through decryption.

PFS is supported by all major internet browsers. 

* [How to Configure Nginx for Forward Secrecy](https://www.digicert.com/kb/ssl-support/ssl-enabling-perfect-forward-secrecy.htm#nginx_forward_secrecy)
* [How to Configure Apache for Forward Secrecy](https://www.digicert.com/kb/ssl-support/ssl-enabling-perfect-forward-secrecy.htm#apache_forward_secrecy)
