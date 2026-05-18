# Zones, levels, and the Purdue model

The Purdue Reference Model, formalised in ISA-95 and widely adopted as the conceptual basis for OT network architecture,
divides industrial systems into levels based on function and time criticality. The model predates modern networking and
was not designed as a security framework, but it provides a vocabulary that is still useful for reasoning about trust
boundaries and what communicates with what.

## The levels

Level 0 is the physical process: sensors, actuators, drives, and field instruments. Communication at this level is
typically over field buses (HART, Profibus, IO-Link, Foundation Fieldbus) rather than Ethernet. Devices at Level 0
receive commands from Level 1 and have no awareness of anything above it.

Level 1 is basic control: PLCs, RTUs, and DCS controllers. These devices execute control logic, read from Level 0 field
devices, and send commands back to them in scan cycles measured in milliseconds. Engineering workstations access Level 1
devices directly for programming and maintenance, but only from Level 2.

Level 2 is supervisory control: SCADA servers, HMIs, and the engineering workstations that configure Level 1 devices.
This is the control room layer. Operators interact with the process here; changes to PLC programs originate here. Level
2 is the highest level at which commands flow downward to the physical process.

Level 3 is site operations: historians, batch management systems, and Manufacturing Execution Systems (MES). Data
aggregated here comes from Level 2 and flows upward to corporate systems. Level 3 has IT-like characteristics (standard server hardware, Windows or Linux, familiar software) but its
availability requirements remain those of OT: a historian failure affects reporting and process optimisation, not the
control loop directly.

Level 4 is business logistics: ERP systems, corporate IT, business intelligence. It consumes process data from Level 3
but has no legitimate reason to send commands to anything below Level 3. The boundary between Level 3 and Level 4 is
where most IT-to-OT attacks cross.

## Zones and conduits

IEC 62443, the industrial security standard series, refines the Purdue model with the concepts of zones and conduits. A
zone is a group of assets with similar security requirements and a defined trust level. A conduit is the controlled,
documented communication path between zones.

A conduit is most useful when it has a defined purpose, a defined set of permitted protocols and addresses, and an
owner responsible for reviewing it. The discipline is the same as firewall rule management: every permitted flow carries
a documented business justification, and flows without one have no place in the design.

The practical value of the conduit concept is that it forces the question for every data flow: which zone does this
originate from, which zone does it terminate in, and what controls govern the path? In many OT environments that
question has never been asked systematically, and the answer, when investigated, is that a significant proportion of
flows have no documented justification.

## Common violations

Several architecture patterns recur across OT environments and each represents a violation of the zone model.

An engineering workstation used for both corporate tasks (email, web browsing) and PLC programming is multi-homed across
zones in the most direct sense. Any malware that reaches it through the corporate network can traverse to Level 1 and
Level 2 systems without crossing any boundary. This is the initial access pattern in a significant proportion of
IT-to-OT attacks.

A historian server with bidirectional routes to Level 2 SCADA systems inverts the intended data flow direction. Data
flows outward from Level 2 to the historian; the historian does not poll Level 2. A historian reachable from Level 4
that also has routes to Level 2 is a bridge, not a boundary.

Corporate IT management tools (SCCM, Ansible, monitoring agents) that reach into Level 2 or Level 3 extend IT-network
trust into OT without any explicit decision having been made to do so. The tools were installed to solve an operational
problem; their network reach was not reviewed from a security perspective.

Remote desktop solutions that bypass Level 2 and reach directly to Level 1 PLCs remove the supervisory layer from the
access path entirely. The jump host architecture exists precisely to prevent this: all remote access terminates at a
controlled point in Level 2 or the DMZ, not at the field device.

## The model as a design tool

The Purdue model is most useful not as a compliance checklist but as a question-generating framework. For any data flow
in an OT environment, asking which level it originates at, which level it terminates at, and what controls govern the
transition exposes the gaps between what the architecture is supposed to be and what it actually is.

That gap is usually large, because OT networks accumulate connections over years of operational decisions made without a
security lens. The model does not prescribe how to close the gap; it makes the gap visible.
