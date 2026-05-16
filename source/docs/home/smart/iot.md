# Connected devices: what to watch for

## Smart TVs

Why they matter:

* Built-in tracking of viewing behaviour, often enabled by default
* Targeted advertising that may use audio or content recognition
* Firmware updates that slow or stop before the hardware does

How to reduce the exposure:

1. Put the TV on a guest Wi-Fi network with client isolation enabled.
2. Disable tracking features:
   * Samsung: Settings → Support → Terms & Policies → "Viewing Information" → off
   * LG: Settings → All Settings → General → About This TV → "Live Plus" → off
3. Consider using a streaming stick (Roku, Apple TV) instead of the TV's built-in apps. The stick is easier
   to replace and has a more contained attack surface.

## Cameras

Why they matter (Ring, Nest, Eufy, and similar):

* Default passwords give anyone the admin credentials
* Cloud storage means footage exists somewhere other than your home
* Some models have had live-feed exposure incidents from credential reuse

How to reduce the exposure:

1. Enable end-to-end encryption where the manufacturer offers it (Nest, Eufy).
2. Set up two-factor authentication on the associated app account.
3. Use physical lens covers rather than relying on software-only "off" switches.
4. Prefer local storage modes where available.

If a camera requires cloud storage with no local option, the footage is not under your control.

## Voice assistants

Why they matter (Alexa, Google Home):

* Always-on microphones can be triggered by words similar to the wake word
* Skills and integrations expand the data-collection surface
* Recorded audio is stored and sometimes reviewed

How to reduce the exposure:

1. Use the hardware mute switch when not actively using the device.
2. Set recordings to auto-delete (three months is a common option in settings).
3. Schedule router-level network access to cut off internet access overnight.
4. Remove unused skills and review active integrations periodically.

## Appliances that do not need internet connectivity

The following categories of devices benefit from network isolation or disconnection:

Smart fridges: useful display features rarely justify the network access required. Connected appliances
handling credentials have a poor history of protecting them.

Robot vacuums: floor-mapping data has been the subject of data-sharing discussions at several manufacturers.
If local-only mode is available, use it.

Microwaves, toasters, and small appliances with Wi-Fi: the connectivity rarely adds meaningful value. Block
their network access or use non-connected equivalents.

The general principle: the fewer devices that have unrestricted outbound internet access, the smaller the
lateral movement surface if any one of them is compromised.
