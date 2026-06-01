# Correlation platforms

Most of this section encodes correlation as Wazuh rules, because that is where the rest of the
detection stack already lives. Correlation logic does not have to sit inside a SIEM, though. The same
intent, watching for sequences and for behaviour that drifts from its own baseline, can run as a
small standalone process that reads events and emits findings.

Two such engines exist, kept deliberately plain: explicit rule sets over inscrutable black boxes, and
human-readable descriptions over mystic incantations. They suit places where a full SIEM is overkill,
or where correlation output feeds a dashboard or an alerting hook directly.

## BGP attack correlator

[temporal_correlation.py](https://github.com/tymyrddin/red-lantern-detection/blob/main/correlation-engines/temporal_correlation.py)
is rule-based. It reads syslog-style lines, parses them into structured events, classifies each one
(suspicious login, ROA request, ROA publication, validator sync, BGP announcement), and groups them
by prefix. Against each group it looks for the sequences that tend to mark a hijack rather than
ordinary chatter:

* fraudulent ROA creation followed by publication
* a suspicious login arriving just before a ROA request
* several validators accepting the same dodgy route

A match produces a correlation object carrying a severity (low, medium, high, critical) and a
plain-language description of what was seen. The premise is the one running through this whole
section: look not only at what happened, but at when, and in what order.

## RPKI anomaly detector

[time_series_anomaly_detection.py](https://github.com/tymyrddin/red-lantern-detection/blob/main/correlation-engines/time_series_anomaly_detection.py)
takes the statistical route. It keeps a rolling per-prefix history of validation outcomes, computes a
baseline ratio of valid to invalid observations, and asks of each new observation whether it sits
outside what that prefix has done before:

* a roughly three-sigma excursion in the valid/invalid ratio
* sudden validator consensus where there had been none

It returns a flag and a description when something looks unusual, and otherwise says why not. The
baseline needs around ten prior samples before it draws any conclusions, so the first readings on a
new prefix are treated as warm-up rather than signal. No black magic, just z-scores.

## Where they fit

Both engines expect to be fed structured input at runtime: the correlator wants log lines with
timestamps and meaningful messages, the detector wants counts of valid and invalid validations with a
timestamp. Outputs are plain data structures, suitable for a logger, an alert sink, or a dashboard.
They are engines rather than finished tools, so a scheduler to feed them and a sink to record them are
assumed.

Set against the [Wazuh encodings](encoding.md), these are an alternative platform for the same
detections, not a replacement: useful when the correlation needs to live outside the SIEM, or when a
statistical view of validation behaviour is worth having alongside the rule-based one.
