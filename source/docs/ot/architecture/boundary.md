# The IT/OT boundary

The boundary between Level 3 (site operations) and Level 4 (corporate IT) is where the security properties of the two
networks meet. OT networks prioritise availability and determinism; IT networks prioritise confidentiality and
flexibility. The controls at the boundary reflect that tension: tight enough to prevent IT-side compromise from reaching
OT, permissive enough to allow the data flows that justify the IT/OT integration in the first place.

## What crosses the boundary

Defining what legitimately crosses the boundary is the prerequisite for designing the controls. The flows that belong
are typically narrow: historian data moving outward from OT to IT for reporting and analytics, patch and antivirus
update packages moving inward from IT to OT through a controlled staging area, and time synchronisation from a shared
NTP source.

What does not belong crossing the boundary is a longer list. Corporate email and web traffic have no place in OT. IT
management and monitoring tools polling OT devices directly extend IT-network trust without a boundary. Active Directory
authentication from the corporate domain reaching OT systems means a compromised corporate account inherits OT access.
Backup agents that reach across the boundary create a bidirectional channel that is easy to overlook in a threat model.

The exercise of enumerating what currently crosses the boundary against what legitimately belongs there frequently
produces surprises. In most OT environments the firewall rule set was built incrementally over years and contains rules that no
one can explain.

## Firewall architecture

A firewall at the IT/OT boundary with a default-deny posture and an explicit permit list is the baseline. Default-deny
means all traffic is blocked unless a rule explicitly permits it; implicit-deny with accumulated exceptions is not the
same thing and is the more common reality.

Each permit rule warrants a documented business justification, the specific source address or range, the specific
destination, and the specific protocol and port. Rules scoped to an address range rather than a specific host, or rules
permitting an entire protocol family rather than a specific port, often reflect the convenience of the person who wrote
the rule rather than the minimum required flow.

Time-bounded rules for maintenance windows are worth implementing where the firewall supports them. A rule that permits engineering software access to a PLC during a Saturday maintenance window has no business existing
on Sunday morning. Many OT
environments leave maintenance rules in place indefinitely because removing them requires a change management process
that creates friction.

## DMZ architecture

A DMZ at Level 3.5, sitting between Level 3 and Level 4, is the stronger boundary design. Neither the OT side nor the IT side
has a direct route to the other; both have routes to the DMZ, and data is staged there for transfer.

The historian pushes process data to a data transfer server in the DMZ. IT systems query the data transfer server, not
the historian. The historian has no route to Level 4; the ERP has no route to Level 3. The DMZ is the only point of
contact.

Patch and update staging follows the same pattern. An update server in Level 4 downloads patches and antivirus
signatures from the internet. A staging server in the DMZ receives approved packages from the update server. OT systems
pull from the staging server. At no point does an OT system have a route to the internet, and the internet has no route
to the OT network.

Security monitoring systems, whether a SIEM collecting logs from both networks or an OT-specific monitoring platform,
also benefit from the DMZ staging pattern. Log collectors in the DMZ receive forwarded events from OT; the SIEM consumes from
the DMZ collectors rather than polling OT systems directly.

## Data diodes

A data diode is hardware-enforced unidirectionality: it is physically impossible for data to flow in the blocked
direction. Where a firewall is software that can be misconfigured, have rules added to it, or be compromised, a data
diode is a one-way optical link with no return path.

The cost is architectural: the OT side pushes data rather than the IT side pulling it. Historian products from major
vendors support unidirectional replication. The data diode sits between the historian and its IT-side replica; the
replica is queryable from IT, the historian is not.

Data diodes are appropriate for the highest-sensitivity OT environments, or for specific flows such as historian
replication and log forwarding, where the business requirement is strictly outbound and no return traffic is needed. They are not a
general replacement for a firewall; the maintenance and engineering access flows that require bidirectional
communication still need a controlled, audited path.

## The collapsed DMZ

The collapsed DMZ is the most common boundary antipattern: a single firewall with interfaces on both the OT network and
the corporate network, with permit rules running in both directions. This is a router with access control lists, not a
security boundary. A firewall compromise or misconfiguration exposes the OT network directly.

A related pattern is the historian that serves data to both OT and IT simultaneously. The historian sits in Level 3 with
routes to Level 2 SCADA systems and also accepts queries from Level 4 business intelligence tools. In software, it
bridges the boundary; the firewall rules that appear to enforce the boundary are not preventing the historian from being
the crossing point.

Both patterns are common because they are operationally convenient and were typically implemented before the security
implications were considered. Identifying them is straightforward; remediating them requires the availability windows
and change management discipline that OT environments find expensive.
