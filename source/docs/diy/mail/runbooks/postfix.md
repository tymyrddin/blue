# Harden Postfix

Hardening runbook. Configures Postfix so it is not an open relay, does not leak account information, and rejects obvious abuse before it reaches mailboxes. This covers the security-relevant configuration; full Postfix setup is in its own documentation. For checking an existing server's relay state quickly, see [relay and authentication review](../relay-exposure.md).

## When to run

When setting up a Postfix server that accepts or relays mail. When a [relay review](../relay-exposure.md) shows the server accepts mail it should not, or after any change to the SMTP restrictions.

## The files

Two files hold the configuration. `/etc/postfix/main.cf` is the bulk of it; `/etc/postfix/master.cf` defines which services run. Most changes take effect on `postfix reload`; a few need a restart. Back up `main.cf` before editing:

```
sudo cp /etc/postfix/main.cf{,.old}
```

Inspect the current non-default settings at any point with:

```
postconf -n
```

## Close the relay

An open relay forwards mail from anyone to anyone, and gets the server blocklisted within hours. The control is `smtpd_recipient_restrictions` in `main.cf`. The combination that closes the relay: permit authenticated users and local networks, reject everything bound for a domain this server does not host.

```
smtpd_recipient_restrictions =
    reject_invalid_hostname,
    reject_unknown_recipient_domain,
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination,
    reject_rbl_client sbl.spamhaus.org,
    permit
```

`reject_unauth_destination` is the line that closes the relay. Its absence is the open-relay condition.

### Risk

Restriction rules are order-sensitive. A `permit` placed too early short-circuits the rejects that follow it, leaving the relay open despite the rules looking correct. Keep `reject_unauth_destination` ahead of any blanket `permit`. Confirm `mynetworks` contains only loopback (and any genuinely trusted internal range).

## Disable address harvesting

The `VRFY` command lets an attacker test whether an account exists, aiding brute force and harvesting names. Turn it off:

```
disable_vrfy_command = yes
```

## Greylisting (optional)

Greylisting temporarily rejects mail from unknown senders on first contact. Legitimate servers retry and get through; many spam scripts do not. Install `postgrey` and add it as a policy service:

```
smtpd_recipient_restrictions = ..., check_policy_service inet:127.0.0.1:10030
```

Enable the `postgrey` service, then reload Postfix. It delays first-contact mail by minutes, which is the trade-off.

## Mailboxes are not Postfix's job

Postfix routes mail; it does not store mailboxes. Deliver to a POP/IMAP server (Dovecot's `dovecot-lda`) for storage, filtering, and quotas. Keeping that boundary clean avoids a class of misconfiguration.

## Verify

Check the configuration parses, then reload:

```
sudo postfix check && sudo postfix reload
```

Confirm the relay is closed by attempting to relay from an external host to an outside domain (full method in [relay and authentication review](../relay-exposure.md)):

```
postconf smtpd_recipient_restrictions      # confirm reject_unauth_destination present
postconf mynetworks                        # confirm loopback only
```

The relay test should return `554` or `550` relay access denied. Confirm `VRFY` is refused: `VRFY postmaster` over an SMTP session should return a `502` or `252`.

## Done

`reject_unauth_destination` present and ahead of any `permit`. `mynetworks` limited to trusted addresses. `VRFY` disabled. `postfix check` clean. External relay attempt refused.

## Rollback

The pre-edit `main.cf.old` is the fallback: restore it and reload. For a single bad restriction line, edit it out and reload, so other hardening stays in place.

## Follow-up

- Relay hardening is separate from sender authentication. Pair with [SPF](spf.md), [DKIM](dkim.md), and [DMARC](dmarc.md).
- Add [TLS for mail transport](mail-tls.md) so sessions are encrypted, and [SASL authentication](sasl.md) so `permit_sasl_authenticated` has something to permit.
- Watch the queue and logs after changes; see [relay and authentication review](../relay-exposure.md).
