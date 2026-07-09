# C2 framework signatures

The detection problem splits in two. An operator who deploys a C2 framework on default
settings leaves the same fingerprints as every other operator who did not bother to change
them. Those fingerprints are catalogued in threat intelligence feeds and matched
automatically. The harder case is an operator who has customised their tooling: replaced
default TLS certificates, written a custom malleable profile, changed default pipe names.
What remains is behavioural: the interval pattern, the traffic asymmetry, the process
parentage.

Most detections in practice hit the uncustomised case.

## Unconfigured deployments

Cobalt Strike's HTTPS team server is a Java process. It generates a self-signed
certificate for its listener. The default certificate carries non-standard issuer
attributes: `C=Earth` (not a valid ISO 3166 country code) and organisation values that
are not plausible for a legitimate server. These appear in TLS inspection logs and
certificate transparency records. Operators who replace the certificate remove this
indicator; many operational deployments do not replace it.

The Java TLS stack (JSSE) used by the CS team server produces a characteristic JA3S hash
(a fingerprint of the TLS ServerHello) that differs from web server TLS implementations
built on OpenSSL, GnuTLS, or SChannel. Zeek logs JA3S for every TLS connection. A
connection to an external IP over 443 where the JA3S hash matches the known CS Java
fingerprint is a high-confidence indicator.

Sliver is written in Go. Go's `crypto/tls` implementation produces a JA3 hash (a
fingerprint of the TLS ClientHello) that is distinctive from browser TLS stacks. A Sliver
beacon running on a host produces connections with a Go TLS fingerprint to external
addresses, which stands out in environments where outbound HTTPS traffic originates from
browsers and Windows-native HTTP clients.

Havoc and Brute Ratel C4 have similarly documented default certificate attributes and
JA3/JA3S values that are maintained in current threat intelligence feeds. The principle is
the same: framework-specific TLS library choices leave a consistent fingerprint that is
visible in passive network logs without decrypting traffic.

## JA3 and JA3S in network logs

JA3 hashes the fields of the TLS ClientHello: TLS version, cipher suites, extensions,
elliptic curves, and elliptic curve point formats. It fingerprints the client: the
implant running on the compromised host. JA3S hashes the fields of the TLS ServerHello
and fingerprints the responding server.

Both appear in Zeek's `ssl.log`. The combination identifies both ends of a TLS session
without decrypting it. A connection where the JA3 matches a known implant library and the
JA3S matches a known C2 server framework is a strong indicator; either alone is weaker
but still worth flagging against a threat intelligence feed.

Cobalt Strike beacons on Windows typically use the Windows-native TLS stack (SChannel) for
their HTTPS communication, which produces a JA3 hash similar to Internet Explorer and
other Windows HTTP clients. The client-side JA3 for CS is therefore less distinctive than
for frameworks using non-native libraries. The JA3S from the CS team server (Java/JSSE) is
the more reliable indicator at the network level.

JARM is an active fingerprinting technique: it probes a server with ten specifically
crafted TLS ClientHellos and records the ServerHello responses. The combination identifies
the server-side TLS library independent of the certificate. JARM is used for scanning
known suspect IP addresses and is distinct from the passive JA3/JA3S approach. Both are
useful; JA3/JA3S is available from existing Zeek logs; JARM requires active scanning
tools run against specific targets.

## Named Pipe C2

After establishing an initial outbound TCP beacon, Cobalt Strike can pivot to SMB-based
communication through Windows Named Pipes. The pivoting host listens on a named pipe;
other compromised hosts connect to it and relay their traffic through it. From a network perspective, only the pivot host appears to
have external C2 traffic; the other hosts have no anomalous outbound connections at all.
Detection shifts entirely to the endpoint.

Cobalt Strike's default Named Pipe names follow recognisable patterns:
`MSSE-[random]-server` is used by the psexec module; `msagent_[hex]` and `postex_[hex]`
are used during post-exploitation job execution; `postex_ssh_[hex]` appears during SSH
session pivoting. Operators who do not change these defaults leave Sysmon Events 17 and 18
(Pipe Created, Pipe Connected) with matching pipe names.

Sliver also supports SMB Named Pipe C2 with its own default pipe naming scheme. The
defaults differ from CS; both are documented in threat intelligence.

Anomalous pipe creation is worth monitoring independent of framework-specific patterns.
A process that is not a system service or known application creating a pipe with a
random-hex or random-alphanumeric name, particularly when that process was spawned from
an unusual parent, warrants investigation regardless of whether the pipe name matches a
known default.

## HTTP beacon patterns

HTTP and HTTPS C2 communication has a characteristic structure independent of the specific
framework or profile. The beacon:

- Sends a GET request to check for pending tasks from the C2 server.
- Sends a POST request to return results.
- Repeats on a configured interval with optional random jitter.

The result at the proxy layer is regular, low-volume HTTP traffic to a single external
destination, with GET and POST requests alternating at a consistent cadence. The request
bodies and URI paths vary by framework and profile; the interval-and-alternation pattern
is structural.

Cobalt Strike's default HTTP profile places base64-encoded session tokens in cookie
headers and returns encoded task data in the HTTP response body. Uncustomised profiles
use the default HTTP malleable C2 settings, which produce consistent request formats.
Customised profiles (of which many publicly available ones are circulated in the red team
community) change URIs, headers, and body formats but cannot change the underlying
GET/POST/interval structure without breaking beacon functionality.

Staging URIs are a separate indicator. Before the full beacon is running, CS uses an
initial staging request to deliver the full shellcode payload. The staging URI is distinct
from the beacon communication URIs and is specific to the CS stager configuration.
Stagerless payloads eliminate this indicator; staged payloads do not.
Last updated: 10 July 2026
