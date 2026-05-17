# APIs in AI pipelines

APIs in AI pipelines introduce attack surfaces that are not present in traditional request/response architectures.
[The attacker's view](https://red.tymyrddin.dev/docs/in/api/notes/ai-surface.html) covers how these surfaces are
probed; the defensive position starts from treating API-sourced content as untrusted input at every stage of the
pipeline.

## Prompt injection via upstream API content

An AI pipeline that fetches content from an external API and forwards it to a language model is vulnerable if that
content contains prompt injection payloads. The model receives the attacker's instructions alongside the
application's system prompt and may follow them.

Practical controls:

- Treat external API content as data, not as instructions. Structural prompting (system prompt and user turn
  separation) and explicit instruction in the system prompt about not following embedded commands reduce the
  exposure, though they do not eliminate it.
- Validate and constrain the content before it reaches the model: schema validation on the API response, length
  limits, and field-level sanitisation reduce the attack surface. Content that does not match the expected schema
  is rejected before ingestion.
- Where the pipeline's purpose allows it, avoid sending raw third-party content to the model. Summarise or extract
  structured fields first using a contained intermediate step.

## Data poisoning via upstream APIs

External APIs used as data sources for retrieval-augmented generation (RAG), fine-tuning, or knowledge base
population are a poisoning vector if their content is accepted without validation. A compromised or adversarially
controlled upstream API can inject content designed to bias model outputs or persist instructions across queries.

Provenance tracking (recording the source and retrieval timestamp for each piece of ingested content) supports
auditability and selective removal when a source is found to be compromised. Content validation policies (schema
enforcement, anomaly detection on ingested text) applied at the ingestion stage catch unusual patterns before they
reach the model layer.

## Tool use and capability scope

AI agents that call APIs as tools inherit the permissions of the credentials used for those calls. An agent given a
credential with write access to a storage service can write to that service if induced, via prompt injection or a
poisoned tool result, to do so.

Scoping credentials to the minimum operation the agent legitimately needs limits the blast radius. An agent that
only reads from a database does not need a credential with write or delete permissions. Separate credentials per
pipeline stage, with the minimum scope for each, are more defensive than a shared credential covering all
operations.

## Per-stage output validation

Multi-hop agent chains process and forward outputs from one stage to the next. A stage that receives injected
content and forwards it without validation extends the injection's reach to all downstream stages.

Validating outputs at each stage boundary (schema validation, content length checks, and structural sanity checks)
limits what any single compromised or poisoned stage can deliver downstream. The assumption that the previous
stage's output is trustworthy is the assumption that fails first in a multi-hop injection chain.
