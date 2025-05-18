# Maltrail

Maltrail is a malicious traffic detection system, using publicly available (black)lists containing malicious and/or 
generally suspicious trails, static trails compiled from various AV reports and custom user-defined lists, and 
(optionally) advanced heuristic mechanisms that can help in the discovery of unknown threats (for example, new malware). 
It is based on a Traffic -> Sensor <-> Server <-> Client Architecture.

Trail can be anything from a:
domain name (like `zvpprsensinaix.com` for Banjori malware)
* URL (like `http://109.162.38.120/harsh02.exe` for known malicious executable)
* IP address (for example `185.130.5.231` for known attacker) 
* HTTP User-Agent header value (like `sqlmap` for automatic SQL injection and database takeover tool).

It can be found on [Github stamparm/maltrail](https://github.com/stamparm/maltrail).

