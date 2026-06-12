# Exercise Heavy Water

Nobody needs to crash the grid to kill the city. They need only make the machinery believe it is
colder than it is. The high-pressure steam loops and thaumaturgical coolant feeding UU Power and
Light's Hex turbines run on unauthenticated, plaintext logic that has never heard of a password and
is deeply suspicious of the idea. The telemetry says the boilers are stable. The iron says otherwise.

## The turbine hall

- [Unseen University Power and Light Co.](https://red.tymyrddin.dev/docs/power/): the provider. Its
  engineering workstations are the royal road to the city's physical heart, and its control loops
  have spent fifty years assuming that any hand on the lever belonged to someone who paid for his
  union card.
- [The Civic Defence Establishment](../establishment/index.rst): whose foundries, arsenals, and
  perimeter pumps are tethered to the station's baseload. A pressure drop at the turbine hall is a
  platform drop at the wall inside twenty minutes.
- [The Civil Observers' Society](../society/index.rst): which monitors the city's ambient conditions
  and catches the discrepancy the control room missed, the vibration in the streets that does not
  match the flat, smooth lines on the central displays.
- [The Office of Civil Surveys](../surveys/index.rst): trying to trace an injection that did not
  arrive over the Grand Trunk but leaked in through a contractor's remote-maintenance link, the kind
  of door nobody counts because nobody admits it is a door.
- [The Circle Sea Arrangement](../circle-sea/index.rst): several allied maritime states depend on the
  city's deep-water locks, held shut by the same high-pressure hydraulics now undergoing unexplained
  thermal expansion.

## Glass against iron

It reads, at first, as an efficiency gain. The control-room screens show fuel consumption falling
while turbine output holds perfectly steady, and the operators congratulate themselves on a fine
adjustment to the thaumaturgical mixture. The log records the steady telemetry as a quiet success.

Then the physical world breaks step with the digital one. The Society reports that the river around
the cooling intake is boiling, at the same moment the exhaust gauge reads a comfortable forty
degrees. The language in the turbine hall shifts from efficiency to sensor fault, and from sensor
fault, slowly, to something nobody wants to say first.

Someone has reached the engineering workstations, rewritten the logic in the controllers, and pinned
a false telemetry loop back to the monitors. The machines are melting their own safety margins while
assuring the control room they have never been safer. The reassurance is the attack.

## Decision points

- Whether to trust the glass or the iron. Overriding the system by hand means switching off the
  automatic governors that are the only thing holding a genuinely failing turbine together. If the
  glass is lying, the manual override saves the city. If the iron is the part that is failing, the
  override is what flattens two districts.
- Whether to drop the scram rods. Killing the thaumaturgical reaction ends the crisis in an instant
  and poisons the baseline grid for six months, leaving the city on coal bought from rivals who are,
  at present, smiling across a table.
- How to isolate the network without stopping the pumps. The malicious logic travels the same
  segments as the feedback that keeps the pressure valves from bursting under ordinary physics. Cut
  the one and you may release the other.
- Who is told that the air gap was a story. Admitting that a foreign hand reached the physical loops
  through a low-tier commercial vendor's ledger rewrites the security arithmetic for every ally that
  has wired its own defence assets into the city's power.

The calm screens buy time, while the room argues whether it is being lied to. Every hour spent
debating sensor calibration is an hour the iron spends past its tolerances, and the cleanest version
of this attack never has to do anything except keep the screens calm.

## If the iron wins

- The logic is in the firmware. The intruder did not merely send bad setpoints; they used the
  engineering access to flash the remote units, so a reboot reloads the attack from local memory and
  calls it recovery.
- The interlocks are inverted. The trips meant to vent pressure when a boundary is crossed have been
  remapped, and the system now reads an over-pressure emergency as the cue to seal the valves.
- The cover story fractures. The city reaches for a coal shortage, and the Hex cooling towers vent
  violet sparks into the noon sky, which makes the supply-line explanation look like exactly what it
  is.

## Down to the iron

- The provider, and the doors into its iron: [Unseen University Power and Light](https://red.tymyrddin.dev/docs/power/),
  in particular the [engineering workstation](https://red.tymyrddin.dev/docs/power/exploitation/runbooks/uupl-eng-ws.html)
  and the [contractor's gate](https://red.tymyrddin.dev/docs/power/exploitation/runbooks/contractors-gate.html).
- False readings to the control room while the process is driven past its limits:
  [Stuxnet](../ot/incidents/stuxnet.md) and [Oldsmar](../ot/incidents/oldsmar.md).
- Safety systems turned against the process they guard: [Triton](../ot/incidents/triton.md).
- Making the machinery believe it is colder than it is: [FrostyGoop](../ot/incidents/frostygoop.md).
- The maintenance link nobody counts as a door: [remote access](../ot/architecture/remote-access.md).
- Watching the wire and the process rather than the screen: [exposure](../counter/ot/exposure.md),
  [detection](../counter/ot/detection.md), and the [protocol hunt](../counter/ot/runbooks/ot-protocol-hunt.md).
- The impact family this belongs to, off the iron, where nothing breaks but the readings lie:
  [integrity](../counter/impact/integrity.md).
