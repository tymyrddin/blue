# Manually specify cipher suite

To secure the transfer of data, TLS/SSL uses one or more cipher suites. A cipher suite is a combination of authentication, encryption, and message authentication code (MAC) algorithms. They are used during the negotiation of security settings for a TLS/SSL connection and the transfer of data.

Depending on context, the need to support legacy browsers and regulatory requirements, you can choose [different cipher suite configurations](https://ssl-config.mozilla.org/) (modern, intermediate, or old).

**TLS 1.3 does not require manually specifying cipher suites.**

