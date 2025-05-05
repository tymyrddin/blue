# Monitoring & validation

## Best Practices:

* Regular Scans – Use [testssl.sh](https://testssl.sh/), [SSL Labs (Qualys)](https://www.ssllabs.com/ssltest/), or [OWASP ZAP](https://www.zaproxy.org/) to audit configurations.
* Revocation Checks – Ensure OCSP/CRL checks are functioning.
* SIEM Alerts – Monitor for expired certs, untrusted CAs, or unexpected protocol use.

Example (Test Command):

```bash
testssl.sh -p example.com  # Check protocols/ciphers
```