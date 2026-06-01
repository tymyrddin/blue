# Passive scanner architecture

The architecture behind the [🐙 Passive scanner spike @GitHub](https://github.com/tymyrddin/passive-scanner/): its components, how data moves through them, and who is responsible for what. The aim is a spike that can grow without being rebuilt, while the Desk → Forge → Scanner workflow stays intact.

## Principles

* The fingerprint logic is immutable design input. `fingerprint.yaml` defines the probes and the match logic, and that layer does not change when a provider is swapped underneath it.
* Providers are replaceable services. External datasets (Netlas, Censys, and the rest) are reached through one defined interface.
* The evaluator is deterministic. Match logic applies to observations and produces no side effects.
* The controller orchestrates rather than decides. `scan.py` sequences the flow; it does not implement probe logic.

## Directory structure

The top-level layout maps straight onto the subsystems:

```
passive-scanner/
├── scan.py                  # CLI & orchestration
├── fingerprint/
│   ├── loader.py            # fingerprint.yaml → internal model
│   └── model.py             # Probe, MatchLogic, Fingerprint classes
├── providers/
│   ├── base.py              # Abstract search provider interface
│   ├── netlas.py            # Netlas implementation
│   └── censys.py            # Optional Censys implementation
├── engine/
│   ├── planner.py           # Probe → provider query translation
│   ├── evaluator.py         # Apply match_logic
│   └── evidence.py          # Normalize and store evidence
├── io/
│   ├── targets.py           # Load IPs / netblocks
│   └── output.py            # JSONL results writer
└── FINDINGS.md              # Spike results & limitations
```

## Component responsibilities

### Fingerprint layer

* `loader.py`: parses `fingerprint.yaml` into internal data structures.
* `model.py`: defines the `Probe`, `Fingerprint`, and `MatchResult` objects.
* The job: a tool-agnostic representation of probes and match logic.

### Providers

* `base.py`: the abstract class defining `search_probe(probe, targets)`.
* `netlas.py`: the Netlas-specific queries.
* `censys.py`: an optional fallback provider.
* The job: return observations per probe, and leave the match logic well alone.

### Planner

* `planner.py`: maps probes to provider query syntax.
* For example: `http.headers.server:"DeviceOS/2.1.4"`
* The job: keep the API-specific logic in one place.

### Evaluation engine

* `evaluator.py`: applies `match_logic` to grouped observations.
* `evidence.py`: structures the evidence per IP for JSONL output.
* The job: deterministic, testable logic evaluation.

### CLI / controller

* `scan.py`: loads fingerprints, reads targets, calls planner, provider, and evaluator in turn, and emits results.
* The job: glue, and no logic decisions of its own.

### IO

Not wired into the spike yet. It is for later.

* `targets.py`: handles IP and netblock input.
* `output.py`: emits JSONL lines: `<timestamp>, <ip>, <match_result>, <evidence_snippet>`.

## Data flow

1. `scan.py` loads `fingerprint.yaml` and `targets.txt`.
2. `planner.py` turns each probe into provider-specific queries.
3. The provider runs the queries and returns raw observations.
4. `evaluator.py` groups observations per IP, applies `match_logic`, and produces a `MatchResult`.
5. `output.py` writes JSONL with the matched IPs and the evidence.

No packets are sent. This is passive, internet-facing scanning.

## Spike success criteria

* The CLI tool runs and consumes one `fingerprint.yaml`.
* It queries Netlas for 100 test IPs and outputs structured results.
* The findings are documented, API limits, data quality, and gaps included.
* The end-to-end flow is verified, with no assumptions made about full scale or active scanning.

## Scaling considerations

* More providers: Netlas → Censys → local datasets, eventually.
* Caching and pagination: wrap the providers.
* Parallelisation: a later enhancement; the controller stays as it is.
* Bulk fingerprints: the evaluator is untouched, the planner handles the translation.
* Active probes: a separate provider module, with no effect on the fingerprint model.

## Non-goals, for the current spike

* GUI
* Concurrent fingerprint evaluation
* Active probing
* Optimisation for speed
* Full error handling

This is the backbone for the passive-scanner spike: testable, modular, and ready to grow a piece at a time.
