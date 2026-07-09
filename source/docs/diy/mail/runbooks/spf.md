# Set up SPF

Hardening runbook. Publishes an SPF record so receiving servers can check that mail claiming to come from a domain was sent by a host the domain authorises, and optionally checks inbound mail against senders' SPF records. SPF is one leg of the sender-authentication chain; see the [mail stack](../stack.md) for how it fits with DKIM and DMARC.

## When to run

When setting up outbound mail for a domain. When a [relay and authentication review](../relay-exposure.md) shows no SPF record, or one that does not enforce. After changing which servers send mail for the domain.

## Two parts

Publishing the domain's own SPF record (so others trust mail from the domain) and checking inbound senders' records (so the server rejects spoofed inbound mail). The first is essential and low-risk; the second is optional and needs more care.

## Publishing the record

Add a TXT record at the domain root through the DNS provider. To authorise the hosts listed in the domain's MX records:

```
v=spf1 mx -all
```

To authorise one specific host:

```
v=spf1 a:mail.example.com -all
```

The ending is the point. `-all` (hardfail) tells receivers to reject mail from unlisted hosts. `~all` (softfail) tells them to accept but mark it. Exact entry format varies by DNS provider.

### Risk

`-all` published before every legitimate sending source is listed causes receivers to reject genuine mail from the omitted sources (a marketing platform, a ticketing system, a separate app server). List every source that sends as the domain first. Starting with `~all` and tightening to `-all` once the record is confirmed complete is the lower-risk path.

## Checking inbound mail (optional)

The `postfix-policyd-spf-python` agent adds inbound SPF checking to Postfix. In `/etc/postfix-policyd-spf-python/policyd-spf.conf`, a test-only mode applies the check without rejecting, so the impact is visible in the logs first:

```
TestOnly = 1
```

Wire the agent into Postfix in `/etc/postfix/master.cf`:

```
policyd-spf unix - n n - 0 spawn user=nobody argv=/usr/bin/policyd-spf
```

And in `main.cf`, add the check after `reject_unauth_destination` in the restrictions, with a timeout so slow lookups do not abort it:

```
policyd-spf_time_limit = 3600
smtpd_recipient_restrictions = ..., reject_unauth_destination, check_policy_service unix:private/policyd-spf
```

Restart Postfix:

```
sudo systemctl restart postfix
```

Run with `TestOnly = 1` long enough to confirm legitimate inbound mail is not being failed, then set it to `0` to enforce.

## Verify

For the published record, check it resolves and reads as intended:

```
dig +short TXT example.com | grep spf1
```

Then send a test message to an external mailbox and confirm the received headers show an SPF pass. External tools (MXToolbox, appmaildev) validate the record and test delivery.

For inbound checking, the SPF result appears in incoming message headers and in `/var/log/mail.log`.

## Done

SPF record published and resolving, listing all legitimate sending sources, ending in `-all` once confirmed complete. Test mail to an external mailbox passes SPF. If inbound checking is enabled, it enforces after a clean test-only period.

## Rollback

Soften `-all` to `~all` in the TXT record if legitimate mail is being rejected, while the missing source is identified. For inbound checking, set `TestOnly = 1` to stop rejecting while keeping the result in headers.

## Follow-up

- SPF alone does not stop From-header spoofing. Pair with [DKIM](dkim.md) and [DMARC](dmarc.md); the [mail stack](../stack.md) explains why all three are needed.
- SPF breaks on forwarding. DKIM survives it, which is part of why both are published.
Last updated: 29 May 2026
