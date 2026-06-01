# Trust path and chain of custody

The Society's responsible disclosure practice requires that findings be credible, verifiable, and accompanied
by evidence that a vendor or operator can act on. A finding from a black-box scanner is a claim. A finding
with a documented trust path is a case.

vulnforge is designed to produce the latter.

## What the trust path covers

The trust path is the chain of decisions and observations that connects a piece of input material to a
disclosed finding. It answers:

- What was scanned, and how was it obtained?
- What did the model propose, and on what basis?
- How was the proposal verified?
- What did execution in the sandbox actually show?
- Who reviewed the result, and what did they decide?

Every step is recorded in the audit log. The record is written as each step completes, not compiled
retrospectively. It cannot be edited without the edit being visible.

## Why responsible disclosure

Vendors receiving vulnerability reports have reasonable grounds to be sceptical. A report that says "your
device has a buffer overflow in the authentication handler" without evidence is not actionable. A report that
includes the firmware version, the specific code path, the sandbox execution trace, and a tamper-evident
record of the analysis process is.

The audit trail also protects the Society. Responsible disclosure occasionally becomes contentious: vendors
may dispute findings, dispute timelines, or dispute whether appropriate care was taken. The audit log provides
a contemporaneous record that the Society did what it says it did.

## The tamper-evident log

The audit log uses a chained hash structure. Each log entry includes the hash of the previous entry. Any
modification to an earlier entry breaks the chain from that point forward. An analyst presenting the log to
a third party can demonstrate that it has not been altered after the fact.

This is not sophisticated cryptography. It is sufficient for the Society's purposes: demonstrating that the
record of an analysis has not been retrospectively adjusted.

## Air-gap as trust property

The offline-first design is a trust property as much as a security one. When a finding is disclosed, the
Society can state that the analysis was performed on an air-gapped system and that no material left the host
during the analysis process. For firmware from industrial or critical infrastructure sources, this provides
assurance to the vendor or operator that the Society's research did not itself constitute a leak of sensitive
system details.

It also means the Society is not dependent on the continued availability or policies of any external service.
The pipeline works the same way in 2026 as it will in 2030, regardless of what happens to third-party AI
providers.

## What the trust path does not guarantee

The trust path documents what was done and what was observed. It does not guarantee that the model found
everything, that the sandbox exercise was exhaustive, or that the finding represents the only vulnerability
in the analysed material. Responsible disclosure reports from the Sceptical Engine are clear about this: the finding
is what the pipeline identified and verified. Other issues may exist.

This honesty is part of the trust path, not a weakness in it.
