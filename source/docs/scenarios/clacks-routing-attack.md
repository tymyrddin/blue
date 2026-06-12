# Operation Foul Weather

The Grand Trunk has a bad week before anyone is willing to call it an attack. Messages still arrive.
They simply arrive late, or out of order, or at the right tower with the wrong proof of who sent
them, and every explanation on offer is duller than the truth. By the time the dull explanations
run out, several of the city's allies have spent two days talking confidently to nobody.

## On the line

- [The Civic Defence Establishment](../establishment/index.rst): its command nets ride the Trunk,
  and its [communications and command](../establishment/infra/communications-and-command.md) layer
  is the thing that quietly comes apart. It also holds the hardened relay that was meant to make
  exactly this survivable.
- [The Office of Civil Surveys](../surveys/index.rst): reads the Trunk's traffic for a living, which
  makes it the first to see the pattern and the last able to say how it knows.
- [The Civil Observers' Society](../society/index.rst): notices things. This is a thing.
- [The Home for Bewildered Beasts of Legend](../ngo/index.rst): its field dispatches, the welfare
  reports that a quiet reader treats as something more, start arriving with garbled headers, which
  is either a clacks fault or a much worse one.
- [The Circle Sea Arrangement](../circle-sea/index.rst): several allied commands share the scheme,
  and one bad routing update can sort them into islands that cannot hear each other agree.
- [The Scarlet Semaphore](https://red.tymyrddin.dev/docs/scarlet/): the guild that intercepts and
  rearranges the clacks for sport, and the first name on everyone's lips, because the work looks
  exactly like theirs. The guild itself has long suspected it is infiltrated, which makes it the
  prime suspect and the most likely cover for someone else in the same breath.

## The slow burn

This one does not announce itself; it accretes. First the fog-packets: a slight rise in dropouts on
the lines that climb toward the Ramtops, which the operators blame on weather, because weather is
what those lines do. Then something subtler. Messages are delivered, but the non-repudiation logs
drift out of step, so the record of who said what no longer quite agrees with itself. The Home's
garbled headers belong to this phase, and are read, for two days, as a replication bug in somebody
else's database.

Then the routing update. A relay with no right to the authority broadcasts a shutter
optimisation, properly signed, and the Trunk reorganises itself around it. The allied commands wake
to find they are each at the centre of a small, tidy network that contains only themselves. Nothing
is down. Everything is sorted into the wrong piles, which is worse, because a deadline is obvious
and a lying one is not.

## Decision points

- Whether to revoke the Master Shutter-Key and re-key the Trunk mid-crisis. The signature was
  genuine, which means the key was stolen, which means trusting any signed update is now a choice
  rather than a default. Re-keying darkens everyone for a while, the city included, and the while is
  the window. A city that blinds itself to be safe has done, on its own authority and at the chosen
  hour, the one thing an adversary could never have done for it.
- Whether to fall back to the Post Office: riders and pigeons carrying the one instruction the
  digital layer can no longer be trusted to carry. The old methods are slow, unforgeable, and
  humiliating in roughly that order. The unspoken part is that they are also assumed to be unwatched.
  An adversary patient enough to plan the digital half has had the same months to learn the stables,
  the lofts, and the roads, and a rider carrying the only trustworthy instruction in the city is a
  single point of failure with reins.
- Whether to darken a tower that sits where the city's writ does not run. A relay in neutral or
  unfriendly ground can be silenced, but silencing somebody else's tower is an act, not a fix, and
  the city would have to own it afterwards.
- Who is told, and how, given that the body most certain of the diagnosis is the one that cannot
  explain how it reads the Trunk in the first place.
- Whether to charge the Scarlet Semaphore, which would be popular, plausible, and quick. The guild
  has the skill and the reputation, and a tidy culprit closes the morning. It also closes the
  enquiry, which is precisely what it would be worth to anyone who used the guild as a doorway.

The slow burn buys the attacker deniability that hardens by the hour. Each phase has an
innocent reading, and the innocent readings are free, while every accusation costs the city a
witness and an explanation it would rather not give. By the time foul weather stops being plausible,
the city has spent two days assembling the case against itself.

## Darker readings

- The Master Shutter-Key was not lifted from a hostile capital. It was leaked from one of the
  Establishment's own staging servers, and the breach the city has been treating as a foreign act
  turns out to begin at home. Whoever rode in through the Semaphore had the guild's access and the
  city's own signing authority, which is a combination no lone prankster ever assembled.
- An ally's island reconnects noticeably before the others, which raises the same unwelcome thought
  the yard outage raised: that the scheme's shared keys were never as evenly shared as the scheme
  always claimed.
- The Home's garbled headers were never the damage; they were the cover for it. While the analysts
  chased a replication bug, the content underneath was edited rather than lost, and the feed the city
  quietly steers by has been steering it somewhere ever since. That is its own exercise:
  [Campaign Poisoned Well](poisoned-survey-data.md).
- The weather story holds so well that the city notices it would prefer to keep it, and the question
  stops being who darkened the Trunk and becomes who decided to tell the public about the sky.

## Down the wire

- Riding the Trunk, and the layer built to survive a tower going dark:
  [communications and command](../establishment/infra/communications-and-command.md).
- The standing question this morning makes real, named in the city's own planning:
  [Direction](../establishment/direction.md), on reading the Grand Trunk, and who could darken a
  tower.
- Reading the traffic, and the awkward part of saying so:
  [collection](../surveys/infra/collection.md).
- The availability techniques underneath it, and the containment that follows:
  [availability under attack](../counter/impact/availability.md) and
  [on the network](../counter/network/index.rst).
- The same attack from the other side: [denial and disruption](https://red.tymyrddin.dev/docs/out/impact/notes/availability.html).
- The guild whose name comes up first, and whose infiltration is the whole question:
  [the Scarlet Semaphore](https://red.tymyrddin.dev/docs/scarlet/).
