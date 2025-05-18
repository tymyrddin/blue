# Mailserver audit commands

Mailservers are favourite targets for spam relays, data leaks, and reputation damage. An audit keeps your postbox safe and respectable.

## Software & version checks

```
postconf mail_version   # Postfix
dovecot --version       # Dovecot
exim -bV                # Exim
```

Like milk, mail software should never be left to age unattended.

## Configuration review

```
postconf -n             # Postfix main settings
cat /etc/dovecot/dovecot.conf
cat /etc/exim4/exim4.conf.template
```

Scan for open relays, weak auth, or misconfigured listening ports.

## Authentication & encryption

```
openssl s_client -connect mail.example.com:465
```

Confirm STARTTLS or SMTPS is enforced.

Ensure support for:

* AUTH LOGIN over TLS
* Modern ciphers
* No plain-text logins

## Relay & spam settings

```
postconf smtpd_recipient_restrictions
```

Avoid open relays. Use `permit_sasl_authenticated`, `reject_unauth_destination`, etc.

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

A bloated mail queue may indicate spam, stuck delivery, or something nastier.

## User accounts & permissions

```
cat /etc/passwd | grep mail
ls -l /var/mail/
```

Audit users with mail access, mailbox permissions, and whether users have appropriate mail limits.

## Monitoring & rate limiting

Implement:

* Fail2ban rules for SMTP/IMAP auth failures
* Connection limits per IP
* Rate-limiting outbound messages to avoid blacklisting
