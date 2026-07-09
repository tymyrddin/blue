# Set up DKIM

Hardening runbook. Configures OpenDKIM so the mail server cryptographically signs outbound mail and verifies signatures on inbound mail. The signature travels with the message and survives forwarding, which is the gap SPF leaves open. See the [mail stack](../stack.md) for how DKIM fits with SPF and DMARC.

## When to run

When setting up outbound mail for a domain. When a [relay and authentication review](../relay-exposure.md) shows no DKIM record, or a selector mismatch between DNS and the signer.

## The pieces

A key pair per domain: the private key signs outbound mail, the public key is published in DNS so receivers can verify. A selector names the key, allowing more than one key per domain and clean rotation. OpenDKIM runs as a milter that Postfix hands mail to for signing and checking.

## Install

```
sudo apt-get install opendkim opendkim-tools
```

## Generate the key

Choose a selector (any alphanumeric string) and generate the pair:

```
sudo opendkim-genkey -r -s myselector -b 2048 -d example.com -D /etc/dkimkeys
```

This writes `myselector.private` (the signing key) and `myselector.txt` (the DNS record to publish). Lock the keys down so only OpenDKIM reads them:

```
sudo chgrp opendkim /etc/dkimkeys/*
sudo chmod go-rwx /etc/dkimkeys/*
```

### Risk

The private key signs as the domain. Anyone who reads it can forge signed mail from the domain. Keep it readable only by the `opendkim` user, and out of backups that are less protected than the server.

## Configure OpenDKIM

In `/etc/opendkim/opendkim.conf`, point it at the key and selector:

```
Domain      example.com
KeyFile     /etc/dkimkeys/myselector.private
Selector    myselector
Socket      local:/var/spool/postfix/var/run/opendkim/opendkim.sock
UserID      opendkim
UMask       007
```

On Debian, Postfix runs chrooted under `/var/spool/postfix`, so the socket has to live inside that jail. Create the socket directory there, owned by `opendkim`:

```
sudo mkdir -p /var/spool/postfix/var/run/opendkim
sudo chown opendkim. /var/spool/postfix/var/run/opendkim
sudo chmod go-rwx /var/spool/postfix/var/run/opendkim && sudo chmod g+x /var/spool/postfix/var/run/opendkim
```

For several domains on one server, the `KeyTable`, `SigningTable`, and `TrustedHosts` directives map each domain to its key; the OpenDKIM documentation covers that layout.

## Connect Postfix

Let Postfix reach the socket and hand mail to the milter:

```
sudo adduser postfix opendkim
```

In `/etc/postfix/main.cf`:

```
milter_default_action = accept
milter_protocol = 6
smtpd_milters = unix:/var/run/opendkim/opendkim.sock
non_smtpd_milters = unix:/var/run/opendkim/opendkim.sock
```

`milter_default_action = accept` means mail still flows if OpenDKIM is down; the trade-off is unsigned mail during an outage. Restart Postfix:

```
sudo systemctl restart postfix
```

## Publish the public key

Add a TXT record from `myselector.txt`, at hostname `myselector._domainkey`, value:

```
v=DKIM1; k=rsa; p=yourPublicKey
```

Format varies by DNS provider.

## Verify

Confirm the key in DNS matches the private key:

```
sudo opendkim-testkey -d example.com -s myselector -vvv
```

A `key OK` result confirms the pair lines up. Then send a test message to an external mailbox and confirm the received headers show `DKIM-Signature` and a DKIM pass. Check `/var/log/mail.log` for signing activity.

## Done

OpenDKIM signs outbound mail. `opendkim-testkey` reports the key OK. Test mail to an external mailbox passes DKIM. Private key readable only by `opendkim`.

## Rollback

Remove `smtpd_milters` / `non_smtpd_milters` from `main.cf` and restart Postfix to stop signing while a problem is sorted out. Mail flows unsigned in the meantime. The DNS record can stay published; it does nothing without the signer.

## Follow-up

- DKIM proves the message came from an authorised signer, not that the From header is honest. [DMARC](dmarc.md) ties the signature to the visible From address.
- Rotate the key periodically by generating a new selector, publishing it, switching the signer to it, then retiring the old record.
Last updated: 10 July 2026
