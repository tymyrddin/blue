# Exercise Dark Turbine

The cleanest kill is the one where the machine destroys itself on its own momentum. By working the
timing differences between the mismatched controllers in a multi-vendor plant, an adversary nudges
the rotational synchronisation of the city's main generators out of true. Nothing is deleted. The
steel is simply persuaded to chew through its own bearings.

## The control room

- [Unseen University Power and Light Co.](https://red.tymyrddin.dev/docs/power/): holding the
  disaster-recovery runbooks and discovering that every automated failover it has ever tested
  assumes a network that is cooperating.
- [The Royal Bank](../org/scale-up/royal-bank.md): whose automated mints and vault mechanisms flinch
  each time the generator rhythm stumbles. A day of erratic voltage is a day the vault doors cannot
  be trusted to lock or to open.
- [The Civil Observers' Society](../society/index.rst): which reverse-engineers a captured gateway
  update and finds that the anonymous connections opened during the last emergency upgrade were never
  closed.
- [The Civic Defence Establishment](../establishment/index.rst): facing the question of whether to
  post physical guards on substations that are failing for reasons no guard can see.
- [The Circle Sea Arrangement](../circle-sea/index.rst): whose shared threat picture has no category
  for an attack that looks exactly like a poorly maintained bearing until the machine splits in half.

## The first signs

The first sign is acoustic, not digital. Senior mechanics notice a harmonic groan in the foundations
of the turbine house, a frequency that should not exist. On the monitors the generator speed wanders
by less than half a percent, and the tools file it as routine load balancing.

The language changes when the first bearing housing shears through four inches of dwarven iron. The
latency logs show out-of-phase synchronisation commands sent to individual controllers at precisely
chosen intervals, using the generators' own mass against them. The network is entirely up. The
trouble is that the plant speaks several protocols at once, and nothing stops two of them from
issuing contradictory orders to the same shaft.

## Decision points

- Whether to segment the plant mid-incident. Cutting the traffic between the operator stations and
  the controllers stops the phase attack and blinds the engineers to the real state of the spinning
  rotors at the same stroke.
- Whether to invoke the manual fallback. Dropping the plant to fully mechanical governance, five
  hundred people with clipboards and brass gauges, strips the digital layer of its leverage and
  reduces the city to pre-industrial output. It works. It is also an admission, in public, of how
  far the machine had been trusted.
- What to tell the arrangement, given that the honest description, an attack indistinguishable from
  wear until the steel fails, is the one its shared categories cannot hold.

The quiet hides the attack inside tolerance. As long as the deviation stays under the
threshold the monitors treat as noise, the damage accrues for free, and by the time the groan is loud
enough to name, the bearings have already paid for it.

## When it breaks

- The historian is wiped. As the turbines approach failure, the process history is dropped record by
  record, so the city loses its machinery and the evidence of how at the same moment.
- The backups have already learned the attack. The synchronisation logic migrated to the emergency
  arrays during the first hour's housekeeping, so the instant the main grid drops and the backups
  take the load, they enter the same self-destructive rhythm and tear themselves apart on cue.

## The detail, if you want it

- Driving rotating machinery past itself, and wrecking plant on purpose:
  [Stuxnet](../ot/incidents/stuxnet.md) and [Predatory Sparrow](../ot/incidents/predatory-sparrow.md).
- The provider's turbine logic and the historian that holds the evidence:
  [the Hex turbine PLC](https://red.tymyrddin.dev/docs/power/exploitation/runbooks/hex-turbine-plc.html)
  and [the historian](https://red.tymyrddin.dev/docs/power/exploitation/runbooks/uupl-historian.html).
- The anonymous connections left open after an upgrade: [OPC UA](../ot/protocols/opcua.md).
- Holding the boundary without going blind: [boundary hunt](../counter/ot/runbooks/ot-boundary-hunt.md)
  and [architecture boundary](../ot/architecture/boundary.md).
- Watching the process, not just the network: [monitoring](../ot/architecture/monitoring.md) and
  [detection](../counter/ot/detection.md).
- The impact family this belongs to, destruction made physical, and the loss of the record with it:
  [destruction and extortion response](../counter/impact/response.md).
