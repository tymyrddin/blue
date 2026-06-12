# When the yard is someone else's

The crisis that dramatises this: [Exercise Quiet Yard](../../scenarios/golem-trust-outage.md).

Some impact is not done to you; it is done to the thing you rent, and arrives as your problem
without ever having been your fault. Concentration risk is the structural cost of efficiency. When
financial, logistics, and operational compute all sit with one high-efficiency provider, a single
bad morning in one estate becomes everyone's bad morning at once, and the institutions affected
discover together how much of what they call their own runs somewhere they do not control.

## The shape of it

An impact the organisation did not cause, often cannot technically fix, and frequently cannot
independently audit. The provider is healthy or it is not, and usually only the provider can say
which, on its own timeline. The dependency that looked like a procurement decision turns out to be a
sovereignty one, and the failover meant to cover exactly this is, often enough, the arrangement that
was announced several times and finished none of them.

## Counterparty and contagion signals

Failures that cascade rather than isolate. Public-facing services drop in roughly the order they
were cheapest to provision. Settlement and financial flows lock without a local error to point at,
because the error is several layers down in someone else's estate, where a few hours of silence can
reprice a balance sheet without a coin changing hands. And the uncomfortable tell: a cheaper,
lower-tier, or unaligned tenant staying up while the premium estate gropes for a candle, which
raises the question of whether that uptime is luck or an advertisement for someone else's stack.

## Countermoves

Continuity planning that assumes the provider, not just the hardware, can be the thing that fails.
The requisitioned fallback, taking a slice of whatever civilian or foreign infrastructure is still
alive, carries legal and geopolitical friction, and routing your own traffic over someone else's
ground tells that someone where to listen. Narrative control is the other live decision: owning a
failure before a comfortable cover story mints enough witnesses to make the cover the more damaging
account. The cheapest estate tends to be the one that fails first when someone sets out to break it,
and the redundancy that does nothing most years is the line item that earns its keep on the one
morning it is needed.

## Read across

- [Counter moves in the cloud](../cloud/index.rst): provider concentration, tenancy, and the
  controls that survive a third-party failure.
- [Application control](../friction/application-control-creep.md): raising the cost for an adversary
  who reaches a high-value dependency, and the exclusion creep that erodes it.
- [Responding to it](runbooks/concentration-response.md): the continuity runbook for when the
  provider goes dark.
