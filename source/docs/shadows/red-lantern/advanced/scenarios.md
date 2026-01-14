# Custom Scenario Development: Financial Institution Example

Much like how the Patrician's intelligence network maps every street, alley, and rooftop in Ankh-Morpork to anticipate 
where trouble might arise, effective BGP defence requires scenarios tailored to your specific environment. This guide 
walks through the complete workflow of developing a custom scenario, using a financial institution payment 
infrastructure attack as a running example.

## The scenario development workflow

```
1. Identify Threat
   ↓
2. Map to Your Topology
   ↓
3. Define Attack Sequence
   ↓
4. Identify Telemetry Sources
   ↓
5. Create Scenario Script
   ↓
6. Validate in Lab
   ↓
7. Is it Realistic enough for demo or training? → No → Refine Scenario (back to step 3)
   ↓ Yes
8. Document Scenario
   ↓
9. Execute Exercise
   ↓
10. Gather Feedback
    ↓
11. Update Scenario (back to step 9)
```

The first three steps, before writing any code, establish the foundation. Get these right, and implementation becomes 
straightforward. Rush them, and you'll build scenarios that don't reflect reality.

## Step 1: Identify threat

Start by understanding who wants to attack you and why. Concrete intelligence 
about adversaries targeting your industry.

### Running example: Financial institution

Threat Context:

You're a regional bank providing retail banking services and payment processing. You've identified the following threat:

Threat Actor: APT-FinanceCrime (assumed nation-state backed financial crime group)

Motivation: Financial theft through transaction interception and manipulation

Sophistication: Advanced
- Custom malware for banking systems
- Understanding of banking protocols
- BGP hijacking capability demonstrated in previous campaigns
- Credential harvesting expertise

Known TTPs:
- BGP hijacking for man-in-the-middle attacks
- TLS interception of banking traffic
- Credential theft from intercepted sessions
- Payment manipulation during transit

Why Target You:
- Payment gateway processes £5M+ transactions per hour during business hours
- Customer base of 200,000 active online banking users
- API infrastructure handles real-time payment authorisation
- Recent expansion into international payments (new attack surface)

Previous Campaigns:
- Q4 2024: Targeted three regional banks in neighbouring countries
- Q2 2024: Attempted hijack of payment processor in your region (failed)
- Evidence suggests ongoing reconnaissance of financial sector networks

This isn't a generic threat. This is a specific adversary with demonstrated capability and clear motivation to target payment infrastructure like yours.

## Step 2: Map to your topology

Generic scenarios assume generic networks. Your network isn't generic. Map the threat from Step 1 to YOUR actual infrastructure.

### Running Example: Regional Bank Network

Network Topology:

```
Critical Prefixes:
├── 198.51.100.0/24 - Payment Gateway API
│   ├── Customer impact: 50,000 active users
│   ├── Revenue impact: £5M transactions/hour
│   ├── ROA: AS64512, maxLength /24 CORRECTLY CONFIGURED
│   └── Priority: CRITICAL
│
├── 203.0.113.0/24 - Customer Portal & Mobile Backend
│   ├── Customer impact: 200,000 active users
│   ├── Revenue impact: Indirect (customer access)
│   ├── ROA: AS64512, maxLength /25 ⚠️ VULNERABLE TO SUB-PREFIX
│   └── Priority: CRITICAL
│
└── 192.0.2.0/24 - Internal Management Network
    ├── Customer impact: None (internal only)
    ├── Revenue impact: Operational continuity
    ├── ROA: NONE ⚠️ NO PROTECTION
    └── Priority: HIGH

BGP Relationships:
├── Upstream Providers
│   ├── AS1299 (Telia) - London connection
│   └── AS3356 (Level3) - Amsterdam connection
│
└── Peering
    ├── AS6939 (Hurricane Electric) - LINX
    └── AS20940 (Akamai) - Direct peering for CDN
```

Security Controls Audit:

Authentication:
- MFA required for BGP management portal
- Privileged Access Management for network changes
- ⚠️ Geographic restrictions exist but can be bypassed
- ⚠️ RIR portal credentials separate (different MFA)

Monitoring:
- Commercial BGP monitoring service (alerts on prefix changes)
- RPKI validation monitoring (Routinator + Cloudflare validator)
- NetFlow collection on all edge routers
- ⚠️ No ROA change monitoring configured
- ⚠️ No correlation between BGP changes and change management tickets

