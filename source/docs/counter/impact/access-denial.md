# When the lock is on your side of the door

The crisis that dramatises this: [Campaign Closed Account](../../scenarios/golem-trust-denial.md).

Availability is usually imagined as the infrastructure failing. The quieter case is the
infrastructure working perfectly and declining to admit you. Access removal weaponises identity and
access management as an instrument in its own right: a single account, individual, or allied tenant
finds its tokens revoked under a properly formed administrative instruction, while everything around
it runs untouched. Nothing broke. One door was closed, correctly, and on purpose.

## The discovery problem

An outage announces itself; a denial has to be discovered. An outage mints witnesses everywhere at
once, and the shared experience is itself a kind of proof. A targeted denial mints a single witness
and leaves him to persuade his own organisation that he has not done something to deserve it. The
first hour goes to blaming his own end, the second to the network, and only the third to the
unwelcome possibility that the lockout is deliberate and authored somewhere he cannot see. The
asymmetry is the weapon: the cost of proving a negative falls entirely on the person locked out.

## Countermoves

A joint or multilateral audit can force a provider to expose the provenance of an access block,
distinguishing a genuine instruction from a forged one, though the same transparency that would
clear the air also erodes the tenant privacy that made the lever quiet in the first place.

Escrowed access, local override keys held by the customer or a trusted third party, insulates vital
operations from a central administrative block, at the cost of conceding in writing that the block
was always possible.

The slowest damage is internal. When people learn that candour or visibility can cost them their
tools, they self-censor, and the reporting an organisation runs on thins to whatever was safe to
have written. Defending against access denial is partly technical and largely about not teaching
your own people to go quiet.

## Read across

- [Counter moves on credentials](../creds/index.rst): identity, tokens, and the controls around
  account access.
- [Counter moves in the cloud](../cloud/index.rst): tenancy, administrative boundaries, and
  provider-held keys.
- [Counter moves on the human layer](../human/index.rst): the people side, including the chilling
  effect on reporting.
