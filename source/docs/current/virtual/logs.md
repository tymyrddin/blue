# Logs and telemetry

Within the CNA and vulnerability disclosure context, logs and telemetry are not just diagnostic outputs; they 
constitute the evidentiary foundation for analysis. The data backbone for analysis. 

From a systems engineering approach this data is a critical product of the infrastructure, meaning, ensuring it is 
collected, processed, and retained with the integrity and fidelity required for forensic investigation and 
reproducible analysis.

## Core purpose and functional requirements

The purpose of this subsystem is to provide an immutable record of system behaviour, which is paramount for:

*   Evidence capture & forensic analysis: To capture a definitive record of system events, error messages, authentication attempts, and network protocol activity. This record is essential for validating vulnerability reports, understanding root cause, and establishing a timeline of exploitation.
*   Anomaly detection & baselining: To enable the identification of deviations from normal system behaviour, which may indicate a misconfiguration, an active attack, or the presence of a previously unknown vulnerability. Telemetry data allows for the creation of performance and behavioural baselines.
*   Reproducibility: To provide the necessary data to reliably reproduce issues in a controlled test environment. Detailed logs are often the difference between a theoretical vulnerability and a verifiable, actionable one.

## System architecture and data flow

The logging architecture must be designed for reliability, scale, and security from the ground up.

*   Data generation layer: The source systems, which can include web servers, applications, network devices, and the test environments used to replicate vulnerabilities.
*   Data collection & forwarding layer: Agents and collectors (e.g., syslog-ng, Fluentd) deployed at the source that gather logs and forward them reliably to a centralised processing system, preventing data loss.
*   Data processing & normalisation layer: This stage parses raw, unstructured log data into a consistent, timestamped, and indexed format. This normalisation is critical for enabling effective correlation and analysis across diverse data sources.
*   Data storage & archival layer: A tiered storage strategy. Hot storage (fast, expensive) for recent data undergoing active analysis, and cold archival storage (slower, cheaper) for long-term retention to meet regulatory or investigative requirements.
*   Analysis & presentation layer: The interface (e.g., a SIEM) where analysts and engineers can query, correlate, and visualise the collected data.

## Key tooling considerations

A defence-in-depth approach to observability requires a suite of tools tailored to specific functions.

Security Information and Event Management (SIEM) Platforms:

*   Splunk: A powerful commercial platform for searching, monitoring, and analysing machine-generated big data, offering extensive visualisation and correlation capabilities.
*   ELK/OpenSearch Stack: A highly flexible open-source stack (Elasticsearch, Logstash, Kibana) that can be built into a full-featured SIEM for ingesting, storing, and visualising log data.
*   Wazuh: An open-source, platform-neutral security monitoring solution that integrates host-based intrusion detection (HIDS) with log analysis and SIEM functionalities.

Lightweight collectors and aggregators:

*   syslog-ng: A versatile and reliable log daemon that can collect logs from diverse sources, process them in real-time, and route them to various destinations.
*   Graylog: An open-source log management platform that specialises in centralised log collection, with strong capabilities for processing and alerting.
*   Fluentd: A robust open-source data collector designed for unifying logging layers, often used in cloud-native and containerised environments.

Device-specific logging tools:

*   Vendor-specific tools: Many embedded systems, networking appliances, and IoT devices provide their own proprietary logging mechanisms or diagnostic interfaces (e.g., Cisco IOS logs, ARM ITM traces). Integrating these data streams into the centralised SIEM is critical for full coverage, often requiring custom parsers or connectors.

## Operational best practices

The value of telemetry is entirely dependent on its quality, integrity, and availability.

*   Strict time synchronisation: Ensure all source systems and collectors are synchronised to a central time source using a protocol like NTP. Consistent timestamps are non-negotiable for accurate event correlation across disparate systems.
*   Secure archiving and immutability: Archive logs to a secure, write-once-read-many (WORM) storage system to prevent tampering or deletion. This preserves evidence for retrospective analysis, often required months or years after a vulnerability is disclosed.
*   Logical separation of environments: Maintain strict separation between logs generated in test/staging environments and those from production systems. This prevents contamination of datasets during analysis and mitigates the risk of accidental exposure of sensitive production data during vulnerability research.
*   Data minimisation and retention policies: Implement clear policies defining what data is collected and how long it is retained. Balance investigative needs with privacy regulations (like GDPR) by avoiding the collection of unnecessary personal data.
