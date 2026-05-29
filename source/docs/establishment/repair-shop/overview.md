# Active hardware access and binary analysis

The Repair Shop works with devices in hand. Not with the signals devices emit across a network, and not
with the firmware images devices have already made available for passive observation. With the devices
themselves, under conditions that do not permit the standard engagement approaches.

Two Society projects work adjacent to this domain without occupying it. The Anvil extracts what devices
have already broadcast: banner strings, protocol constants, certificates, web assets. Passive collection
of material the device chose to share. The Sceptical Engine analyses firmware images that are already
available, using AI-assisted candidate generation and sandboxed execution to verify findings. Both
operate on material that exists in the open, or that has been shared through normal disclosure channels.

The Repair Shop extracts material that has not been shared through any channel. JTAG and SWD interfaces,
physical teardown, direct flash storage access. The device in question has not broadcast its firmware.
The Repair Shop retrieves it anyway, under conditions that do not permit the Society's methods and do not
produce the Society's kind of transparency.

## What it does

Firmware extraction from devices where passive observation has not produced a usable image. JTAG and SWD
debug interfaces provide direct memory access. When a device's flash storage is readable through its debug
port, the firmware image is extracted that way. When it is not, hardware teardown identifies the storage
medium and proceeds from there.

Hardware teardown where the device architecture requires it: locating debug interfaces, identifying flash
storage components, mapping the board layout. The teardown produces documentation. The documentation is
not the final output.

Binary analysis of extracted firmware in offline, isolated environments. Disassembly, emulation,
identification of code paths relevant to the current tasking. The analysis pipeline does not connect to
external services. Nothing leaves the analysis environment until the analysis is complete and the output
has been reviewed.

## Scope

The Repair Shop's remit covers three classes of work: devices that cannot be assessed through
network-layer approaches, supply chain material requiring verification before deployment, and hardware
submitted through the Receiving Desk whose provenance or contents warrant examination before the material
is trusted.

The Engineers' Guild handles infrastructure under acknowledged engagement conditions. The Repair Shop
handles cases that fall outside those conditions: situations where the engagement cannot be acknowledged,
where standard access channels are unavailable, or where the analysis requires physical access that a
remote approach cannot substitute for.
