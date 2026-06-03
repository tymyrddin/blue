# Detecting web application attacks

Web application logs are the closest thing to a ground truth for what happened in an attack.
They capture every request, every response code, every authentication event. The problem is
not usually a lack of data: it is a lack of rules that turn data into signal.

## Instrumentation

A useful structured log entry for every request contains: the timestamp, the resolved
user identity (not just the session token, but the user it belongs to), the HTTP method, the
full path including query parameters, the response status code, the response size, and the
source IP from the actual network connection.

The source IP is most reliable when taken from the network layer rather than from
`X-Forwarded-For`. An attacker-controlled header recorded as the client IP means the IP
field of every log entry is attacker-writable.

Authentication events benefit from additional context: which authentication method was used,
whether it succeeded or failed, and the username or identifier attempted. Failed
authentications are more useful for detection than successful ones, but both are worth
capturing.

## Request anomaly detection

### Scanner and enumeration patterns

Automated scanners produce characteristic patterns: a high rate of requests to many different
paths from the same source, a high proportion of `404` and `405` responses, a consistent
timing interval between requests, and no variation in the user-agent or cookie across the
session.

A pattern worth alerting on: more than fifty distinct paths requested from the same source IP
within two minutes where more than thirty percent return `404` or `405`. This threshold sits
above the noise floor for most sites but well below a meaningful scanner run.

Known scanner user-agent strings appearing in any request are also worth alerting on.
Scanners frequently use a recognisable user-agent even when attempting to be stealthy.

### Authentication probing

Password spraying produces repeated `401` responses across different usernames from the same
source. Brute force produces repeated `401` responses against the same username.

The signal for both: more than five `401` responses from the same source IP within one
minute, or more than fifteen `401` responses against the same username within ten minutes
regardless of source IP (distributed credential stuffing).

A session that produces many failures followed by a success is worth investigating regardless
of the volume threshold. A successful authentication preceded by more than three failures is
the pattern to flag.

### Injection attempt detection

SQL injection payloads in parameter values are detectable by pattern. The markers are: single
quotes, SQL keywords (`UNION SELECT`, `SLEEP(`, `WAITFOR DELAY`), and boolean expressions
in unexpected positions in parameter values.

SSTI probes contain template syntax: `{{`, `${`, `#{`, `<%=`. These are unusual in normal
parameter values and worth alerting on.

Any request where a parameter value contains SQL or template injection pattern signatures is
a candidate for alerting. These alerts carry a non-trivial false positive rate but are worth
tuning: confirmed injection is a high-severity event.

### IDOR enumeration

IDOR exploitation looks different from normal usage. A user who accesses ten or more distinct
resource IDs in a resource type within a minute, where those IDs do not belong to their own
account, is either automating IDOR testing or actively exfiltrating cross-account data.

The signal: an authenticated user requesting more than ten distinct object IDs in a single
resource type within sixty seconds, where fewer than half of those IDs are associated with
their own account history.

## Workflow and business logic anomalies

Technical attack patterns are detectable by signature. Business logic abuse requires
behavioural detection.

Workflow sequence anomalies: the expected order of requests for high-value workflows can be
modelled. A session that reaches a confirmation or terminal state via a path bypassing
required intermediate steps is anomalous.

Concurrent request bursts: more than five simultaneous requests to the same endpoint from
the same authenticated identity within one second is a pattern legitimate traffic rarely
produces. Turbo Intruder single-packet attacks, concurrent thread attacks, and race condition
testing all produce it.

Outcome monitoring: the results of high-value operations are worth monitoring, not just the
requests. An account that receives three refunds in an hour without corresponding purchases,
or a coupon code redeemed fifteen times from a single account, is a business logic finding.

## Session anomaly detection

Token reuse from geographically inconsistent locations: a session token used in one country
and then used in a different country within a few minutes cannot belong to a single
legitimate user. Sessions appearing simultaneously from ASNs in different geographic regions
are a reliable signal.

Unusual access patterns after authentication: a session that immediately accesses admin
endpoints, schema introspection paths, or high-sensitivity resources without the navigation
pattern that would precede it in normal usage is worth reviewing.

## Correlation and time windows

Individual events are often below alerting thresholds. Correlation across events in a time
window is where attack chains become visible.

A sequence of: failed authentications, followed by a successful login from a new location,
followed by schema enumeration, followed by high-volume resource access, followed by a bulk
data download, is an attack chain. Each event alone may not trigger an alert. Together they
tell a clear story.

Application logs fed into the SIEM alongside authentication, network, and infrastructure
logs enable correlation rules with a four-hour window that look for this sequence pattern.
Slow, deliberate testing that stays below individual rate limits is still detectable as a
sequence if the window is long enough.
