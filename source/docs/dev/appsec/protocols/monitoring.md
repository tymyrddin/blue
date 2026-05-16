# Monitoring and validation

A TLS configuration that passes a review on Tuesday can drift by Friday: a library update changes defaults, a
new certificate is deployed with a shorter chain, a wildcard certificate expires without automated renewal. The
configuration is not a one-time decision; it is a state that requires continuous verification.

## testssl.sh

[testssl.sh](https://testssl.sh/) is the most complete open-source tool for auditing a TLS endpoint. It tests
protocol versions, cipher suite support, known vulnerabilities (POODLE, BEAST, CRIME, ROBOT, and others),
certificate chain completeness, HSTS, OCSP stapling, and forward secrecy; findings are reported with severity
levels.

A useful invocation for automated auditing:

```bash
testssl.sh \
  --severity HIGH \
  --warnings batch \
  --color 0 \
  --logfile /var/log/tls-audit/$(date +%F)-result.txt \
  example.com:443
```

`--severity HIGH` reports only findings rated HIGH or above (reducing noise while surfacing actionable issues).
`--warnings batch` suppresses interactive prompts. `--color 0` disables ANSI colour codes for log file
readability. The logfile path includes the date for tracking changes over time.

Running testssl.sh as part of a deployment pipeline, after certificate rotation or configuration changes,
catches regressions before they reach production.

## SSL Labs API

Qualys SSL Labs provides an independent assessment of TLS configuration and assigns a grade. The API allows
automated querying without the browser interface:

```bash
# Start analysis (use startNew=on to force a fresh assessment)
curl "https://api.ssllabs.com/api/v3/analyze?host=example.com&startNew=on" > /dev/null

# Poll until status is READY (typically 60–90 seconds)
while true; do
  STATUS=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=example.com" \
    | jq -r '.status')
  [ "$STATUS" = "READY" ] && break
  sleep 10
done

# Extract grade
curl -s "https://api.ssllabs.com/api/v3/analyze?host=example.com" \
  | jq -r '.endpoints[0].grade'
```

A CI check that fails when the grade drops below A catches configuration changes that weaken the TLS posture
before they persist.

## Certificate expiry monitoring

An expired certificate is an unscheduled outage. Automated renewal (ACME via certbot or acme.sh) removes the
primary risk, but monitoring expiry independently catches certificates that fall outside the automation scope:
certificates managed by a CDN, certificates for internal services, or certificates renewed manually.

Prometheus with `x509-certificate-exporter` scrapes expiry dates from certificate files on disk and from live
TLS endpoints, exposing them as metrics. An alert rule fires when expiry is within 30 days:

```yaml
alert: CertificateExpiringSoon
expr: x509_cert_expiry - time() < 86400 * 30
for: 1h
labels:
  severity: warning
annotations:
  summary: "Certificate expires in less than 30 days"
```

A simpler approach for smaller deployments:

```bash
# Check expiry of a live endpoint
openssl s_client -connect example.com:443 -servername example.com \
  </dev/null 2>/dev/null \
  | openssl x509 -noout -enddate
```

Wrapping this in a cron job that alerts when the date is within 14 days provides a backup for anything not
covered by the primary automation.

## CT log monitoring

Certificate Transparency logs record every certificate issued by publicly trusted CAs. Monitoring CT logs for
new certificates on owned domains detects unauthorised issuance: a shadow certificate that an attacker persuaded
a CA to issue will appear in the logs within hours of issuance.

The crt.sh API returns all known certificates for a domain pattern:

```bash
curl -s "https://crt.sh/?q=%.example.com&output=json" \
  | jq -r '.[].name_value' \
  | sort -u
```

Running this regularly and diffing against the known certificate inventory surfaces unexpected entries. Tools
like [Certspotter](https://github.com/SSLMate/certspotter) automate continuous monitoring and deliver alerts
when new certificates appear.

## SIEM events worth alerting on

TLS handshake failures carry alert codes that are informative when aggregated. Events worth surfacing:

- `unknown_ca` (alert code 48): the client rejected the server certificate because the CA is not trusted. In a
  production environment receiving legitimate traffic, this is rare. A spike suggests a certificate deployment
  error or a misconfigured client, but also warrants checking whether a certificate was replaced with one from
  an unexpected CA.
- `certificate_expired` (alert code 45): the client rejected an expired certificate. In an automated renewal
  environment, this count is zero; any occurrence warrants investigation.
- Protocol version below the configured minimum: if TLS 1.0 and 1.1 are disabled but connections using those
  versions appear in logs, something in the network path is rewriting the negotiation. In a correctly configured
  deployment, this count is zero.
- Cipher suites not in the configured list appearing in negotiated connections: similarly, unexpected cipher
  suite use can indicate a load balancer or proxy with a different TLS configuration intercepting traffic.
