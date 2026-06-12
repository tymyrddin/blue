# When nothing breaks but everything lies

The crises that dramatise this: [Campaign Poisoned Well](../../scenarios/poisoned-survey-data.md)
and [Operation Idle Hands](../../scenarios/golem-free-will-injection.md).

The most expensive impact can leave the infrastructure running perfectly. Nothing is encrypted,
nothing is deleted, and every system reports green. What has changed is the data or the instructions
inside it, and the target is not a server but institutional certainty: the adversary arranges for an
organisation to spend its own uncompromised resources on a decision it would never have made with
clean inputs. Whether the tampering reaches an intelligence feed or an automated workforce, the
thing under attack is the same, the belief the organisation acts on.

## The lack of signal

Integrity operations generate almost no traditional telemetry, because the payload is built to look
like the system working. It mimics a routine administrative update, an automated self-check, a
legitimate sensor reading. A SIEM tuned to catch malware sees authenticated identities performing
normal actions, and nothing fires. The first sign is often downstream and expensive: a posture
taken, a workforce idle, a payment sent, with a clean audit trail behind it the whole way.

### Data and cognitive manipulation

Here the feed is left running and lied to. Poisoned telemetry, nested where no one thinks to look,
lets an organisation discover a trend for itself and believe it the more intensely for having found
it. The defensive instinct, scrub the bad data, is often the wrong one: deleting the false trend
cleans the feed and blinds the analyst to the next, where tagging it and watching it turns the
forgery into a standing read on what the adversary wants believed. Detection shifts from tool
signatures to the shape of the data: the grooming the forgers did not finish, the timestamps that do
not sit right, the trend too clean to survive a second look.

### Supply-chain and automation tampering

Here the instructions are rewritten upstream, before they reach the thing that runs them. A trusted
update carries a payload dressed as an improvement, and the compromise is present in the component at
the moment it is made. The hard version is repository or build-level persistence: when the source an
organisation casts its automation from is corrupted, every unit produced from it is hostile at birth,
and no patch pushed afterward reaches a flaw that was in the material. That is not a thing a software
fix repairs. It is a thing stopped at the source and rebuilt, or not at all.

## Countermoves

The common thread is that integrity defence is provenance defence. Watching the shape of data being
gathered and staged rather than the tools that gather it. Tagging suspect streams rather than
destroying them, to keep the channel and the read it carries. Treating the supply chain as a trust
boundary in its own right, where the question is not whether a component runs but whether its origin
can be shown.

## Read across

- [Counter moves on collection](../collection/index.rst): catching staged and manipulated data by
  its shape rather than its tools.
- [Counter moves on the supply chain](../app/supply-chain.md): trusted updates as an attack path.
- [Counter moves on exfiltration](../exfiltration/index.rst): the channel that data manipulation and
  extortion both ride.
- [Responding to it](runbooks/integrity-response.md): containment, ground truth, and rollback when a
  feed is lied to.