Vulnerability Assessment:

The most significant finding: 203.0.113.0/24 has ROA with maxLength /25

This means an attacker could:
1. Announce 203.0.113.128/25 (more specific)
2. Pass RPKI validation (covered by our ROA's maxLength)
3. Hijack half the customer portal traffic

This vulnerability, combined with the threat actor's demonstrated capability, creates a realistic attack scenario.

The permissive maxLength is not theoretical. It is configuration, and the threat actor from Step 1 knows how to exploit it.

## Step 3: Define attack sequence

Now translate the threat and topology into a concrete attack timeline. This is still conceptual: Planning what 
happens and when, not yet how to implement it.

### Running Example: Payment infrastructure hijack

Attack Goal:

Intercept payment gateway API traffic to capture customer credentials and transaction data during high-volume trading hours (10:00-14:00 GMT).

Success Criteria (Attacker Perspective):
- Fraudulent ROA published and stable for 48+ hours
- More-specific prefix announced during target window
- Traffic intercepted for 30+ minutes minimum
- 100+ API credentials captured
- No defensive response during capture window

Attack Sequence:

```
PHASE 1: RECONNAISSANCE (T-48 hours before attack)
├── Map payment infrastructure prefixes via BGP route collectors
├── Identify RPKI configuration (ROA status, maxLength)
├── Check for ROA gaps using RPKI validators
├── Identify network personnel via OSINT (LinkedIn, company website)
└── Detection Risk: LOW (public data, routine queries)

PHASE 2: INITIAL ACCESS (T-2 hours)
├── T-02:00 - Spear phishing email to network engineer
│   ├── Method: Fake vendor security alert
│   ├── Payload: Credential harvester (cloned RIR portal)
│   └── Detection Risk: MEDIUM (email security, user awareness)
│
├── T-01:45 - MFA bypass via real-time phishing proxy
│   ├── Method: Evilginx2 or similar
│   └── Detection Risk: HIGH (impossible travel, IP geolocation)
│
└── T-01:30 - Valid session established to RIR portal
    └── Detection Risk: HIGH (privileged access from unusual location)

PHASE 3: DEFENCE EVASION (T-01:30 to T+00:00)
├── T-01:30 - Access RIR portal with harvested credentials
│   └── Detection: PAM logs show access from unusual IP
│
├── T-01:00 - Modify existing ROA for 203.0.113.0/24
│   ├── Change: maxLength /24 → /25 (enable sub-prefix)
│   ├── Justification: "Bulk ROA update for load balancing"
│   └── Detection: ROA change monitoring (if configured)
│
└── T+00:00 - ROA modification published (30-40 min publication cycle)
    └── Detection: RPKI repository webhook, validator sync alerts

PHASE 4: EXECUTION (T+00:30 - Attack Day 11:00)
├── T+00:30 - Announce 203.0.113.128/25 from attacker AS
│   ├── More specific than legitimate /24
│   ├── Passes RPKI validation (covered by modified ROA)
│   └── Detection: BGP monitoring, AS path anomalies
│
├── T+00:31 - Traffic begins routing to attacker infrastructure
│   ├── Transparent proxy established
│   ├── TLS interception with cloned certificates
│   └── Detection: Latency increase, CT log monitoring
│
└── T+01:00 - Sustained traffic interception
    ├── API credentials captured
    ├── Transaction data logged
    └── Detection: Customer complaints, APM alerts

PHASE 5: IMPACT (T+01:00 onwards)
├── 50,000 customers affected (half of customer portal traffic)
├── API authentication compromised
├── Transaction data exposure
├── Estimated 30-120 minutes before detection and response
└── Business Impact: £2.5M-£15M (fraud, liability, fines, reputation)
```

Realistic Timing Considerations:

- ROA Publication Delay: 30-60 minutes typical for ARIN
- Validator Propagation: Additional 5-10 minutes for global validators
- BGP Convergence: 30-90 seconds for most peers to adopt route
- Detection Window: If no ROA monitoring: potentially hours
- Response Time: Emergency BGP session shutdown: 10-30 minutes

Technical Prerequisites:

- Attacker controls or compromises AS64999 (for announcements)
- Has BGP peering relationships (transit provider or IXP)
- Capability to intercept TLS traffic (certificate cloning)
- Infrastructure to handle redirected traffic volume

Detection Opportunities:

1. Email Security: Phishing email detected and quarantined (MEDIUM likelihood)
2. Authentication Anomaly: Login from Tor exit node/unusual country (HIGH likelihood)
3. ROA Change Alert: Modified ROA detected within 5 minutes (HIGH likelihood if monitoring configured)
4. BGP Announcement: More-specific prefix detected within 60 seconds (HIGH likelihood)
5. AS Path Anomaly: Unexpected AS in path (HIGH likelihood with proper monitoring)
6. Application Latency: API response time increases (MEDIUM likelihood)
7. Certificate Transparency: Unauthorised cert issuance attempt (HIGH likelihood if monitored)

The attack is sophisticated but has multiple detection points. The question is whether YOUR organisation has monitoring at those points and can respond fast enough.

## Extending Red Lantern for financial institution scenarios

Now we translate the work from Steps 1-3 into the Red Lantern simulator. The simulator has three key components that 
implement your scenario:

1. Scenario YAML (`scenario.yaml`) - Defines WHAT happens and WHEN
2. Telemetry Generator (`telemetry.py`) - Defines HOW events are represented
3. Output Adapters - Transform events into realistic log formats

### Understanding the Red Lantern architecture

Red Lantern separates concerns cleanly:

```
Scenario Timeline (YAML)
    ↓
Timeline Events → Event Bus
    ↓
Telemetry Generators subscribe to events
    ↓
Generate structured events → Event Bus
    ↓
Output Adapters transform events
    ↓
Semi-Realistic log lines (syslog, BMP, RPKI, etc.)
```

The scenario YAML is timeline only. It doesn't know about logs or output formats. The telemetry generator maps 
timeline actions to appropriate telemetry sources (BGP updates, RPKI logs, authentication events). The output 
adapters handle formatting.

### Step 4: Identify Telemetry Sources

Before writing code, identify what logs/telemetry your attack would generate in reality.

For our financial institution scenario:

| Attack Phase          | Telemetry Source                   | Event Type              | Visibility        |
|-----------------------|------------------------------------|-------------------------|-------------------|
| Reconnaissance        | BGP route collectors               | Prefix queries          | Low (public data) |
| Phishing email        | Email gateway                      | Phishing detection      | Medium-High       |
| Credential harvesting | Web proxy                          | Suspicious URL visit    | High              |
| RIR portal login      | Authentication logs                | Login from unusual IP   | High              |
| ROA modification      | RIR portal logs                    | ROA change request      | High              |
| ROA publication       | RPKI repository                    | ROA published event     | High              |
| Validator sync        | RPKI validators                    | Validation state change | High              |
| BGP announcement      | BMP (BGP Monitoring Protocol)      | Route update            | High              |
| Traffic redirection   | NetFlow/IPFIX                      | AS path changes         | Medium            |
| API latency           | Application Performance Monitoring | Response time increase  | High              |

Available Red Lantern Components:

Looking at the simulator structure:

```
# Reusable telemetry generators in telemetry/generators/
BMPTelemetryGenerator      # BGP announcements, withdrawals
RouterSyslogGenerator      # Router log messages
LatencyMetricsGenerator    # Application performance metrics

# Output adapters in simulator/output/
BMPAdapter                 # Formats BMP events as log lines
RouterAdapter              # Formats router syslogs
RPKIAdapter                # Formats RPKI validation events
TacacsAdapter              # Formats authentication events
CMDBAdapter                # Formats change management events
```

Mapping needs:

- BGP announcements → `BMPTelemetryGenerator` + `BMPAdapter`
- Router logs → `RouterSyslogGenerator` + `RouterAdapter`
- RPKI events → Publish `rpki.*` events → `RPKIAdapter`
- Authentication → Publish `access.login` events → `TacacsAdapter`
- Latency → `LatencyMetricsGenerator` (available but we'll keep it simple for now)

What's missing (Would need custom implementation):

- Email gateway logs (phishing detection)
- Web proxy logs (credential harvester visits)
- Certificate Transparency monitoring

For this scenario, we'll focus on the core telemetry that Red Lantern already supports: BGP, RPKI, authentication, and router events.

### Step 5: Create scenario script

Now we implement the scenario in Red Lantern format.

File structure:

```
simulator/scenarios/advanced/financial_payment_hijack/
├── README.md              # Attack description (from Steps 1-3)
├── scenario.yaml          # Timeline
└── telemetry.py           # Event generator
```

#### The scenario YAML

The scenario YAML defines your timeline from Step 3. Each entry has:
- `t`: timestamp (seconds from scenario start)
- `action`: what happens (you define these names)
- Additional fields: attack-specific data (prefix, AS numbers, etc.)
- `attack_step`: phase identifier (for correlation)
- `note`: human-readable explanation

The YAML is purely declarative. It says "at T=120, fraudulent ROA request happens" but doesn't say how that appears 
in logs. That is the telemetry generator's job.

Example excerpt showing the structure:

```yaml
id: financial_payment_hijack
name: "Financial Payment Infrastructure Hijack"
description: |
  Sophisticated attack targeting payment gateway infrastructure using
  BGP hijacking and RPKI manipulation. Demonstrates sub-prefix exploitation
  with permissive maxLength ROA configuration.

timeline:
  # === PHASE 1: RECONNAISSANCE ===
  - t: 0
    action: reconnaissance_start
    target_prefix: "203.0.113.0/24"
    attack_step: "reconnaissance"
    note: "Attacker begins mapping payment infrastructure"

  # === PHASE 2: INITIAL ACCESS ===
  - t: 7200  # T-2 hours (in seconds before attack)
    action: phishing_email_sent
    target: "network.admin@yourbank.example"
    attack_step: "initial_access"
    note: "Spear phishing: fake vendor security alert"

  - t: 7800  # T-1h50m
    action: credential_compromise
    user: "network.admin@yourbank.example"
    source_ip: "185.220.101.45"  # Tor exit node
    attack_step: "initial_access"
    note: "Credentials harvested via phishing proxy"

  # === PHASE 3: DEFENCE EVASION ===
  - t: 8400  # T-1h30m
    action: rir_portal_access
    user: "network.admin@yourbank.example"
    source_ip: "185.220.101.45"
    system: "arin_portal"
    attack_step: "defence_evasion"
    note: "Compromised credentials used to access RIR portal"

  - t: 9000  # T-1h15m
    action: roa_modification_request
    prefix: "203.0.113.0/24"
    origin_as: 64512
    old_max_length: 24
    new_max_length: 25
    justification: "Load balancing infrastructure expansion"
    attack_step: "defence_evasion"
    note: "CRITICAL: Modify ROA to permit sub-prefix announcements"

  - t: 10800  # T-30m (ROA publication delay)
    action: fraudulent_roa_published
    prefix: "203.0.113.0/24"
    origin_as: 64512
    max_length: 25
    trust_anchor: "arin"
    attack_step: "defence_evasion"
    note: "Modified ROA published to RPKI repository"

  # === PHASE 4: EXECUTION ===
  - t: 11400  # Attack day, 11:00 (high volume trading)
    action: hijack_announcement
    prefix: "203.0.113.128/25"  # More specific than legitimate /24
    origin_as: 64999  # Attacker ASN
    as_path: [1299, 64999]
    rpki_state: "valid"  # Passes validation due to modified ROA
    attack_step: "execution"
    note: "Announce more-specific prefix during high-volume hours"

  - t: 11460  # T+1 minute
    action: traffic_interception_start
    prefix: "203.0.113.128/25"
    affected_customers: 50000
    attack_step: "execution"
    note: "Traffic begins routing to attacker infrastructure"

  # === PHASE 5: IMPACT ===
  - t: 13200  # T+30 minutes sustained
    action: impact_assessment
    credentials_captured: 100
    transactions_exposed: 500
    estimated_loss: "£2.5M-£15M"
    attack_step: "impact"
    note: "Sustained interception - significant business impact"

  - t: 14400  # End marker
    type: end_marker
```

Scenario design notes:

- Timestamps are in seconds from scenario start (not wall-clock time)
- Realistic timing: ROA publication delays, BGP convergence
- Explicit attack phases for clear progression
- Business impact included for context
- Detection opportunities implicit (authentication anomaly, ROA change, BGP announcement)

Automation note: We could write Python scripts to generate timeline entries from Step 3 attack sequences, 
but start with manual YAML to understand the structure.

#### The Telemetry Generator

The `telemetry.py` file maps timeline actions to appropriate log events. It imports reusable generators and publishes 
structured events to the event bus.

Structure:

```python
"""
Telemetry mapping for Financial Payment Infrastructure Hijack.

Maps attack timeline to realistic telemetry sources:
- Authentication events (RIR portal access)
- RPKI events (ROA modification, publication, validation)
- BGP events (prefix announcements)
- Router logs
"""

from typing import Any
from simulator.engine.event_bus import EventBus
from simulator.engine.clock import SimulationClock
from telemetry.generators.bmp_telemetry import BMPTelemetryGenerator
from telemetry.generators.router_syslog import RouterSyslogGenerator


def register(event_bus: EventBus, clock: SimulationClock, scenario_name: str) -> None:
    """Register telemetry generators for this scenario."""

    # Initialize generators
    bmp_gen = BMPTelemetryGenerator(
        scenario_id=scenario_name,
        scenario_name="Financial Payment Infrastructure Hijack",
        clock=clock,
        event_bus=event_bus
    )

    syslog_gen = RouterSyslogGenerator(
        clock=clock,
        event_bus=event_bus,
        router_name="edge-router-01",
        scenario_name=scenario_name
    )

    def on_timeline_event(event: dict[str, Any]) -> None:
        """Map scenario timeline events to telemetry."""
        entry = event.get("entry")
        if not entry:
            return

        action = entry.get("action")
        attack_step = entry.get("attack_step", "unknown")
        incident_id = f"{scenario_name}-{attack_step}"

        # === PHASE 2: INITIAL ACCESS ===

        if action == "credential_compromise":
            # Authentication event showing suspicious login
            event_bus.publish({
                "event_type": "access.login",
                "timestamp": clock.now(),
                "source": {"feed": "auth-system", "observer": "rir-portal"},
                "attributes": {
                    "user": entry.get("user"),
                    "source_ip": entry.get("source_ip"),
                    "system": "rir_portal",
                    "suspicious": True,
                    "reason": "tor_exit_node"
                },
                "scenario": {
                    "name": scenario_name,
                    "attack_step": attack_step,
                    "incident_id": incident_id
                }
            })

        # === PHASE 3: DEFENCE EVASION ===

        elif action == "roa_modification_request":
            # RPKI event: ROA modification request
            event_bus.publish({
                "event_type": "rpki.roa_creation",
                "timestamp": clock.now(),
                "source": {"feed": "rir-portal", "observer": "ARIN"},
                "attributes": {
                    "prefix": entry.get("prefix"),
                    "origin_as": entry.get("origin_as"),
                    "max_length": entry.get("new_max_length"),
                    "previous_max_length": entry.get("old_max_length"),
                    "registry": "ARIN",
                    "justification": entry.get("justification")
                },
                "scenario": {
                    "name": scenario_name,
                    "attack_step": attack_step,
                    "incident_id": incident_id
                }
            })

            # Also log to router syslog
            syslog_gen.emit(
                message=f"ROA modification: {entry.get('prefix')} maxLength changed from /{entry.get('old_max_length')} to /{entry.get('new_max_length')}",
                severity="warning",
                subsystem="rpki",
                scenario={
                    "name": scenario_name,
                    "attack_step": attack_step,
                    "incident_id": incident_id
                }
            )

        elif action == "fraudulent_roa_published":
            # RPKI repository publication event
            event_bus.publish({
                "event_type": "rpki.roa_published",
                "timestamp": clock.now(),
                "source": {"feed": "rpki-repository", "observer": entry.get("trust_anchor")},
                "attributes": {
                    "prefix": entry.get("prefix"),
                    "origin_as": entry.get("origin_as"),
                    "max_length": entry.get("max_length"),
                    "trust_anchor": entry.get("trust_anchor"),
                    "fraudulent": True
                },
                "scenario": {
                    "name": scenario_name,
                    "attack_step": attack_step,
                    "incident_id": incident_id
                }
            })

        # === PHASE 4: EXECUTION ===

        elif action == "hijack_announcement":
            # BGP announcement via BMP
            bmp_event = {
                "prefix": entry.get("prefix"),
                "as_path": entry.get("as_path"),
                "origin_as": entry.get("origin_as"),
                "next_hop": "198.51.100.254",
                "peer_ip": "198.51.100.1",
                "peer_as": 65001,
                "peer_bgp_id": "198.51.100.1",
                "rpki_state": entry.get("rpki_state"),
                "scenario": {
                    "name": scenario_name,
                    "attack_step": attack_step,
                    "incident_id": incident_id
                }
            }
            bmp_gen.generate(bmp_event)

            # Router syslog showing the announcement
            syslog_gen.emit(
                message=f"BGP: Received more-specific prefix {entry.get('prefix')} from AS{entry.get('origin_as')} - RPKI {entry.get('rpki_state')}",
                severity="notice",
                subsystem="bgp",
                scenario={
                    "name": scenario_name,
                    "attack_step": attack_step,
                    "incident_id": incident_id
                }
            )

    # Subscribe to timeline events
    event_bus.subscribe(on_timeline_event)
```

Patterns:

1. Import reusable generators (BMP, RouterSyslog) - don't reinvent
2. Publish structured events to the event bus with consistent schema
3. Use appropriate event types (`rpki.roa_creation`, `access.login`, `bmp_route_monitoring`)
4. Include scenario metadata in every event (for correlation)
5. Map multiple telemetry sources for a single action (ROA change generates both RPKI event and syslog)

Do not format syslog lines in telemetry.py. That is the adapter's job. Telemetry publishes structured events; 
adapters handle formatting.

### Step 6: Validate in lab

Run the scenario and verify the output:

```bash
# Basic run
python -m simulator.cli \
  simulator/scenarios/advanced/financial_payment_hijack/scenario.yaml

# With background noise for realism
python -m simulator.cli \
  --background \
  --bgp-noise-rate 0.5 \
  --cmdb-noise-rate 0.1 \
  simulator/scenarios/advanced/financial_payment_hijack/scenario.yaml

# Training mode (shows scenario: debug lines)
python -m simulator.cli \
  --mode training \
  simulator/scenarios/advanced/financial_payment_hijack/scenario.yaml
```

Expected output: The output adapters will transform your structured events into realistic logs:

```
<13>Jan 08 07:30:00 edge-router-01 ACCESS: Login network.admin@yourbank.example from 185.220.101.45 [SUSPICIOUS: tor_exit_node]
<22>Jan 08 08:45:00 arin-portal RPKI: ROA modification request prefix 203.0.113.0/24 maxLength /24→/25
<30>Jan 08 09:15:00 rpki-repository RPKI: ROA published prefix 203.0.113.0/24 origin AS64512 maxLength /25
BMP ROUTE: prefix 203.0.113.128/25 AS_PATH [1299, 64999] NEXT_HOP 198.51.100.254 ORIGIN_AS 64999
<13>Jan 08 11:00:00 edge-router-01 BGP: Received more-specific prefix 203.0.113.128/25 from AS64999 - RPKI valid
```

Validation checklist:

- Timeline progresses logically
- Timestamps realistic (ROA delays, BGP convergence)
- Event types appropriate (RPKI for validation, BMP for BGP)
- Severity levels correct
- Scenario metadata present in all events
- Detection opportunities visible in logs

### Step 7: Refine for realism

Review the output with network operations team and security analysts:

Questions to ask:

- Would our BGP monitoring actually see this?
- Are the log formats accurate for our infrastructure?
- Is the timeline realistic given our network?
- Would our SIEM rules detect this?
- Are detection opportunities clear enough for training?

Common refinements:

- Adjust timing (ROA publication delays vary by RIR)
- Add missing telemetry sources (e.g., customer complaints, APM alerts)
- Refine AS paths to match your actual peering relationships
- Adjust severity levels based on your operational priorities
- Add more granular attack steps for training clarity

Iterate on Step 3 (Attack Sequence) based on feedback, then update the scenario YAML and telemetry.py accordingly.

## Step 8: Document scenario

Create a comprehensive README in your scenario directory explaining the attack for future users (including future you):

```
# Financial Payment Infrastructure Hijack

## Threat context

Adversary: APT-FinanceCrime (nation-state backed)
Target: Payment gateway infrastructure (203.0.113.0/24)
Objective: Intercept API traffic to steal credentials and transaction data

## Prerequisites

This attack requires:
- Compromised RIR portal credentials (obtained via phishing)
- Attacker-controlled ASN (AS64999)
- BGP peering relationships (transit or IXP)
- TLS interception capability

## Vulnerability exploited

ROA Configuration Weakness:
- Prefix: 203.0.113.0/24
- ROA: AS64512, maxLength /25
- Vulnerability: Permissive maxLength allows sub-prefix hijacking

An attacker can announce 203.0.113.128/25 and pass RPKI validation.

## Attack phases

1. Reconnaissance - Map network topology and RPKI configuration
2. Initial Access - Credential compromise via phishing
3. Defence Evasion - Modify ROA to enable sub-prefix attack
4. Execution - Announce more-specific prefix during high-volume hours
5. Impact - Intercept traffic, capture credentials

## Detection opportunities

| Phase           | Detection Method         | Likelihood | Data Source         |
|-----------------|--------------------------|------------|---------------------|
| Initial Access  | Phishing email detection | Medium     | Email gateway       |
| Initial Access  | Impossible travel        | High       | Authentication logs |
| Defence Evasion | ROA change alert         | High       | RPKI monitoring     |
| Execution       | BGP announcement         | High       | BMP feed            |
| Execution       | AS path anomaly          | High       | BGP monitoring      |
| Impact          | Latency increase         | Medium     | APM                 |

## Business Impact

Affected: 50,000 customers (half of customer portal traffic)

Financial Impact:
- Direct fraud losses: £1M-£5M
- Regulatory fines: £500K-£2M
- Reputation damage: £500K-£3M
- Total estimated: £2.5M-£15M

## Usage

```bash
# Run scenario
python -m simulator.cli \
  simulator/scenarios/advanced/financial_payment_hijack/scenario.yaml

# With background noise
python -m simulator.cli \
  --background \
  simulator/scenarios/advanced/financial_payment_hijack/scenario.yaml

## Expected telemetry

- Authentication events (suspicious RIR portal login)
- RPKI events (ROA modification, publication)
- BMP route monitoring (hijack announcement)
- Router syslogs (BGP session changes)
```

## Step 9: Execute exercise

Run the scenario with your security team:

For Blue team training:

```bash
# Run in practice mode (realistic logs only)
python -m simulator.cli \
  --mode practice \
  --output json \
  --json-file exercise_output.json \
  simulator/scenarios/advanced/financial_payment_hijack/scenario.yaml
```

Feed the JSON output to your SIEM (Wazuh, Splunk, etc.) and have analysts:

1. Detect the attack phases
2. Correlate events across telemetry sources
3. Assess business impact
4. Recommend response actions

For Purple Team exercises:

```bash
# Training mode shows attack progression
python -m simulator.cli \
  --mode training \
  --background \
  simulator/scenarios/advanced/financial_payment_hijack/scenario.yaml
```

Red team explains the attack while blue team identifies detection opportunities in the logs.

Evaluation criteria:

- How quickly was each phase detected?
- Were all telemetry sources correlated correctly?
- Did analysts identify the root cause (permissive maxLength)?
- What response actions were recommended?
- Were false positives from background noise handled appropriately?

## Step 10: Gather feedback

After the exercise, collect feedback:

From analysts:

- Was the timeline realistic?
- Were detection opportunities clear?
- Did events correlate as expected?
- What additional telemetry would help?

From network operations:

- Do log formats match your actual infrastructure?
- Are BGP behaviours accurate?
- Would your routers generate these logs?
- Are timing delays realistic?

From management:

- Does business impact align with risk assessments?
- Are response recommendations actionable?
- Should we prioritise fixing the maxLength vulnerability?

## Step 11: Update scenario

Common improvements:

1. Add missing telemetry sources
   - Customer complaints (service desk tickets)
   - Certificate transparency log monitoring
   - Geographic routing validation

2. Refine detection opportunities
   - Add correlation logic examples
   - Include false positive scenarios
   - Document detection thresholds

3. Expand attack variations
   - Different attack timing (off-hours vs peak)
   - Multiple prefix targets simultaneously
   - Insider threat variation (no credential compromise)

4. Improve business impact modelling
   - More granular financial impact estimates
   - Regulatory compliance implications
   - Customer communication requirements

Update cycle: Review and refine regularly, or after significant network changes (new prefixes, changed peering 
relationships, updated RPKI configuration).

## Automation opportunities

Throughout this workflow, certain tasks can be automated:

Step 2 (Topology mapping):

- Query your RPKI validator APIs to get current ROA configurations
- Use BGP route collectors to verify peering relationships
- Scan RIR WHOIS databases for prefix ownership

Step 3 (Attack Sequence):

- Generate timeline YAML from structured attack descriptions
- Calculate realistic timing based on RIR publication delays
- Validate timeline consistency (no events before prerequisites)

Step 5 (Scenario Creation):

- Template generators for common attack patterns
- Linting tools to validate YAML schema
- Test harnesses to verify telemetry generation

Step 9 (Exercise Execution):

- Automated SIEM ingestion
- Detection rule validation
- Metrics collection (time to detect, correlation accuracy)

However, start manual. Understand the workflow deeply before automating. Automation without understanding creates 
brittle, unrealistic scenarios.

## Conclusions

The workflow matters more than the code:

- Steps 1-3 (Threat, Topology, Attack sequence) are the foundation
- Poor threat modelling → irrelevant scenarios
- Missing topology details → unrealistic attacks
- Vague attack sequences → confusing exercises

Red Lantern separates concerns cleanly:

- YAML: What happens and when (timeline)
- Telemetry.py: How events are represented (structured data)
- Adapters: How events are formatted (realistic logs)

Realism requires iteration:

- First version will have timing wrong
- Second version will miss telemetry sources
- Third version might be too complex
- Keep refining based on operational feedback

Scenarios are living documents:

- Networks change (new prefixes, different peers)
- Threats evolve (new TTPs, different actors)
- Monitoring improves (new detection capabilities)
- Update scenarios to reflect reality

Custom scenario development transforms abstract BGP hijacking concepts into concrete, testable exercises that reveal 
gaps in defences. As Lord Vetinari might observe, "One must know one's own weaknesses before one's enemies do."

The Red Lantern simulator provides the technical framework, but the real work is understanding a threat landscape, 
mapping its topology, and designing realistic attack sequences. Get those three steps right, and the implementation 
becomes straightforward.

A generic scenario protects against generic threats. A custom scenario protects against threats targeting an 
organisation specifically. Though in Ankh-Morpork, it's usually wise to have plans for both.

## References and resources

## Red Lantern pages

- [Threat Modelling](../threat-intel/index.rst) - Extract threat models from scenarios
- [Detection Engineering](../detection/index.rst) - Create detection rules from scenarios
- [Collaborative Testing](testing.md) - Purple team exercises
- [Incident Response](../response/index.rst) - Build response playbooks

## Red Lantern simulator resources

Scenario examples:

- [simulator/scenarios/easy/playbook1/](https://github.com/ninabarzh/red-lantern-sim/tree/main/simulator/scenarios/easy/playbook1) - Basic BGP hijack
- [simulator/scenarios/medium/playbook2/](https://github.com/ninabarzh/red-lantern-sim/tree/main/simulator/scenarios/easy/playbook1) - ROA manipulation (reference implementation)
- [simulator/scenarios/advanced/playbook3/](https://github.com/ninabarzh/red-lantern-sim/tree/main/simulator/scenarios/easy/playbook1) - Sub-prefix exploitation

Telemetry components:

- [telemetry/generators/bmp_telemetry.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/telemetry/generators/bmp_telemetry.py) - BGP route monitoring
- [telemetry/generators/router_syslog.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/telemetry/generators/router_syslog.py) - Router log events
- [telemetry/generators/latency_metrics.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/telemetry/generators/latency_metrics.py) - Application performance

Output adapters:

- [simulator/output/adapter.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/simulator/output/adapter.py) - general class
- [simulator/output/bmp_adapter.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/simulator/output/bmp_adapter.py) - BMP log formatting
- [simulator/output/router_adapter.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/simulator/output/router_adapter.py) - Syslog formatting
- [simulator/output/rpki_adapter.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/simulator/output/rpki_adapter.py) - RPKI event formatting
- [simulator/output/tacacs_adapter.py](https://github.com/ninabarzh/red-lantern-sim/blob/main/simulator/output/tacacs_adapter.py) - Authentication logs
