# Remote access architecture

Remote access is the most consistently exploited initial access vector in OT incidents. The Colonial Pipeline compromise
in 2021 gained entry through a legacy VPN account. The Oldsmar water treatment incident that same year went through
remote desktop software. The pattern recurs because remote access was added to OT environments for legitimate operational reasons (vendor maintenance, after-hours
engineering support) and the security architecture was never designed to match the risk.

## The problem with VPN to the OT network

Extending corporate VPN access to the OT network is operationally convenient and architecturally poor. A VPN that grants
access to "the OT network" grants access to everything on it: every PLC, every HMI, every engineering workstation. The
access is governed by the VPN credential, which is a corporate credential, which means any compromise of the corporate
environment is also a compromise of OT access.

There is typically no session recording, no granular access control below the network level, and no mechanism requiring
an OT operator to approve the connection before it begins. The VPN was designed for IT remote workers; its access model
does not map onto OT.

## Jump host architecture

The jump host (or bastion host) is the baseline architecture for OT remote access. A hardened system sits in the DMZ or
at Level 3, reachable from the corporate network or the internet via a controlled path. Engineers connect to the jump
host and from there reach the specific OT systems they are authorised to access.

The jump host has two properties that the direct-VPN model lacks: it is the only system with routes to both the remote
network and OT, so all sessions pass through a single controlled point; and it can be configured to record every
session, producing an audit trail of exactly what was done and when.

Access to the jump host requires multifactor authentication. The account database is separate from corporate Active
Directory, so a compromised corporate credential does not inherit OT access. The jump host itself runs a minimal
software set, is patched on the IT schedule, and is monitored by the security operations function.

From the jump host, access to individual OT systems is scoped to what the engineer or vendor actually needs. An engineer
authorised to program a specific PLC has a route to that PLC and no others. The access scope is reviewed and updated as
responsibilities change.

## Privileged Access Workstations

For on-site engineering work, a Privileged Access Workstation (PAW) is the physical equivalent of the jump host model.
The PAW is a dedicated workstation used only for OT engineering tasks: no email, no web browsing, no connection to
shared corporate drives.

A PAW has a single network connection to the OT engineering VLAN and no corporate network connection. Updates arrive
through the DMZ staging server. The workstation is not joined to the corporate domain. If the corporate network is
compromised, the PAW is not reachable from it.

The friction this creates is real. Engineers who are accustomed to switching between corporate tasks and OT tasks on a
single laptop find the PAW model inconvenient. The convenience of a multi-homed laptop is the same property that makes
it a liability: it carries the corporate network's risk onto the OT network every time it connects.

## Vendor access

Vendor remote access is a distinct risk profile from internal engineering access. Vendors may be connecting from
unmanaged endpoints, have credentials that are not subject to the organisation's password policies, and have accounts
that are not routinely reviewed for necessity. The Triton/TRISIS attack targeted a safety instrumented system; the
initial access came through a vendor account.

The architecture for vendor access is tighter than for internal engineers. Each vendor session is created in a dedicated access gateway that records the full session: keystrokes, screen content,
commands issued. The vendor account is
created for the specific maintenance window and disabled immediately on completion; there are no standing vendor
accounts with permanent access.

Before the session begins, an OT operator explicitly approves it: the vendor's request specifies which device they need
to reach and for what purpose. The approval is logged. The vendor sees only the specific device they are authorised to
reach, not the broader OT network.

Several commercial platforms implement this model: Claroty SRA, Xentry Connect, Cyolo, and Dispel are among the options
built specifically for OT vendor access. The session recording and approval workflow are core features rather than
add-ons, and the access model is device-specific rather than network-level.

## Credential separation

OT access credentials kept separate from corporate credentials at every layer (VPN accounts, jump host accounts,
individual device accounts) mean a corporate credential compromise does not cascade to OT, and an OT credential
compromise does not give access to corporate systems.

In practice this is commonly violated for convenience. Engineers maintain a single set of credentials for both
environments because managing two sets is friction. The same corporate Active Directory is extended to OT systems
because it already exists and separate identity management seems expensive.

The cost of separation is operational. The cost of not separating was visible in the incidents that have followed.
