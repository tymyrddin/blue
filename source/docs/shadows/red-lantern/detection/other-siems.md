# Other SIEM platforms

## Translating detection patterns across platforms

The fundamental detection patterns for BGP attacks remain the same regardless of which SIEM you use. An anomalous 
prefix announcement is anomalous whether you detect it in Wazuh, Splunk, Elastic, Sentinel, or Chronicle. What 
changes is the syntax for expressing that detection logic.

This section provides starting points for implementing Red Lantern detection patterns in popular SIEM platforms. 
The Department cannot provide exhaustive coverage of every platform (budget reality meets best practice), but we 
offer enough to get you started. The patterns from the [generic detection section](generic.md) remain your foundation. 
These are implementation details.

If your platform is not covered here, use the generic patterns as a guide and consult your platform's documentation 
for syntax. The detection logic translates even if the query language looks completely different.

## Splunk detection

[Splunk](https://www.splunk.com/) uses SPL (Search Processing Language) for queries and detections. The simulator's 
JSON output works well with Splunk's JSON parsing capabilities.

Examples in [Red Lantern detection: Splunk](https://github.com/ninabarzh/red-lantern-detection/tree/main/splunk)

## Elastic Security rules

[Elastic Security](https://www.elastic.co/security) uses the Elastic Common Schema (ECS) and KQL (Kibana Query 
Language) or EQL (Event Query Language) for detection rules.

Examples in [Red Lantern detection: Elastic Security](https://github.com/ninabarzh/red-lantern-detection/tree/main/elastic)

## Microsoft Sentinel KQL queries

[Microsoft Sentinel](https://azure.microsoft.com/en-us/products/microsoft-sentinel/) uses KQL (Kusto Query Language) 
for detection rules. If you have Sentinel, you probably have Azure infrastructure, so integrating the simulator 
requires ingesting logs to Azure.

Examples in [Red Lantern detection: Microsoft Sentinel](https://github.com/ninabarzh/red-lantern-detection/tree/main/sentinel)

## Google Chronicle YARA-L rules

[Chronicle](https://chronicle.security/) uses YARA-L (YARA Language) for detection rules. YARA-L is designed for 
high-scale event correlation and threat hunting.

Examples in [Red Lantern detection: Google Chronicle](https://github.com/ninabarzh/red-lantern-detection/tree/main/chronicle)

## Platform selection considerations

Choosing a SIEM platform involves more than detection syntax. The Department of Silen Stability has operated multiple 
platforms and learnt that each has strengths and weaknesses.

### When to use Splunk

Strengths:
- Mature platform with extensive integrations
- Powerful search language (SPL)
- Strong enterprise support
- Excellent for complex investigations

Weaknesses:
- Expensive, particularly at scale
- Licensing based on data volume encourages log reduction
- Complexity requires dedicated expertise

Best for: Organisations with budget for commercial SIEM and need for mature tooling.

### When to use Elastic Security

Strengths:
- Open source with commercial support available
- Excellent visualisation with Kibana
- Strong machine learning capabilities
- Good community and ecosystem

Weaknesses:
- Requires infrastructure management
- Scaling can be complex
- Less mature than commercial alternatives

Best for: Organisations wanting open source with the option for commercial support, teams comfortable managing 
Elasticsearch clusters.

### When to use Microsoft Sentinel

Strengths:
- Native Azure integration
- No infrastructure to manage (SaaS)
- Good correlation with Microsoft security products
- Fusion ML for advanced threat detection

Weaknesses:
- Tightly coupled to Azure ecosystem
- KQL learning curve for non-Microsoft teams
- Costs can escalate with data volume

Best for: Organisations already using Azure, Microsoft-centric environments, teams wanting managed SIEM.

### When to use Chronicle

Strengths:
- Unlimited storage (flat pricing model)
- Built for scale (petabytes of logs)
- Fast search across long time periods
- Strong for threat hunting

Weaknesses:
- Less mature than alternatives
- Fewer integrations than established platforms
- YARA-L learning curve

Best for: Large organisations with massive log volumes, teams focused on threat hunting over real-time alerting.

### When to use Wazuh

Strengths:
- Free and open source
- Lightweight and efficient
- Good for host-based monitoring
- Active community

Weaknesses:
- Less feature-rich than commercial options
- Correlation capabilities more limited
- Smaller ecosystem of integrations

Best for: Budget-conscious organisations, teams wanting open source without commercial lock-in, host-centric security 
monitoring.

## Cross-platform detection strategy

The Department runs Wazuh for cost efficiency but acknowledges that larger organisations often operate multiple SIEM 
platforms. Some practical advice for multi-SIEM environments:

### Maintain platform-agnostic detection logic

[Write detection patterns in pseudocode](generic.md) or plain language first. Then implement in platform-specific 
syntax. This makes sure your detection logic is portable.

### Use common data models where possible

Map simulator output to common schemas (ECS for Elastic, CIM for Splunk, etc.). This makes rules more portable and 
reduces platform lock-in.

### Centralise rule development

Keep detection rules in Git regardless of platform. One repository for Wazuh rules, another for Splunk searches, 
another for Sentinel queries. Version control everything.

### Test across platforms when feasible

If budget allows, test critical detection rules on multiple platforms. Different SIEM engines sometimes catch 
different things. Redundancy in detection is not wasteful if it catches attacks that would otherwise succeed.

### Document platform differences

When a rule works differently on different platforms, document why. Future you will appreciate knowing that Splunk's 
transaction command behaves differently from Elastic's EQL sequences.

