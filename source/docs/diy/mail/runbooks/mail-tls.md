# Configure TLS for mail transport

Hardening runbook. Sets up TLS on Postfix so that mail in transit is encrypted: outbound where the far end supports it, and inbound on the authenticated submission ports. This protects message contents and, with [SASL](sasl.md), keeps login credentials off the clear network. Full TLS tuning is extensive; this covers the security-relevant configuration.

## When to run

When setting up a mail server that should accept or send mail over encrypted connections. Before or alongside [SASL authentication](sasl.md), which depends on TLS to protect credentials.

## What gets encrypted where

- Outbound (port 25 to other servers): opportunistic. Use TLS when the far end offers it.
- Inbound submission from users (port 587 STARTTLS, port 465 SMTPS): required. These carry credentials, so encryption is mandatory.

## Certificate

Postfix needs a certificate and an unencrypted private key in PEM format. A [Let's Encrypt](../../server/runbooks/lets-encrypt.md) certificate works and is trusted by clients; a self-signed certificate is rejected by clients unless each is configured to trust it. Point Postfix at the certificate in `/etc/postfix/main.cf`:

```
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.example.com/fullchain.pem
smtpd_tls_key_file  = /etc/letsencrypt/live/mail.example.com/privkey.pem
```

### Risk

The private key has to be readable by Postfix and unencrypted (so the service starts without a passphrase prompt). That makes its file permissions the protection: keep it readable only by root and the Postfix user, and out of loosely protected backups. A leaked mail key lets an attacker impersonate the server's TLS.

## Outbound: use TLS when available

```
smtp_tls_security_level = may
```

`may` is opportunistic: encrypt when the far end supports it, fall back to plaintext when it does not. This is the correct default for server-to-server mail, where forcing encryption would bounce mail to servers that do not offer it.

## Inbound: require TLS on submission

Offer AUTH only on encrypted connections, so credentials never cross in clear:

```
smtpd_tls_security_level = may
smtpd_tls_auth_only = yes
```

Then enable the encrypted submission services in `/etc/postfix/master.cf`. For STARTTLS on 587:

```
submission inet n - n - - smtpd
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject
```

For SMTPS on 465, the same with `-o smtpd_tls_wrappermode=yes`. `smtpd_tls_auth_only = yes` is the line that stops credentials being accepted over an unencrypted connection.

## Cipher and protocol hardening

Disable weak ciphers and prefer strong key exchange:

```
smtpd_tls_mandatory_ciphers = high
smtpd_tls_exclude_ciphers = aNULL, MD5, DES, 3DES, RC4, EXPORT, eNULL
smtpd_tls_eecdh_grade = strong
tls_preempt_cipherlist = yes
```

Leave the obsolete `smtpd_tls_mandatory_protocols = TLSv1` style settings off; current Postfix defaults to modern protocol versions.

## Verify

Reload and confirm the configuration parses:

```
sudo postfix check && sudo postfix reload
```

Confirm the submission port negotiates TLS and offers AUTH only after it:

```
openssl s_client -starttls smtp -connect mail.example.com:587 -quiet
```

A successful TLS handshake, with the correct certificate presented, confirms inbound TLS. For outbound, send to an external mailbox and check the received headers show TLS was used. An external tool (such as a mail-tester or checktls service) confirms the public-facing TLS configuration grade.

## Done

Submission ports (587/465) require TLS and offer AUTH only over it. Outbound uses TLS opportunistically. Weak ciphers excluded. Certificate valid and presented. The private key is readable only by root and Postfix.

## Rollback

Set `smtpd_tls_auth_only = no` to accept AUTH without encryption again (a fallback only, since it exposes credentials), or revert the changed `main.cf` / `master.cf` lines and reload. A certificate problem that stops Postfix starting is addressed by pointing back at the previous certificate path.

## Follow-up

- Open ports 587 and 465 in the [firewall](../../server/runbooks/ufw.md).
- TLS protects the channel; it does not authenticate the sender. Pair with [SPF](spf.md), [DKIM](dkim.md), and [DMARC](dmarc.md), and with [SASL](sasl.md) for user authentication.
- Renew the certificate before expiry; an expired mail certificate breaks TLS negotiation. See [Let's Encrypt](../../server/runbooks/lets-encrypt.md).
Last updated: 10 July 2026
