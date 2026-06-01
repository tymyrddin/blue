# Roadmap

The path from where the scanner is now, a passive, API-driven spike, to a full operational system. The current architecture is a solid place to grow from; this is the order the growing happens in.

## Principles for development

* De-risk first: each phase proves a core assumption before anyone invests in scale.
* Operational reality: features are prioritised by what a real deployment needs, not by what is fun to build.
* Incremental scaling: the architecture takes modular upgrades without a rebuild from the studs.

## Phased development

```
       +----------------------------------+
       |    Current State:                |
       |    API Scanner Spike             |
       | (Core Integration Validated)     |
       +----------------------------------+
                       |
                       v
       +----------------------------------+
       |   Phase 1: Hardening & I/O       |
       |   Handle real data, be reliable  |
       +----------------------------------+
         |               |               |
         v               v               v
    +-----------+  +-----------+  +-----------+
    | Bulk      |  | Result    |  | Robust    |
    | Targets   |  | Caching   |  | Error     |
    | Input     |  | Layer     |  | Handling  |
    +-----------+  +-----------+  +-----------+
         |               |               |
         +---------------+---------------+
                       |
                       v
           +---------------------------+
           |   Phase 2: Enhanced       |
           |   Discovery               |
           |   Scale the provider layer|
           +---------------------------+
             |           |           |
             v           v           v
       +----------+ +----------+ +----------+
       | Censys   | | Local/   | | Provider |
       | & Shodan | | Private  | | Fallback |
       | Providers| | Datasets | | Logic    |
       +----------+ +----------+ +----------+
             |           |           |
             +-----------+-----------+
                       |
                       v
           +---------------------------+
           |   Phase 3: Operational    |
           |   Integration             |
           |   Connect to workflow     |
           +---------------------------+
             |           |           |
             v           v           v
       +----------+ +----------+ +------------------+
       | Active   | | Automation| | Desk Integration|
       | Probe    | | &         | | for Auto-       |
       | Module   | | Scheduling| | Fingerprint     |
       +----------+ +----------+ +------------------+
             |           |           |
             +-----------+-----------+
                       |
                       v
       +----------------------------------+
       |   Full Operational Scanner       |
       |   (Mature, Multi-Source Tool)    |
       +----------------------------------+
```

### System hardening and I/O scaling

The goal: turn the spike into something that can be pointed at thousands of targets and trusted to come back with answers, plugged into the operational data pipelines as it goes.

| Component  | Enhancement                                                                                                                                     | Rationale                                                                                                            |
|:-----------|:------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------|
| IO/Targets | Bulk Input: Support CIDR ranges (`192.168.0.0/24`), CSV files, and integrate with asset inventories.                                            | The spike's simple target list does not scale. Real-world scans are defined by network blocks and dynamic lists.     |
| Providers  | Result Caching: Implement a persistent cache (e.g., SQLite) for API responses. Key by `(provider, query, target)`.                              | Cuts API quota use on repeat scans, speeds things up, and allows offline analysis of past results.                   |
| Controller | Robust Error Handling: Implement retries with exponential backoff for transient API failures, comprehensive logging, and graceful degradation.  | The spike assumes a perfect API. Real operations want a scanner that is resilient and reports its failures clearly.  |
| IO/Output  | Structured Outputs: Extend JSONL output to support multiple formats (CSV for analysts, Syslog for SIEM integration, direct database insertion). | Results need to feed different parts of the pipeline: analyst review, alerting, asset management.                    |
| Engine     | Parallel Execution: Refactor the `planner.py` & provider calls to use async/threading, respecting per-provider rate limits.                     | Scanning 10,000 IPs one at a time is impractical. Parallelisation is what makes the performance bearable.            |

### Enhanced discovery and provider layer

The goal: more coverage and more resilience, by growing the provider layer beyond the first Netlas integration.

| Component      | Enhancement                                                                                                                                                | Rationale                                                                                                        |
|:---------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------------------------|
| Providers/     | Multi-Provider Support: Implement `censys.py` and `shodan.py` providers against the same `base.py` interface.                                              | Different datasets cover different ground. More sources, more chance of finding a target.                        |
| Providers/     | Private Dataset Provider: Create a provider that queries internal, passive data sources (e.g., internal network sensor logs, Zeek data).                   | The way into internal, non-routable networks that public APIs never see.                                         |
| Engine/Planner | Intelligent Query Planning: Enhance `planner.py` to generate the most efficient query for each provider (e.g., batching IPs, using bulk search endpoints). | Keeps API cost and time down.                                                                                    |
| Providers/Base | Provider Fallback & Blending Logic: Implement logic to try providers in sequence or blend results if a probe fails or returns empty.                       | One API outage or data gap stops being able to break a whole scan.                                               |

### Operational integration

The goal: fold the scanner into the full Desk → Forge → Scanner workflow, and add controlled active capabilities.

| Component        | Enhancement                                                                                                                                                                                                      | Rationale                                                                                                                                                 |
|:-----------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------|
| New Component    | Active Probe Provider Module: Create a new provider that, when configured and authorized, performs safe, minimal active probes (e.g., TCP SYN, basic HTTP GET). Key: It implements the same `base.py` interface. | For internal networks or targets with no passive data, a controlled active check is the only way in. Keeping it as a provider isolates the risk.          |
| Controller       | Automation & Scheduling: Package the scanner for scheduled runs (Docker image, systemd service). Integrate with workflow tools (Apache Airflow, Rundeck) for regular scanning jobs.                              | Continuous visibility wants a scanner that runs without someone holding its hand.                                                                          |
| Integration      | Obsidian Desk Integration: Build automation to consume a Desk's `Artefact List` and propose or generate a draft `fingerprint.yaml`.                                                                              | Closes the loop between analysis (Desk) and detection (Scanner), and takes most of the tedium out of fingerprint creation.                                |
| Engine/Evaluator | Confidence Scoring: Extend the `evaluator.py` and `evidence.py` model to output a confidence score (e.g., `HIGH` for 3/3 probes, `MEDIUM` for 1/1 unique probe) alongside the boolean match.                     | Helps operators prioritise. A `HIGH`-confidence match on a critical vulnerability is the one that jumps the queue.                                         |

## Non-goals

To keep scope from quietly expanding, these stay out of bounds for the foreseeable future:

* A graphical user interface. The tool is, and stays, a CLI/API-driven service.
* Real-time streaming analysis. The scanner works on defined target lists and schedules, not as a live packet engine.
* Exploitation or post-exploitation. The job is identification and fingerprinting; there are no payloads here, and there never will be.
* Stealth or evasion. The active probe module makes straightforward, identifiable requests. It is a diagnostic tool, not a penetration-testing one.

## Success metrics

The transition from spike to operational tool can be judged by:

1. Reliability: a scan of 10,000 targets over 24 hours that finishes without crashing and respects every API limit.
2. Coverage: targets found across multiple data sources (2+ public APIs, 1 internal).
3. Integration: outputs consumed by at least two other operational systems (SIEM, ticketing).
4. Speed: from `fingerprint.yaml` to first results in production in under an hour.

The roadmap leans on the spike architecture as a stable foundation, and the separation of concerns it already has. The path is incremental, de-risked, and pointed squarely at being useful.
