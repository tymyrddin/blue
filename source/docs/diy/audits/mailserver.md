# Mailserver audit commands

Mailservers are frequent targets for spam relay abuse, data leaks, and domain reputation damage. A regular audit keeps the configuration tight and the exposure narrow.

## Software & version checks

```
postconf mail_version   # Postfix
dovecot --version       # Dovecot
exim -bV                # Exim
```

Mail software left on outdated versions carries known vulnerabilities; patch regularly.

## Configuration review

```
postconf -n             # Postfix main settings
cat /etc/dovecot/dovecot.conf
cat /etc/exim4/exim4.conf.template
```

Scan for open relays, weak authentication, or misconfigured listening ports.

## Authentication & encryption

```
openssl s_client -connect mail.example.com:465
```

Confirm STARTTLS or SMTPS is in use.

Check for:

* AUTH LOGIN over TLS only
* Modern ciphers
* No plain-text logins

## Relay & spam settings

```
postconf smtpd_recipient_restrictions
```

Open relays allow anyone to send mail through the server. Use `permit_sasl_authenticated`, `reject_unauth_destination`, etc. to restrict delivery.

Check SPF, DKIM, DMARC with tools like:

```
dig +short TXT example.com
```

Or test email headers via https://www.mail-tester.com/.

## Mail queue & logs

```
mailq                  # View mail queue (Postfix/Exim)
postcat -vq [queueID]  # Inspect suspicious message
tail -f /var/log/mail.log
```

A bloated mail queue may indicate a spam relay, stuck delivery, or a misconfiguration under load.

## User accounts & permissions

```
cat /etc/passwd | grep mail
ls -l /var/mail/
```

Audit users with mail access, mailbox permissions, and whether users have appropriate mail limits.

## Monitoring & rate limiting

Consider:

* Fail2ban rules for SMTP/IMAP auth failures
* Connection limits per IP
* Rate-limiting outbound messages to reduce blacklisting risk
