# Set up DMARC

Hardening runbook. Publishes a DMARC policy that ties SPF and DKIM to the visible From address and tells receivers what to do with mail that fails. This closes the spoofing gap SPF and DKIM each leave open on their own. The progression from monitoring to enforcement is the whole point; jumping to enforcement risks dropping legitimate mail.

## When to run

After [SPF](spf.md) and [DKIM](dkim.md) are working. When a [relay and authentication review](../relay-exposure.md) shows no DMARC record, or one stuck at `p=none`.

## Prerequisites

SPF and DKIM published and passing for the domain's legitimate mail. DMARC checks that one of them passes and that its domain aligns with the From header; with neither working, DMARC has nothing to enforce. Confirm both first.

## The policy progression

DMARC has three enforcement levels. The safe path moves through them on evidence, not on a schedule:

1. `p=none`: monitor only. Receivers report results but take no action. This gathers the data on who sends as the domain.
2. `p=quarantine`: failing mail goes to spam.
3. `p=reject`: failing mail is refused outright.

### Risk

Publishing `p=quarantine` or `p=reject` before the monitoring data confirms all legitimate mail passes causes receivers to spam-bin or reject genuine mail from any source not covered by SPF or DKIM. The `p=none` monitoring period exists to find those sources first. Move up a level only once the reports show legitimate mail passing cleanly.

## Publishing the record

Add a TXT record at `_dmarc.example.com`. Start at monitoring, with an address to receive aggregate reports:

```
v=DMARC1; p=none; rua=mailto:dmarc-reports@example.com
```

Run at `p=none` until the aggregate reports show every legitimate mail stream passing SPF or DKIM with alignment. Then tighten:

```
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@example.com
```

and later `p=reject` once quarantine has run cleanly.

## Verify

Confirm the record resolves:

```
dig +short TXT _dmarc.example.com
```

Send a test message to an external mailbox (Gmail shows DMARC results in the message detail) and confirm a DMARC pass. The aggregate reports arriving at the `rua` address are the ongoing verification: they show which senders pass and which fail, per receiver.

## Done

DMARC record published and resolving. Aggregate reports arriving and reviewed. Policy at the highest level (`quarantine` or `reject`) that the reports confirm does not catch legitimate mail. Test mail passes DMARC.

## Rollback

Step the policy back down (`reject` to `quarantine` to `none`) in the TXT record if legitimate mail is being caught, while the failing source is identified and brought under SPF or DKIM. The record change takes effect as DNS propagates.

## What DMARC still does not cover

A passing result means SPF or DKIM passed with alignment, not that the sender is honest. An attacker using the same email provider as the domain, or any authorised server, can sometimes satisfy alignment. And DMARC checks the From domain, not the display name: a message can pass while showing a trusted brand name to the reader. DMARC closes the domain-spoofing gap, not every impersonation. See the [mail stack](../stack.md).

## Follow-up

- The `rua` reports are only useful when read. A dedicated mailbox or a report-parsing tool makes the data legible.
- Revisit the policy when adding a new sending service; a new source not covered by SPF or DKIM will fail under `p=reject`.
