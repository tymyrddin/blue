# Data and process integrity: response runbook

Response when nothing is destroyed but the data or instructions are made to lie: poisoned telemetry
or feeds, manipulated records, tampered automation. Pairs with the [integrity](../integrity.md) family.

## Recognise it

Integrity attacks fire no malware alert; the inputs are valid, only wrong. Suspect integrity when a
confident decision rests on a single feed that recently behaved oddly.

- Diff the live feed against its own recent history: value ranges, cadence, distribution. A feed that
  shifted distribution with no matching real-world cause is the first flag.
- Check timestamps and sequence numbers for gaps, reuse, or non-monotonic order, the tell forgers
  most often miss.
- Reconcile a sample against a second, independent source of the same fact.

## Contain without tipping off

- Do not scrub the suspect data on sight. Deleting the false trend cleans the feed, blinds the
  analyst to the next one, and signals the adversary that the tap is seen.
- Tag and quarantine the suspect stream instead, kept flowing in a watched lane. The pattern of what
  the adversary wants believed is itself intelligence.
- Freeze any irreversible action the poisoned data would trigger (a mobilisation, a payment, a
  setpoint change) pending verification.

## Establish ground truth

Pull the write trail for the affected records, who changed them, when, from where:

```bash
# database: read the audit / change-data-capture table for the affected rows
# M365:  Search-UnifiedAuditLog -Operations Update,Set -ObjectIds <id> -StartDate ... -EndDate ...
# AWS:   aws cloudtrail lookup-events --lookup-attributes AttributeKey=ResourceName,AttributeValue=<id>
# verify the artifact against a signed or immutable copy
sha256sum <artifact>                      # compare to the signed manifest or vendor hash
git -C <repo> diff <last-good-tag>        # config-as-code drift since the last good tag
```

For automation or firmware: if the corruption is in the source or the build, every unit produced from
it is wrong at the moment it is made. Verify the firmware or image hash against the vendor and rebuild
from a clean, signed source; a patch pushed afterward does not reach a flaw that was in the material.

## Recover

- Roll back to the last verified-good state, an immutable or write-once snapshot, not the most recent
  backup, which may already carry the poison.
- Where the clean and poisoned feeds can no longer be cleanly separated, mark the whole feed
  low-confidence going forward, and say so to whoever consumes it.

## After

Keep the mechanics of how the fake was caught. Burying them to save face denies the team's own analysts
the one lesson that catches the next, better forgery.
