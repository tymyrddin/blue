# Predatory Sparrow

The TRITON kill chain, disabling safety systems before triggering a process fault, was attempted in 2017 at a
Saudi petrochemical plant and failed because of a bug in the malware. Predatory Sparrow completed it in 2022
against three Iranian steel companies simultaneously. The distinction is important. Khuzestan Steel Company, one of
Iran's largest producers, had industrial equipment on fire and emergency workers on site. Two other companies
reported attacks the same day. The group operates under the name Gonjeshke Darande, Persian for hunting sparrow,
publishes in Persian, has targeted exclusively Iranian infrastructure, and is widely attributed in open-source
intelligence to Israeli intelligence or to a group operating with Israeli support. No government has formally
claimed responsibility.

## 27 June 2022, Iran

On 27 June 2022, Gonjeshke Darande published video footage showing equipment on fire at the Khuzestan Steel
Company facility and emergency workers at the scene. Mobarakeh Steel and Hormozgan Steel reported simultaneous
cyberattacks the same day; Khuzestan was the only site with visible physical damage.

The coordination across three separate corporate environments simultaneously points to prior access, reconnaissance,
and preparation at all three targets before the attack date. The group's public communications described the
operation as a response to Iranian government conduct, consistent with the sustained covert conflict between
Iran and Israel that has included counter-infrastructure operations since at least 2010.

## Safety systems first

A Safety Instrumented System is the independent protective layer designed to take autonomous action when a
process exceeds safe operating limits. It is separate from the main process control system, uses different
hardware, and is designed to operate correctly even when the primary controller fails or issues dangerous
commands. Taking the SIS offline before triggering a fault removes the mechanism that would otherwise interrupt
the damage.

This is exactly the sequence the TRITON malware, discovered in 2017 at a Saudi petrochemical plant, was written
to execute. TRITON failed because a logic error in the payload caused two Triconex safety controllers to enter
a fail-safe state independently, triggering a plant shutdown that revealed the attack. Predatory Sparrow's 2022
operation did not fail in the same way.

The class of operation, in its most direct form:

```python
# Writing the maximum value to a high-temperature trip threshold disables the interlock.
# Illustrative of the technique; the specific Predatory Sparrow implementation
# details have not been made fully public.
from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('10.0.0.20')
client.connect()

# Set the safety trip threshold to its maximum value: the interlock will never trigger
client.write_register(address=200, value=0xFFFF, slave=1)  # slave= is pymodbus v3; v2 used unit=

client.close()
```

The precise protocols Predatory Sparrow used to reach the Khuzestan safety systems have not been publicly
disclosed. The conceptual operation, raising a threshold parameter the SIS would never reach, or halting SIS
execution entirely, is representative of the class. The TRITON precedent established that safety controller
firmware can be targeted directly; the 2022 attacks demonstrate that the outcome can be achieved without
necessarily requiring that level of access.

## The fault without the interlock

Steel production involves molten metal above 1,500 degrees Celsius, high-pressure hydraulic systems, and heavy
machinery handling several tonnes of material in motion. Safety interlocks exist at each stage because the
consequences of loss of control include fire, explosion, and molten metal release. An interlock that does not
trip when a dangerous condition is reached does not merely allow the condition to persist. It allows the process
to continue driving toward the condition unchecked.

The video Gonjeshke Darande published showed what appears to be a fire involving heavy industrial equipment,
with emergency response underway. The operational disruption extended well beyond the day of the attack.

The relevant question for a defender is not whether this attack was technically sophisticated. It is whether
the SIS is reachable from any network that is itself reachable from outside, and whether enough network
visibility exists to detect anomalous writes to safety parameter registers before a fault is triggered.

## Attribution and the shadow conflict

Gonjeshke Darande has claimed the June 2022 steel mill attacks and an October 2021 attack on Iran's fuel
distribution network, which disrupted sales at tens of thousands of petrol stations across the country.
Both operations were announced publicly, with video evidence and written statements. The explicit public
framing of the attacks as responses to Iranian government actions, combined with the demonstrated capability
to reach and damage industrial systems, is consistent with a state-affiliated operation.

The broader Iran-Israel covert conflict contextualises the operations. It has included Iranian attacks on Israeli
water infrastructure in 2020, Israeli operations against Iranian nuclear facilities across several years, the
Stuxnet operation beginning around 2007, and numerous proxy operations in between. Predatory Sparrow's
attacks fit the pattern of calibrated destructive operations against Iranian industrial infrastructure used as
pressure instruments rather than attempts at strategic denial.

## Related

- [IEC 61850](../protocols/iec61850.md): substation protection standard; the SIS bypass and relay bypass
  techniques target the same class of protective equipment through IED control functions
- [Modbus](../protocols/modbus.md): common field-level protocol in process industries; register writes are the
  access mechanism for safety parameter manipulation in many deployed SIS environments
- [Triton/TRISIS](triton.md): the 2017 precedent for direct SIS targeting at a Saudi petrochemical plant;
  the intended kill chain Predatory Sparrow completed five years later
- [Smart Grid SimLab](../labs/smart-grid-sim): the predatory-sparrow scenario models the kill chain; SIS
  offline, thermal stress accumulating, then cascading failure with nothing to interrupt it
- [ICS Access and Persistence SimLab](../labs/ics-access-simlab): relay IED overcurrent threshold writes that
  bring the turbine down through its own protection system; protective limits turned against the process
- [OT Defence Workbench](../labs/workbench): brief 6 drops FC06 and FC16 Modbus write commands regardless of
  source address; the function code filter that would block the safety parameter write technique
