# Set up SASL authentication

Hardening runbook. Adds SASL authentication to Postfix so that only authenticated users can send outbound mail through the server. This is what lets the relay stay closed to everyone except known users. It is the companion to [hardening Postfix](postfix.md).

## When to run

After Postfix is running and the [relay is closed](postfix.md). When remote users (a mail client on a laptop, off the local network) need to send mail through the server and there is no authenticated path for them yet.

## Why it is needed

A closed relay permits `mynetworks` and authenticated users. Without authentication, the only senders the server can trust are those on a trusted network, which leaves remote users with no way to send. SASL gives those users an authenticated path, so the relay can stay shut to everyone else.

## Choosing the backend

Two common options:

- Dovecot SASL: the simpler choice if Dovecot already runs as the IMAP/POP server and users authenticate there. No second authentication system to maintain.
- Cyrus SASL (`saslauthd`): a standalone authentication daemon, used where there is no Dovecot.

Dovecot SASL is the lower-effort path on a typical small mail server that already runs Dovecot.

## Dovecot SASL

In `/etc/postfix/main.cf`, enable SASL via Dovecot and require authentication or trusted network for relay:

```
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = $myhostname
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
```

Add an authenticated submission service in `/etc/postfix/master.cf`, requiring TLS so credentials are never sent in clear:

```
submission inet n - n - - smtpd
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_sasl_type=dovecot
  -o smtpd_sasl_path=private/auth
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
```

Restart both services:

```
sudo systemctl restart dovecot postfix
```

### Risk

SASL authentication without enforced TLS sends usernames and passwords across the network in clear. The `smtpd_tls_security_level=encrypt` on the submission service is what prevents that; do not enable SASL on a plaintext path. `noanonymous` in the security options blocks anonymous authentication, which would otherwise reopen the relay.

## Cyrus SASL (where there is no Dovecot)

Install and configure `saslauthd` to run inside the Postfix chroot, with `/etc/postfix/sasl/smtpd.conf` set to `pwcheck_method: saslauthd` and `mech_list: PLAIN LOGIN`, then the same `smtpd_sasl_*` directives in `main.cf`. The full chroot socket setup is involved; the Postfix and Cyrus SASL documentation covers it step by step.

## Verify

After restart, confirm the server advertises AUTH only on an encrypted connection. Connect to the submission port and check the capabilities:

```
openssl s_client -starttls smtp -connect mail.example.com:587 -quiet
# then in the session:
EHLO test
```

The `250-AUTH` line should appear over the TLS-wrapped connection. Then authenticate from a real mail client over submission and confirm a message sends, and confirm an unauthenticated relay attempt to an outside domain is still refused.

## Done

Authenticated users can send through the submission service over TLS. Unauthenticated relay to outside domains is refused. AUTH is offered only on encrypted connections. Anonymous authentication blocked.

## Rollback

Set `smtpd_sasl_auth_enable = no` in `main.cf` and restart Postfix to disable SASL. Remote users lose the authenticated path until it is reinstated, but the relay restrictions from [hardening Postfix](postfix.md) keep the server from becoming an open relay in the meantime.

## Follow-up

- SASL depends on TLS being configured; see [mail TLS](mail-tls.md).
- `permit_sasl_authenticated` in the relay restrictions ([Postfix hardening](postfix.md)) is what this runbook gives meaning to.
Last updated: 10 July 2026
