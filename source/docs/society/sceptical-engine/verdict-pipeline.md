# The verdict pipeline

The verdict pipeline is the sequence of stages that takes input material from ingestion to a confirmed or
unconfirmed finding. Each stage has a defined input, a defined output, and writes to the audit log before
passing control to the next stage. No stage is skipped. No stage can promote itself to final verdict.

## Stage overview

### Ingestion

The workspace manager brings the input material under controlled conditions: firmware binary, extracted code,
or a specific file or component for analysis. The ingestion stage records what was ingested, from where, and
when. The workspace is now in a defined state that subsequent stages can reason about.

### Inference

The inference subsystem loads the configured local model and presents the input material for analysis. The
model produces candidate vulnerabilities: potential issues identified in the material, with an indication of
where in the code or binary each issue appears and what class of problem it represents.

Candidate vulnerabilities are proposals. The audit log records every proposal the model makes, including those
that sandbox execution subsequently does not corroborate. A model that proposes many issues and has most of
them fail verification is visible in the log.

### Sandbox execution

For each candidate vulnerability, the sandbox stage constructs an execution environment and runs the relevant
code under conditions designed to reveal whether the proposed issue is real. Sandbox execution is isolated:
the code runs in a contained environment that cannot affect the host system, and network access is prohibited.

Execution produces an observation: what the code did, what signals it produced, whether the proposed
vulnerability manifested. The observation is recorded in the audit log.

The sandbox does not know what the model proposed. It receives a code path and execution conditions and
returns an observation. The interpretation of that observation is the next stage's work.

### Verdict

The verdict stage takes the model's proposal and the sandbox's observation and issues a determination:

- Confirmed: the sandbox observed behaviour consistent with the proposed vulnerability
- Unconfirmed: sandbox execution did not produce behaviour consistent with the proposal
- Inconclusive: the sandbox could not produce a definitive observation; the finding requires analyst
  review

Confirmed findings proceed to the output stage. Unconfirmed findings are closed in the audit log. Inconclusive
findings are flagged for manual review without being elevated to confirmed status automatically.

### Output

Confirmed findings are written to a structured output record: the vulnerability description, the evidence from
sandbox execution, the complete audit trail from ingestion through verdict, and the metadata needed for a
responsible disclosure report.

The output is the deliverable. The audit trail is what makes it credible.

## Analyst review

The pipeline is designed to run with minimal human intervention during execution. The analyst reviews output
after the pipeline completes. For inconclusive findings, the analyst makes the determination that the pipeline
could not. The manual review decision is recorded in the audit log like any other decision.

The pipeline does not assume the analyst will simply accept its output. The audit trail exists so that the
analyst can interrogate every decision the pipeline made and form their own view of whether the finding is
sound before it goes anywhere.
Last updated: 29 May 2026
