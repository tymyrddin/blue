# CASB and DLP latency

Cloud Access Security Brokers deployed in proxy mode and DLP systems with inline content inspection
add latency to operations that route through them. The added delay per request is typically small
(50 to 200 milliseconds), but it is noticeable in interactive workflows, particularly for
applications that make many small API calls.

The more significant operational issue is false positive volume. DLP rules matching on regular
expressions for credit card numbers, tax identifiers, or other sensitive patterns will catch
legitimate business documents that contain such data in non-sensitive contexts: audit reports,
anonymised training data, financial statements. In environments with active DLP, the per-week
false positive volume can reach hundreds of cases.

The typical response to high false positive volume is raising thresholds or narrowing rules. Both
reduce sensitivity. At the extreme, rules that would generate too many false positives to investigate
are disabled, and the protection exists on paper only.

Effective DLP requires ongoing tuning: understanding what legitimate data flows look like, writing
rules narrow enough to catch anomalous transfers without flagging routine business activity. This
is ongoing work. An organisation that deploys DLP and does not maintain it typically ends up with
a system that generates too many alerts to action, too few alerts to trust, or both at different
times.
