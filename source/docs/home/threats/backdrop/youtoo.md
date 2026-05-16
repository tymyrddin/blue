# No platform is inherently safe

For years, it was reasonable to assume that Linux was a hardened target, macOS a walled garden, and Windows the
primary malware platform. That period has passed. The financial incentives to attack high-value Linux servers
were eventually large enough to justify the development effort. macOS market share grew enough to make it worth
targeting. And cross-platform frameworks made it straightforward to port existing attacks across operating
systems.

## Linux

Linux runs most internet infrastructure, which makes it worth attacking. RansomEXX, Tycoon, and QNAPCrypt are
among the variants targeting Linux systems. Erebus, originally a Windows ransomware, was ported to Linux
specifically to target servers. Living-off-the-land techniques using built-in shell tools have become standard
because they blend into legitimate administrative activity.

## macOS

Apple's reputation for security has historically been earned, but it has also led to underestimation of the
platform's exposure. ThiefQuest distributed via pirated software installers. MacStealer targeted iCloud
keychain credentials. JockerSpy deployed via trojanised apps. Living-off-the-land attacks using built-in macOS
tools follow the same logic as on Linux: use what is already there.

macOS security relies significantly on user passwords, which phishing reliably extracts. The walled garden
controls app distribution; it does not prevent credential theft.

## Cross-platform

StripedFly infects both Linux and Windows systems, mines cryptocurrency while exfiltrating data, and spreads
via network worm behaviour. Cross-platform malware has become easier to develop and deploy. The operating
system is increasingly less relevant as a protection; the configuration, the patch state, and the user's
behaviour matter more.
