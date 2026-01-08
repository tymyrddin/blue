# Threat modelling

Much like Lord Vetinari's approach to governing Ankh-Morpork—wherein one must understand all possible avenues of 
insurrection before they're attempted—threat modelling for BGP hijacking requires a methodical examination of how 
miscreants might abuse the routing infrastructure. As Commander Vimes would observe, "If you know what the villains 
are planning, you can be there with a nice cup of cocoa and some rather uncomfortable questions."

The Red Lanterns project employs a comprehensive threat modelling framework to extract actionable intelligence from 
[BGP simulator scenarios](https://github.com/ninabarzh/red-lantern-sim). Think of it as the City Watch's intelligence 
gathering operation, but for network infrastructure.

## Overview

Our threat modelling approach transforms BGP simulator scenarios into structured threat intelligence through four key 
activities:

1. Using scenarios as threat models - Extract structured threat data from simulator logs
2. Mapping MITRE ATT&CK techniques - Align scenarios with standard frameworks
3. Building attack trees - Visualise all possible attack paths
4. Identifying detection gaps - Reveal blind spots in monitoring

Each activity produces actionable outputs that feed into [detection engineering](../detection/index.rst), 
[incident response playbooks](../response/index.rst), and [purple team operations](../advanced/index.rst).

## Using scenarios as threat models

Rather than abstract theoretical exercises, our threat models are built from concrete BGP hijacking 
scenarios. These scenarios represent real-world attack patterns, documented with the same attention to 
detail that Sergeant Colon might apply to a particularly interesting crime scene (though with considerably 
more accuracy).

### Scenario structure

Each scenario is decomposed into structured threat events:

Attack Phases: Where in the kill chain does this event occur?

- Reconnaissance
- Initial Access
- Defence Evasion
- Impact
- Persistence

For each event:

- Technique: What method is the attacker employing?
- Indicators: What observable evidence does this event leave behind?
- Data Sources: What telemetry would reveal this activity?
- Mitigations: How might one prevent or hinder this technique?

### Example: Playbook 2 Credential compromise

Consider the credential compromise scenario: a sophisticated attacker uses stolen credentials to 
manipulate RPKI infrastructure:

```
Attack Goal: Manipulate RPKI infrastructure to legitimise future BGP hijacking
Threat Actor: Sophisticated attacker with stolen credentials, understands RPKI/BGP
Duration: 46 minutes
Attack Chain: initial_access → defence_evasion → impact → impact

Timeline:

[1] 00:01:00 - INITIAL ACCESS
- Technique: Valid Accounts: Cloud Accounts
- Description: Attacker accesses TACACS server using compromised credentials from Tor exit node
- Indicators:
  - Login from 185.220.101.45 (Tor exit node)
  - Account: admin@victim-network.net
  - Unusual geographic location
- Data Sources: Authentication logs, Network traffic, Access logs
- Mitigations:
  - Multi-factor authentication
  - Impossible travel detection
  - Tor exit node blocking for administrative access

[2] 00:02:00 - DEFENCE EVASION
- Technique: Use of Legitimate Infrastructure
- Description: Attacker uses legitimate ARIN portal to submit fraudulent ROA
- Indicators:
  - ROA creation request for 203.0.113.0/24
  - Origin AS64513 (not legitimate owner)
  - maxLength /25 allows sub-prefix hijacking
- Data Sources: RPKI repository logs, ROA creation audit logs
- Mitigations:
  - Out-of-band verification for ROA requests
  - Anomaly detection on ROA creation patterns
  - Secondary approval for critical prefixes

[3] 00:40:00 - IMPACT
- Technique: Resource Hijacking: BGP Route Manipulation
- Description: Fraudulent ROA published to ARIN repository
- Indicators:
  - ROA published in arin repository
  - 203.0.113.0/24 now claims AS64513 as valid origin
- Data Sources: RPKI repository monitoring, ROA publication feeds
- Mitigations:
  - ROA monitoring and alerting
  - Automated ROA validation against WHOIS/IRR

[4] 00:45:00 - IMPACT
- Technique: Network Denial of Service: Route Manipulation
- Description: Multiple validators accept fraudulent ROA, enabling widespread hijack
- Indicators:
  - routinator validator sync: valid
  - cloudflare validator sync: valid
  - ripe validator sync: valid
- Data Sources: Validator logs, RPKI validation status monitoring
- Mitigations:
  - Multi-source validation
  - Historical ROA comparison
  - Anomaly detection on validator consensus changes
```

### Detection opportunities

Each threat model identifies specific moments where detection was possible:

- Unusual login location (Tor exit node)
- ROA request from compromised account
- Sudden validator consensus change
- ROA creation without proper authorisation workflow
- maxLength modification for existing prefixes

These represent the places where, had the City Watch been properly vigilant, they might have stopped the crime in progress.

### Automated extraction

The [`threat_modeller.py`](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/threat-modelling/threat_modeller.py) tool automates scenario extraction:

```python
from threat_modeller import ScenarioThreatModelExtractor

extractor = ScenarioThreatModelExtractor()
scenario = extractor.extract_playbook2_scenario([])

# Generate human-readable report
report = extractor.generate_threat_model_report(scenario)
```

The tool supports three playbooks:

- Playbook 1: Opportunistic hijack of unprotected prefix
- Playbook 2: Credential compromise to ROA manipulation
- Playbook 3: Sub-prefix hijacking via RPKI validation

## Mapping MITRE ATT&CK techniques

The MITRE ATT&CK framework is rather like the Assassins' Guild's classification system for methods of dispatch—a formal taxonomy of techniques that adversaries employ. For BGP security, we map our scenarios to relevant ATT&CK techniques, creating a shared language for describing threats.

### BGP-specific technique mappings

| Technique ID | Technique Name                           | Tactic               | Detection Methods                                             |
|--------------|------------------------------------------|----------------------|---------------------------------------------------------------|
| T1078.004    | Valid Accounts: Cloud Accounts           | Initial Access       | Monitor anomalous account behaviour, Detect impossible travel |
| T1584.004    | Compromise Infrastructure: Server        | Resource Development | Monitor BGP announcements for unexpected ASNs                 |
| T1562.001    | Impair Defences: Disable or Modify Tools | Defence Evasion      | Monitor ROA creation/modification, Alert on RPKI changes      |
| T1557.002    | Man-in-the-Middle                        | Credential Access    | Monitor BGP route changes, Detect unexpected AS paths         |
| T1498.001    | Network Denial of Service                | Impact               | Monitor BGP update frequency, Detect route flapping           |

Each mapping includes:
- Detection Methods: Specific approaches for identifying the technique
- Data Sources: Required telemetry (authentication logs, BGP monitoring, RPKI logs)
- Scenario Examples: Which playbooks demonstrate this technique

### ATT&CK navigator visualisation

Generate [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) layer files to visualise technique coverage:

```python
from threat_modeller import MITREATTACKMapper

mapper = MITREATTACKMapper()
navigator_layer = mapper.generate_attack_navigator_layer(
    [scenario1, scenario2, scenario3],
    layer_name="BGP Hijacking Campaign Analysis"
)

# Save for import into Navigator
with open('bgp_attack_navigator.json', 'w') as f:
    json.dump(navigator_layer, f, indent=2)
```

Import the resulting JSON at [https://mitre-attack.github.io/attack-navigator/](https://mitre-attack.github.io/attack-navigator/) to visualise:
- Which techniques appear in multiple scenarios (higher severity)
- Coverage across different tactics
- Gaps in detection capabilities

### Detection coverage matrix

The mapper generates a detection matrix showing required capabilities for each technique:

```python
detection_matrix = mapper.generate_detection_matrix([scenario1, scenario2, scenario3])

# Shows for each technique:
# - Required detection methods
# - Required data sources
# - Number of scenarios demonstrating this technique
```

This matrix answers: "What detection capabilities do we need to catch these attacks?"

## Building attack trees from scenarios

Attack trees are hierarchical diagrams showing all possible paths an attacker might take to achieve their goal. Think of them as maps of all the ways one might break into the Patrician's Palace (though naturally, such maps are purely theoretical).

### Attack tree structure

Attack trees use four node types:

- Goal: The attacker's ultimate objective
- AND: All child nodes must be achieved
- OR: Any child node can be chosen
- Leaf: A specific action the attacker takes

Each node includes:

- Cost: Relative difficulty (0.0-10.0)
- Detectability: How easily detected (0.0 = invisible, 1.0 = obvious)
- Mitigations: Defensive measures
- Detection Methods: How to spot this activity

### Example: Playbook 2 attack tree

```
Root: Manipulate RPKI to Enable BGP Hijacking (GOAL)
  └─ Choose Attack Path (OR)
      ├─ Credential Compromise Path (AND) [Cost: 1.0, Detectability: 0.6]
      │   ├─ Obtain Valid Credentials (OR) [Cost: 2.0, Detectability: 0.3]
      │   │   ├─ Phishing Attack (LEAF) [Cost: 1.0, Detectability: 0.5]
      │   │   ├─ Credential Stuffing (LEAF) [Cost: 0.5, Detectability: 0.7]
      │   │   └─ Insider Threat (LEAF) [Cost: 5.0, Detectability: 0.2]
      │   ├─ Access via Anonymisation Network (LEAF) [Cost: 0.5, Detectability: 0.8]
      │   ├─ Submit Fraudulent ROA Request (LEAF) [Cost: 0.5, Detectability: 0.7]
      │   ├─ ROA Published to Repository (LEAF) [Cost: 0.0, Detectability: 0.6]
      │   └─ Validators Accept Fraudulent ROA (LEAF) [Cost: 0.0, Detectability: 0.5]
      └─ System Vulnerability Path (AND) [Cost: 3.0, Detectability: 0.4]
          ├─ Discover RIR System Vulnerability (LEAF) [Cost: 5.0, Detectability: 0.3]
          └─ Exploit Vulnerability (LEAF) [Cost: 2.0, Detectability: 0.6]
```

### Generating and visualising trees

```python
from threat_modeller import AttackTreeGenerator

tree_gen = AttackTreeGenerator()

# Build trees
playbook2_tree = tree_gen.build_playbook2_attack_tree()
playbook3_tree = tree_gen.build_playbook3_attack_tree()

# Export to JSON
tree_gen.export_attack_tree_json(playbook2_tree, 'playbook2_tree.json')

# Generate Graphviz DOT for visualisation
dot_content = tree_gen.generate_attack_tree_dot(playbook2_tree)
with open('playbook2_tree.dot', 'w') as f:
    f.write(dot_content)
```

Visualise with Graphviz:

```bash
dot -Tpng playbook2_tree.dot -o playbook2_tree.png
dot -Tsvg playbook2_tree.dot -o playbook2_tree.svg
```

### Attack path analysis

Analyse all possible paths to identify the easiest routes:

```python
analysis = tree_gen.analyse_attack_paths(playbook2_tree)

print(f"Total paths: {analysis['total_paths']}")
print(f"Easiest path cost: {analysis['easiest_path']['total_cost']}")
print(f"Hardest path cost: {analysis['hardest_path']['total_cost']}")
```

For Playbook 2:
- Total paths: 6 possible routes to achieve the goal
- Easiest path: Credential stuffing + Tor (Cost: 4.5)
- Hardest path: Insider threat route (Cost: 9.5)

This reveals that credential stuffing (using leaked passwords) combined with Tor anonymisation is the lowest-cost path for attackers.

### Defensive prioritisation

Attack trees inform defensive investment:

High-Cost, Low-Detectability Nodes: Attractive to sophisticated attackers but hard to spot (e.g., Insider Threat: Cost 5.0, Detectability 0.2). Invest in behavioural analytics and insider threat programmes.

Low-Cost, High-Detectability Nodes: Easy for attackers but also easy to detect (e.g., Access via Anonymisation Network: Cost 0.5, Detectability 0.8). Implement Tor exit node blocking—it's cheap and catches a common technique.

Critical AND Nodes: In Playbook 2, Credential Compromise Path is an AND node—attacker must complete ALL child steps. Defending any one child node breaks the entire path.

## Identifying detection gaps

The most valuable output from threat modelling is identifying where you're blind. Much like realising the Watch has no patrols on certain streets during certain hours, detection gap analysis reveals where attacks could proceed unobserved.

### Gap types

1. Missing Data Source
- Required telemetry isn't being collected
- Example: "Authentication logs not enabled on TACACS server"
- Severity: Depends on attack phase (critical for Initial Access/Impact)

2. No Detection Rule
- Data is collected but no alerting configured
- Example: "BGP monitoring enabled but no alerts on more-specific announcements"
- Severity: Medium to high (you have the data but aren't using it)

3. Blind Spot
- Complete absence of visibility
- Example: "No RPKI validator monitoring whatsoever"
- Severity: Critical (you're flying completely blind)

### Running gap analysis

Compare required capabilities against available ones:

```python
from threat_modeller import DetectionGapAnalyser

analyser = DetectionGapAnalyser()

# Configure your current capabilities
analyser.set_available_capabilities(
    data_sources=[
        'Authentication logs',
        'BGP monitoring',
        'Network traffic'
    ],
    detection_rules=[
        'suspicious_login',
        'bgp_announcement_monitor'
    ],
    monitored_systems=[
        'edge_routers',
        'tacacs_server'
    ]
)

# Analyse coverage
coverage = analyser.generate_coverage_report([scenario1, scenario2, scenario3])
print(f"Coverage: {coverage['coverage_percentage']:.1f}%")
```

### Example gap report

```
================================================================================
DETECTION GAP ANALYSIS REPORT
================================================================================

────────────────────────────────────────────────────────────────────────────────
CRITICAL SEVERITY GAPS (2)
────────────────────────────────────────────────────────────────────────────────

[1] Resource Hijacking: BGP Route Manipulation
    Type: missing_data_source
    Phase: impact
    Description: Missing data sources for detecting Resource Hijacking
    Affected Scenarios: Playbook 2: Credential Compromise to ROA Manipulation
    Required Data Sources:
      • RPKI repository monitoring
      • ROA publication feeds
      • Validator sync logs
    Recommended Actions:
      • Enable RPKI repository monitoring collection
      • Enable ROA publication feeds collection
      • Enable Validator sync logs collection

[2] Man-in-the-Middle: BGP Hijacking
    Type: blind_spot
    Phase: impact
    Description: Complete blind spot: no data collection or detection
    Affected Scenarios: Playbook 3: Sub-prefix Hijacking via RPKI Validation
    Required Data Sources:
      • Flow data
      • Traffic analysis
      • BGP best path selection
      • NetFlow/IPFIX
    Recommended Actions:
      • PRIORITY: Enable data sources immediately
      • Create detection rules
      • Implement compensating controls
```

### Coverage metrics

The analyser calculates:

- Total Techniques: Unique attack techniques across all scenarios
- Covered Techniques: Fully monitored with data sources AND detection rules
- Partially Covered: Data collected but no alerting
- Uncovered Techniques: No visibility whatsoever
- Coverage Percentage: Overall detection capability

### Prioritising remediation

Not all gaps are equally urgent. Prioritise based on:

1. Gap Severity: Critical > High > Medium > Low
2. Attack Phase: Initial Access and Impact phases are most critical
3. Scenario Frequency: Gaps affecting multiple scenarios are higher priority
4. Remediation Cost: Quick wins vs. major projects

Example prioritisation:

Priority 1 (Critical, Quick Win):

- Enable RPKI validator logs (already collected, just needs forwarding)
- Configure Tor exit node detection (authentication logs already available)

Priority 2 (Critical, Moderate Effort):

- Deploy BGP flow monitoring
- Implement ROA change alerting

Priority 3 (High, Major Project):

- Comprehensive RPKI repository monitoring
- Traffic pattern analysis with ML-based anomaly detection

## Practical workflow

Here's how threat modelling integrates into Red Lanterns operations:

### Extract threat models

```bash
cd red-lantern/threat-modelling
python threat_modeller.py
```

Outputs:
- `bgp_attack_navigator.json` - ATT&CK Navigator layer
- `playbook2_attack_tree.json` - Attack tree data
- `threat_model_report.json` - Comprehensive analysis

### Review ATT&CK coverage

1. Import `bgp_attack_navigator.json` into [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)
2. Review technique coverage
3. Identify high-frequency techniques (priority for detection)

### Analyse attack trees

```bash
dot -Tpng playbook2_attack_tree.dot -o playbook2_tree.png
```

Review to understand:

- Which paths are easiest for attackers
- Where detection would disrupt most paths
- Cost/detectability trade-offs

### Run gap analysis

Configure your environment and generate gap report:

```python
analyser = DetectionGapAnalyser()
analyser.set_available_capabilities(
    data_sources=['Authentication logs', 'BGP monitoring', ...],
    detection_rules=['suspicious_login_detection', ...],
    monitored_systems=['edge_routers', 'tacacs_servers', ...]
)

coverage = analyser.generate_coverage_report(scenarios)
gap_report = analyser.generate_gap_report(coverage['gaps'])
```

### Create remediation plan

Based on gap analysis:

Sprint 1: Quick Wins (1-2 weeks)

- Enable RPKI validator sync logging
- Configure Tor exit node detection
- Create alert for ROA maxLength changes

Sprint 2: Moderate Effort (2-4 weeks)

- Deploy BGP BMP feeds to SIEM
- Implement ROA publication change monitoring
- Configure alerts for more-specific prefix announcements

Sprint 3: Major Projects (1-3 months)

- Deploy NetFlow/IPFIX for traffic pattern analysis
- Implement geographic routing validation
- Develop ML-based anomaly detection for BGP

### Integrate with other activities

Threat models feed into:

- [Detection engineering](../detection/index.rst): Each gap becomes a detection rule work item
- [Incident response](../response/index.rst): Scenarios become response playbooks
- [Purple team](../advanced/index.rst): Context guide scenario building, integration, and exercises
- [Threat intelligence](../threat-intel/index.rst): ATT&CK layers shared with community

## Continuous improvement

Threat modelling isn't a one-time exercise:

1. Regular Reassessment: Run gap analysis quarterly or after major incidents
2. Scenario Updates: Add new playbooks as attack patterns evolve
3. Coverage Tracking: Monitor how coverage percentage improves over time
4. Detection Validation: Purple team exercises to verify detection actually works

## Tools and resources

Threat Modeller: [`threat_modeller.py`](https://github.com/ninabarzh/dept-silent-stability/blob/main/red-lantern/threat-modelling/threat_modeller.py)

Required Python Packages: None (pure Python 3.12)

External tools:

- [MITRE ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) - Visualise technique coverage
- [Graphviz](https://graphviz.org/) - Visualise attack trees

Further reading:

- [MITRE ATT&CK for ICS](https://attack.mitre.org/matrices/ics/)
- [Attack Trees](https://www.schneier.com/academic/archives/1999/12/attack_trees.html) - Bruce Schneier


As Lord Vetinari might observe, *"To defeat an enemy, one must first understand them completely. And then one must 
understand the twelve other ways they might attempt the same objective."* Our threat modelling framework provides 
exactly that level of understanding: revealing not just how attacks succeed, but how they might be prevented, 
detected, and disrupted.

A threat well understood is a threat half-defeated. Though in Ankh-Morpork, it's usually wise to have a backup plan 
involving a strategic withdrawal to a well-fortified position.
