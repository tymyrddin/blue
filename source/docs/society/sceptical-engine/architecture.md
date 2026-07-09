# Architecture

vulnforge treats the AI model as one component in a multi-stage system. The
architecture reflects a specific distrust: AI models can hallucinate, can be wrong in confident-sounding ways,
and produce output that is plausible but unverified. Building a security tool around unverified AI output
produces a scanner that tells you what it thinks rather than what it observed.

The Sceptical Engine built something different.

## The model is not the system

The core design principle is stated in the repository's documentation: the model is not the system. vulnforge
organises reasoning around subsystems. The model is the inference subsystem. There are others, and they do not
defer to it.

The flow:

1. Ingestion: code or firmware is brought into the workspace under controlled conditions
2. Inference: the local model analyses the material and proposes candidate vulnerabilities
3. Sandbox execution: proposed vulnerabilities are verified by executing relevant code in an isolated
   environment and observing actual behaviour
4. Verdict: the pipeline issues a verdict based on observed execution, not on the model's confidence
5. Audit: every step, every proposal, every execution result, and every verdict is written to the
   tamper-evident audit log

The sandbox is the check on the model. If the model proposes a vulnerability and sandbox execution does not
corroborate it, the finding is not confirmed. The model's proposal is noted in the record but not elevated to
a finding.

## Directory structure

The repository's top-level structure maps directly to the subsystems:

```
audit/          tamper-evident log of all decisions and observations
bootstrap/      environment initialisation and model download
configs/        pipeline configuration
inference/      model integration and prompt construction
orchestrator/   pipeline coordination
sandbox/        isolated execution environment
schema/         structured data definitions for findings and audit records
stages/         the discrete pipeline stages, each independently testable
store/          persistent state and workspace management
tests/          test suite
cli.py          command-line interface
workspace.py    workspace lifecycle management
```

Each subsystem has a defined interface. The orchestrator coordinates them but does not merge their concerns:
the inference subsystem does not know what the sandbox will do, and the sandbox does not know what the model
proposed.

## Local models

vulnforge runs on open-source models available for local deployment. The bootstrap process handles model
download and configuration. The platform runs on standard workstations; it does not require GPU infrastructure,
though GPU acceleration improves throughput.

No cloud-hosted model is ever contacted. The air-gap is structural, not a setting that could be accidentally
misconfigured.

## Run and workspace separation

The architecture separates runs from workspaces. A workspace holds the material being analysed and persists
between runs. A run is a single execution of the pipeline against a workspace. This separation allows an
analyst to run the pipeline multiple times against the same material with different configurations, compare
results, and build up a complete picture of a firmware image over multiple sessions.

The audit log accumulates across runs within a workspace. The full history of what was proposed, what was
tested, and what was determined is preserved.
