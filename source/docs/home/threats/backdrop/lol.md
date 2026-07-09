# Living off the land

Living-off-the-land attacks use tools already present on the target system.
The approach has become standard because it is effective: built-in system utilities run with expected
permissions, their activity blends into normal administrative patterns, and endpoint detection tends to trust
signed system binaries.

## The toolkit

LOLBAS (Living Off the Land Binaries and Scripts) catalogues the Windows built-in tools that have been abused
for attack purposes. `certutil.exe`, a certificate management tool, can download files. `PowerShell` can
exfiltrate data over HTTPS. `wmic` can execute code remotely. None of these behaviours trigger alerts by
default because the tools themselves are legitimate.

GTFOBins performs the same function for Unix and Linux systems. `curl`, `vim`, `python`, `tar`, and many other
standard utilities can be used for privilege escalation, data exfiltration, or persistence when combined with
the right flags and a bit of ingenuity.

LoLDrivers extends the principle to device drivers. Signed but vulnerable drivers can be loaded to disable
security software, escalate privileges, or install persistent implants. The driver is trusted because it is
signed; the vulnerability it contains is exploited after the trust is established.

## Why it works

The detection problem is genuine. A `PowerShell` script downloading a file looks identical whether it is an
administrator running a legitimate update or an attacker exfiltrating credentials. Endpoint detection systems
have to use context and behaviour patterns to distinguish between them, and attackers adapt to those
heuristics as they are developed. The arms race is ongoing, and living-off-the-land techniques remain
effective partly because they are so embedded in normal system operation.
