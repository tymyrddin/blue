# Exfiltration: defender context

## Why exfiltration is the hardest phase to detect

Exfiltration is the phase where defenders are most disadvantaged. By
definition, it uses approved protocols (HTTPS), approved destinations
(cloud storage services), and approved tools (sync utilities). The traffic
looks like business activity because it is structurally identical to it.

The asymmetry is fundamental: organisations have spent years approving and
facilitating data flows to cloud services. Attackers use those same
approved flows to take data out. Reversing this requires the ability to
distinguish legitimate business activity from malicious activity within
those approved channels.

## Protocol abuse is advancing

DNS tunnelling, long a red team staple, is increasingly detected by DNS
query volume and entropy analysis. Modern variants route through DNS-over-HTTPS,
encrypting the queries and blending them with legitimate DoH traffic.
Detection that worked against classic DNS tunnelling does not work against
DoH-wrapped variants.

QUIC and HTTP/3 are designed to defeat network surveillance. Full traffic
inspection requires TLS interception, which many organisations cannot
deploy universally. Traffic to approved SaaS endpoints over QUIC is, from
the network perspective, opaque.

## Living-off-cloud is the dominant trend

The highest-confidence exfiltration path for a sophisticated attacker is:

1. Compress and encrypt the collected data
2. Use Rclone, the AWS CLI, or a SaaS API to upload it to an attacker-controlled
   account on an approved cloud platform
3. The traffic is HTTPS to an approved destination; no alert fires

Detection requires monitoring what is uploaded to cloud storage, not just
that a connection was made. This is a fundamentally harder problem.

## Low-and-slow defeats volume-based detection

Volume-based detection (alert on large uploads) fails against exfiltration
that is spread over days or weeks, timed to match normal business activity.
A 10GB exfiltration that generates 100MB/day of uploads during business
hours is indistinguishable from normal SaaS usage in the absence of file
access baselines.

## What detection requires

Behavioural baselines are mandatory. Without knowing what normal looks like,
deviation cannot be detected. This requires:

- User and entity behaviour analytics (UEBA) that establish per-user norms
  for data access volume, timing, and destination
- Cloud API monitoring that tracks upload volume, not just authentication
- File access baselining in SaaS platforms (SharePoint, OneDrive, Google Drive)
- Content-aware DLP that monitors what is uploaded, not just that an upload
  occurred

None of these are simple to implement. Most organisations have some but
not all, and the gaps between them are where exfiltration goes undetected.

## The firewall is not the answer

Blocking unknown destinations at the firewall does not prevent exfiltration
via approved cloud platforms. Blocking those platforms would be operationally
unacceptable. The control surface is in what happens within those approved
channels, not at the network perimeter.
