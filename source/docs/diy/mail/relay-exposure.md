# Mail relay and sender authentication

Two failure modes cause disproportionate damage to a mail server operated by a small organisation: an open relay, which lets anyone send mail through the server; and absent or misconfigured sender authentication, which lets others spoof the domain. Both are detectable and fixable without specialist expertise.

## Open relay

An open relay accepts mail from any source and forwards it to any destination. Open relays are found by automated scanners within hours of going live and frequently end up on major blocklists shortly after. Once blocklisted, mail from the domain is rejected or quarantined by receiving servers until the listing is contested, a process that takes days and offers no guarantees.

To check the relay configuration in Postfix:

```
postconf smtpd_recipient_restrictions
postconf mynetworks
```

`smtpd_recipient_restrictions` governs whose mail the server accepts. The combination that closes the open relay: `permit_sasl_authenticated` (authenticated users may submit mail) alongside `reject_unauth_destination` (unauthenticated senders may only deliver to domains this server hosts). Missing `reject_unauth_destination` is the open relay condition.

`mynetworks` lists the networks trusted without authentication. A correctly configured server has loopback addresses only: `127.0.0.0/8` and `[::1]/128`. A broad subnet is a relay pathway.

A direct test that requires only an external host: connect to port 25 and attempt to relay a message to an address on a domain this server does not host.

```
EHLO test.example.com
MAIL FROM: <test@test.example.com>
RCPT TO: <target@some-other-domain.com>
```

`550 5.7.1 Relay access denied` confirms the relay is closed. Anything other than a rejection confirms it is open.

## Sender authentication chain

SPF, DKIM, and DMARC together determine whether receiving servers accept mail claiming to come from the domain, and whether they do so without question. The [mail stack](stack.md) covers how the three controls interact and where each leaves gaps. The audit question is simpler: are the records present and do they enforce anything?

```
dig +short TXT _spf.example.com
dig +short TXT selector._domainkey.example.com
dig +short TXT _dmarc.example.com
```

For SPF: `~all` (softfail) at the end means receiving servers may still accept mail that fails the check. `-all` (hardfail) means they reject it. `?all` provides no enforcement.

For DKIM: absence of the record means either no outbound signing, or a mismatch between the selector in DNS and the one the mail server is using. The mail server configuration and the DNS record need to be cross-referenced to confirm they match.

For DMARC: `p=none` collects aggregate reports but enforces nothing. `p=reject` with an `rua` address for aggregate reports is the target state. Moving from `none` to `quarantine` to `reject` gradually, using aggregate report data to identify legitimate mail streams that would fail, reduces the risk of blocking legitimate traffic during the transition.

## Mail logs

`tail -n 500 /var/log/mail.log` (Postfix on Debian/Ubuntu) or `/var/log/maillog` (RHEL/CentOS).

Repeated `SASL LOGIN authentication failed` from the same or rotating IPs is a brute-force attempt against mail authentication. Unlike SSH, mail authentication failures do not always trigger rate limiting by default.

`status=bounced` with `550` codes repeated for outbound messages to a specific domain often indicates that domain's mail servers are rejecting mail from this server, sometimes because of blocklist status. `postqueue -p` shows the current queue; `postcat -vq [queueID]` shows the content of a specific message.

A large queue of outbound messages to diverse external destinations, many to unknown or invalid addresses, is a relay-in-progress indicator. Normal mail queues contain deferred messages to known destinations with consistent bounce codes. A relay in progress looks different: high volume, diverse destinations, addresses failing immediately on delivery.
Last updated: 29 May 2026
