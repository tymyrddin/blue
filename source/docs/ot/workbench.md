# OT Defence Workbench

Most OT security labs are built around attack paths. The [OT Defence Workbench](https://github.com/tymyrddin/ot-defence-workbench)
starts from the other end: a network boundary with nothing on it, legitimate traffic that needs to get through,
and an adversary that already knows what to try.

## What it is

Four containers, two network segments, one constraint: nothing reaches the asset except through the boundary node.

The containers are a client (legitimate consumer, north segment), an asset (Modbus/TCP server, south segment),
a boundary node where the defensive work happens, and a probe on the north segment running the adversary role.
The boundary starts as a transparent bridge. The learner builds it up from there.

The probe generates attack traffic. It also reports what it knows got through. A green scoreboard means the
probe found nothing; it does not mean the boundary is secure. The distinction is worth sitting with.

## Eight briefs

Progression runs through eight escalating briefs. Each brief states a protective requirement without specifying
a solution: something like "no direct Modbus writes from the north segment" or "all access to the asset via
a recorded session." The adversary tier is a separate variable, so the same brief can be tested against a
low-sophistication probe or a more capable one once the basic requirement is met.

The components available for building a defence are deliberately bounded: packet filters for L3/L4 allowlists,
a jump host with session recording, a Modbus-aware protocol filter, a read replica for one-way mirroring of
asset state, and a log sink for visibility without prevention. Combining them for a given brief is the exercise.

## The thing that separates it from most labs

Attack labs check whether an attack got through. This one checks both sides: whether the attack got through
and whether legitimate traffic kept flowing. Blocking Modbus writes from the probe while also dropping the
client's reads is a fail. The requirement is a boundary that distinguishes, not one that stops everything.

That constraint makes the briefs considerably harder. It also makes them more representative of what defensive
decisions in real OT environments actually involve.

## Running it

```bash
lab up       # start the environment
lab check    # run the probe and report
lab build    # instantiate a defensive component
lab reset    # return the boundary to transparent bridge
lab down     # stop and clean up
```

The workbench is at [github.com/tymyrddin/ot-defence-workbench](https://github.com/tymyrddin/ot-defence-workbench) and is in early development.
