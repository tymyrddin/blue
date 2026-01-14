# Roadmap

This document outlines the evolution path from the current architecture, a passive, API-driven scanner spike, to a full operational system. The architecture provides a solid foundation for incremental enhancement across all components.

## Principles for development
*   De-risk First: Each phase validates a core assumption before investing in scale.
*   Operational Reality: Features are prioritized based on real deployment needs.
*   Incremental Scaling: The architecture allows for modular upgrades without refactoring the entire system.

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

*Goal: Transform the spike into a reliable tool for running against thousands of targets, integrating seamlessly with operational data pipelines.*

| Component  | Enhancement                                                                                                                                     | Rationale                                                                                                            |
|:-----------|:------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------|
| IO/Targets | Bulk Input: Support CIDR ranges (`192.168.0.0/24`), CSV files, and integrate with asset inventories.                                            | The spike's simple target list doesn't scale. Real-world scans are defined by network blocks and dynamic lists.      |
| Providers  | Result Caching: Implement a persistent cache (e.g., SQLite) for API responses. Key by `(provider, query, target)`.                              | Dramatically reduces API quota usage for repeat scans, increases speed, and allows offline analysis of past results. |
| Controller | Robust Error Handling: Implement retries with exponential backoff for transient API failures, comprehensive logging, and graceful degradation.  | The spike assumes a perfect API. Real operations require the scanner to be resilient and report failures clearly.    |
| IO/Output  | Structured Outputs: Extend JSONL output to support multiple formats (CSV for analysts, Syslog for SIEM integration, direct database insertion). | Results must feed into different parts of the operational pipeline (analyst review, alerting, asset management).     |
| Engine     | Parallel Execution: Refactor the `planner.py` & provider calls to use async/threading, respecting per-provider rate limits.                     | Scanning 10,000 IPs sequentially is impractical. Parallelization is essential for performance.                       |

### Enhanced discovery & provider layer

*Goal: Increase discovery coverage and resilience by scaling the provider layer beyond the initial Netlas integration.*

| Component          | Enhancement                                                                                                                                                    | Rationale                                                                                                        |
|:-------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------------------------------------|
| Providers/     | Multi-Provider Support: Implement `censys.py` and `shodan.py` providers against the same `base.py` interface.                                              | Different datasets have different coverage. Using multiple sources increases the likelihood of finding a target. |
| Providers/     | Private Dataset Provider: Create a provider that queries internal, passive data sources (e.g., internal network sensor logs, Zeek data).                   | Critical for scanning internal, non-routable networks that public APIs cannot see.                               |
| Engine/Planner | Intelligent Query Planning: Enhance `planner.py` to generate the most efficient query for each provider (e.g., batching IPs, using bulk search endpoints). | Optimizes for API cost and speed.                                                                                |
| Providers/Base | Provider Fallback & Blending Logic: Implement logic to try providers in sequence or blend results if a probe fails or returns empty.                       | Ensures a single API outage or data gap doesn't break a scan. Increases reliability.                             |

### Operational integrationi
*Goal: Integrate the scanner into the full Desk → Forge → Scanner workflow and add controlled active capabilities.*

| Component            | Enhancement                                                                                                                                                                                                              | Rationale                                                                                                                                                 |
|:---------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------|
| New Component    | Active Probe Provider Module: Create a new provider that, when configured and authorized, performs safe, minimal active probes (e.g., TCP SYN, basic HTTP GET). Key: It implements the same `base.py` interface. | For internal networks or targets with no passive data, a controlled active check is necessary. Keeping it as a provider isolates the risk and complexity. |
| Controller       | Automation & Scheduling: Package the scanner for scheduled runs (Docker image, systemd service). Integrate with workflow tools (Apache Airflow, Rundeck) for regular scanning jobs.                                  | The scanner must run reliably without manual intervention to provide continuous visibility.                                                               |
| Integration      | Obsidian Desk Integration: Build automation to consume a Desk's `Artefact List` and propose or generate a draft `fingerprint.yaml`.                                                                                  | Closes the loop between analysis (Desk) and detection (Scanner), dramatically speeding up the fingerprint creation process.                               |
| Engine/Evaluator | Confidence Scoring: Extend the `evaluator.py` and `evidence.py` model to output a confidence score (e.g., `HIGH` for 3/3 probes, `MEDIUM` for 1/1 unique probe) alongside the boolean match.                         | Helps operators prioritize findings. A `HIGH` confidence match on a critical vulnerability is a P0 ticket.                                                |

## Non-goals
To prevent scope creep, the following are explicitly out of scope for the foreseeable future:
*   Graphical User Interface (GUI): The tool is and will remain a CLI/API-driven service.
*   Real-Time Streaming Analysis: The scanner operates on defined target lists and schedules, not as a live packet analysis engine.
*   Exploitation or Post-Exploitation: The scanner's purpose is identification and fingerprinting. It will never contain payloads or exploit code.
*   Stealth or Evasion Techniques: The active probe module will perform straightforward, identifiable requests. It is a diagnostic tool, not a penetration testing tool.

## Success metrics
The transition from spike to operational tool will be measured by:
1.  Reliability: Can run a scan of 10,000 targets over 24 hours without crashing, respecting all API limits.
2.  Coverage: Successfully identifies targets across multiple data sources (2+ public APIs, 1 internal source).
3.  Integration: Produces outputs consumed by at least two other operational systems (e.g., SIEM, ticketing system).
4.  Speed: From fingerprint definition (`fingerprint.yaml`) to first results in production is under 1 hour.

This roadmap uses the spike architecture as a stable foundation, detailing *what* to build next while respecting the clear separation of concerns you've already defined. The path is incremental, de-risked, and focused on operational utility.