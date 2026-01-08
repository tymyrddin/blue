# Feed development

Background feeds generate realistic operational noise that runs alongside attack scenarios. Background feeds create the 
normal network churn that makes detecting attacks more challenging, and more realistic.

## Understanding background feeds

### What are feeds?

Feeds generate time-stamped events that simulate normal operational activity:

- BGP routing updates - Prefix announcements, withdrawals, path changes
- Configuration changes - Software updates, maintenance windows, config modifications
- Custom operational noise - Payment processing metrics, trading activity, compliance audits

Feeds run independently of scenarios. The simulator merges scenario events and background events into a single 
sorted timeline, creating realistic operational context.

### Why use feeds?

Without feeds:

```
11:00:00 - Suspicious ROA modification
11:00:01 - BGP hijack announcement
11:00:02 - Traffic interception starts
```
Every event is part of the attack. Unrealistic and too easy to detect.

With feeds:

```
10:58:23 - BGP: Normal prefix update (NOISE)
10:59:47 - CMDB: Routine config change (NOISE)
11:00:00 - Suspicious ROA modification (ATTACK)
11:00:12 - BGP: Normal prefix update (NOISE)
11:00:15 - CMDB: Software update (NOISE)
11:00:18 - BGP hijack announcement (ATTACK)
11:00:45 - BGP: Normal prefix update (NOISE)
11:01:03 - Traffic interception starts (ATTACK)
```
Attack events are mixed with operational noise. Analysts must distinguish signal from background.


## Feed architecture

### The BackgroundFeed interface

All feeds inherit from `BackgroundFeed` and implement one method:

```python
from simulator.engine.simulation_engine import BackgroundFeed

class MyCustomFeed(BackgroundFeed):
    def generate_events(self, duration: int) -> list[tuple[int, dict[str, Any]]]:
        """
        Generate all events for the simulation duration.
        
        Args:
            duration: Total simulation time in seconds
            
        Returns:
            List of (timestamp, event_dict) tuples
        """
        # Your implementation here
        pass
```

Key principles:

1. Deterministic: Given the same duration and seed, generate identical events
2. Pre-generated: All events created upfront, then sorted by timestamp
3. Independent: Don't reference scenario data or timing
4. Tagged: Include source identifier for filtering/analysis

### How feeds integrate

The simulator merges scenario and feed events:

```python
# From simulation_engine.py
def run_with_background(scenario_runner, background_feeds, event_bus, clock):
    # 1. Collect scenario events
    all_events = collect_scenario_events(scenario_runner)
    
    # 2. Collect feed events
    for feed in background_feeds:
        all_events.extend(feed.generate_events(duration))
    
    # 3. Sort by timestamp
    all_events.sort(key=lambda x: x[0])
    
    # 4. Execute in order
    for timestamp, event_data in all_events:
        clock.advance_to(timestamp)
        event_bus.publish(event_data)
```

Feeds don't "run" during simulation—they generate a complete event list upfront that gets merged with the scenario timeline.

## Creating custom feeds

### Example 1: Simple BGP route flapping

Let's create a feed that simulates flapping BGP routes (routes that repeatedly appear and disappear):

```python
# simulator/feeds/bgp/bgp_flap_feed.py
"""
BGP route flapping feed.

Simulates unstable routes that repeatedly announce and withdraw,
creating operational noise that can mask or complicate attack detection.
"""

import random
from typing import Any
from simulator.engine.simulation_engine import BackgroundFeed


class BGPFlapFeed(BackgroundFeed):
    """Generate BGP route flapping events."""

    def __init__(
        self,
        flap_prefixes: list[str] | None = None,
        flap_rate: float = 0.1,  # flaps per second
        seed: int = 44
    ):
        """
        Args:
            flap_prefixes: Specific prefixes to flap (or generate random ones)
            flap_rate: Average flaps per second
            seed: Random seed for determinism
        """
        self.flap_prefixes = flap_prefixes or [
            "198.18.0.0/24",
            "198.18.1.0/24",
            "198.18.2.0/24"
        ]
        self.flap_rate = flap_rate
        self.seed = seed

    def generate_events(self, duration: int) -> list[tuple[int, dict[str, Any]]]:
        """Generate flapping route events."""
        rng = random.Random(self.seed)
        events = []

        # Calculate total flap events
        total_flaps = int(duration * self.flap_rate)

        for _ in range(total_flaps):
            timestamp = rng.randint(0, duration)
            prefix = rng.choice(self.flap_prefixes)
            
            # Flap = announce followed by withdrawal
            # Announce first
            events.append((timestamp, {
                "event_type": "bgp.flap_announce",
                "source": "bgp_flap",
                "attributes": {
                    "prefix": prefix,
                    "origin_as": rng.randint(64512, 65000),
                    "as_path": self._random_as_path(rng),
                    "next_hop": f"192.0.2.{rng.randint(1, 254)}",
                    "flap": True
                }
            }))
            
            # Withdrawal shortly after (5-30 seconds later)
            withdraw_delay = rng.randint(5, 30)
            events.append((timestamp + withdraw_delay, {
                "event_type": "bgp.flap_withdraw",
                "source": "bgp_flap",
                "attributes": {
                    "prefix": prefix,
                    "flap": True
                }
            }))

        return sorted(events, key=lambda x: x[0])

    @staticmethod
    def _random_as_path(rng: random.Random) -> list[int]:
        """Generate random AS path."""
        path_length = rng.randint(2, 5)
        return [rng.randint(64512, 65000) for _ in range(path_length)]
```

Usage:

```python
# In CLI or custom runner
from simulator.feeds.bgp.bgp_flap_feed import BGPFlapFeed

flap_feed = BGPFlapFeed(
    flap_prefixes=["203.0.113.0/24", "198.51.100.0/24"],
    flap_rate=0.2  # One flap every 5 seconds
)

run_with_background(runner, [flap_feed], event_bus, clock)
```

### Example 2: Financial trading activity feed

For financial institutions, simulate trading volume patterns:

```python
# simulator/feeds/financial/trading_activity_feed.py
"""
Trading activity feed for financial scenarios.

Simulates normal trading volume patterns with realistic daily cycles:
- Low activity during off-hours
- High volume during market hours
- Spikes during opening/closing
"""

import random
from typing import Any
from simulator.engine.simulation_engine import BackgroundFeed


class TradingActivityFeed(BackgroundFeed):
    """Generate trading activity metric events."""

    def __init__(
        self,
        base_rate: float = 0.2,  # events per second during normal hours
        peak_multiplier: float = 3.0,  # peak hours multiplier
        seed: int = 45
    ):
        """
        Args:
            base_rate: Base event rate during normal trading hours
            peak_multiplier: How much to increase during peak hours
            seed: Random seed
        """
        self.base_rate = base_rate
        self.peak_multiplier = peak_multiplier
        self.seed = seed

    def generate_events(self, duration: int) -> list[tuple[int, dict[str, Any]]]:
        """Generate trading activity events with time-of-day variation."""
        rng = random.Random(self.seed)
        events = []

        # Process each second of simulation
        for timestamp in range(0, duration, 10):  # Check every 10 seconds
            rate = self._get_rate_for_time(timestamp)
            
            # Probabilistically generate event
            if rng.random() < (rate * 10):  # Scale for 10-second intervals
                transaction_volume = rng.randint(100, 10000)
                api_latency_ms = rng.randint(50, 200)
                
                events.append((timestamp, {
                    "event_type": "trading.metrics",
                    "source": "trading_activity",
                    "attributes": {
                        "transaction_count": transaction_volume,
                        "api_latency_ms": api_latency_ms,
                        "queue_depth": rng.randint(0, 100),
                        "error_rate": rng.uniform(0.0, 0.01)
                    }
                }))

        return events

    def _get_rate_for_time(self, timestamp: int) -> float:
        """
        Calculate event rate based on time of day simulation.
        
        Simulates:
        - 09:00-10:00: Opening rush (peak)
        - 10:00-15:00: Normal trading hours (base rate)
        - 15:00-16:00: Closing rush (peak)
        - 16:00-09:00: Off hours (low rate)
        """
        # Convert timestamp to hour of day (simplified)
        hour = (timestamp // 3600) % 24
        
        if 9 <= hour < 10 or 15 <= hour < 16:
            # Opening/closing hours - peak activity
            return self.base_rate * self.peak_multiplier
        elif 10 <= hour < 15:
            # Normal trading hours
            return self.base_rate
        else:
            # Off hours - minimal activity
            return self.base_rate * 0.1
```

### Example 3: Compliance audit log feed

Simulate routine compliance auditing activity:

```python
# simulator/feeds/compliance/audit_feed.py
"""
Compliance audit activity feed.

Simulates routine compliance monitoring that occurs alongside operations:
- WHOIS lookups for prefix validation
- ROA compliance checks
- Certificate validation scans
- Access audit logging
"""

import random
from typing import Any
from simulator.engine.simulation_engine import BackgroundFeed


class ComplianceAuditFeed(BackgroundFeed):
    """Generate compliance audit events."""

    def __init__(
        self,
        audit_rate: float = 0.05,  # audits per second
        monitored_prefixes: list[str] | None = None,
        seed: int = 46
    ):
        """
        Args:
            audit_rate: Average audit events per second
            monitored_prefixes: Prefixes under compliance monitoring
            seed: Random seed
        """
        self.audit_rate = audit_rate
        self.monitored_prefixes = monitored_prefixes or [
            "203.0.113.0/24",
            "198.51.100.0/24",
            "192.0.2.0/24"
        ]
        self.seed = seed

    def generate_events(self, duration: int) -> list[tuple[int, dict[str, Any]]]:
        """Generate compliance audit events."""
        rng = random.Random(self.seed)
        events = []

        total_audits = int(duration * self.audit_rate)

        for _ in range(total_audits):
            timestamp = rng.randint(0, duration)
            audit_type = rng.choice([
                "roa_compliance_check",
                "whois_validation",
                "certificate_validation",
                "access_review"
            ])

            if audit_type == "roa_compliance_check":
                prefix = rng.choice(self.monitored_prefixes)
                events.append((timestamp, {
                    "event_type": "compliance.roa_check",
                    "source": "compliance_audit",
                    "attributes": {
                        "prefix": prefix,
                        "check_type": "roa_compliance",
                        "status": rng.choice(["compliant", "compliant", "compliant", "warning"]),
                        "automated": True
                    }
                }))

            elif audit_type == "whois_validation":
                prefix = rng.choice(self.monitored_prefixes)
                events.append((timestamp, {
                    "event_type": "compliance.whois_check",
                    "source": "compliance_audit",
                    "attributes": {
                        "prefix": prefix,
                        "registry": "ARIN",
                        "verified": True
                    }
                }))

        return sorted(events, key=lambda x: x[0])
```

## Practicals

### 1. Deterministic generation

Always use seeded random number generators:

```python
# GOOD: Deterministic
rng = random.Random(self.seed)
value = rng.randint(1, 100)

# BAD: Non-deterministic
value = random.randint(1, 100)  # Different each run
```

Why: Scenarios should be reproducible. Same inputs = same outputs.

### 2. Realistic event rates

Don't overwhelm the simulation with noise:

```python
# GOOD: Reasonable rates
BGPNoiseFeed(update_rate=0.5)      # One BGP update every 2 seconds
CMDBNoiseFeed(change_rate=0.1)      # One change every 10 seconds

# BAD: Excessive noise
BGPNoiseFeed(update_rate=100.0)     # 100 updates/second - unrealistic
```

Rule of thumb: Background should be 5-10x the scenario event rate, not 100x.

### 3. Tag feed events clearly

Always include source identifier:

```python
event = {
    "event_type": "bgp.update",
    "source": "bgp_noise",  # Clear identifier
    "attributes": {...}
}
```

Why: Analysts need to distinguish scenario events from background noise during exercises.

### 4. Match the infrastructure

Generate events that match your actual network:

```python
# GOOD: Realistic AS numbers from your network
class CustomBGPFeed(BackgroundFeed):
    def __init__(self):
        self.realistic_asns = [1299, 3356, 6939]  # Your actual peers
    
    def _generate_as_path(self, rng):
        return [rng.choice(self.realistic_asns), rng.randint(64512, 65000)]

# BAD: Generic AS numbers that don't exist in your topology
as_path = [12345, 67890]  # Not your network
```

### 5. Don't reference scenario data

Feeds must be independent:

```python
# BAD: References scenario
class BadFeed(BackgroundFeed):
    def generate_events(self, duration, scenario):
        # Don't do this - feed knows about scenario
        attack_prefix = scenario.get_target_prefix()

# GOOD: Independent
class GoodFeed(BackgroundFeed):
    def __init__(self, monitored_prefixes):
        self.prefixes = monitored_prefixes  # Configured independently
    
    def generate_events(self, duration):
        # Doesn't know about scenario
        pass
```

## Integrating custom feeds

### Method 1: Modify CLI (Simple)

Add your feed to `simulator/cli.py`:

```python
# In main() function, after existing feeds
if args.background:
    background_feeds = [
        BGPNoiseFeed(update_rate=args.bgp_noise_rate),
        CMDBNoiseFeed(change_rate=args.cmdb_noise_rate),
        
        # Add your custom feed
        BGPFlapFeed(flap_rate=0.1),
        TradingActivityFeed(base_rate=0.2),
    ]
```

### Method 2: Custom CLI arguments (advanced)

Add command-line options for your feed:

```python
parser.add_argument(
    "--trading-activity",
    action="store_true",
    help="Enable trading activity feed"
)
parser.add_argument(
    "--trading-rate",
    type=float,
    default=0.2,
    help="Trading events per second"
)

# Later in main()
if args.trading_activity:
    background_feeds.append(
        TradingActivityFeed(base_rate=args.trading_rate)
    )
```

### Method 3: Configuration file (most flexible)

Create a feed configuration file:

```yaml
# feeds_config.yaml
feeds:
  - type: bgp_noise
    rate: 0.5
  
  - type: bgp_flap
    rate: 0.1
    prefixes:
      - "203.0.113.0/24"
      - "198.51.100.0/24"
  
  - type: trading_activity
    base_rate: 0.2
    peak_multiplier: 3.0
  
  - type: compliance_audit
    rate: 0.05
    monitored_prefixes:
      - "203.0.113.0/24"
```

Then load dynamically (requires additional implementation).

## Output adapter integration

Feeds generate events; adapters format them for output.

### Adding adapter support

If your feed uses new event types, add adapter support:

```python
# simulator/output/trading_adapter.py
from .base import Adapter

class TradingAdapter(Adapter):
    """Transform trading activity events into log lines."""

    def transform(self, event: dict) -> list[str]:
        lines = []
        
        if event.get("event_type") == "trading.metrics":
            attr = event.get("attributes", {})
            lines.append(
                f"<14>Jan 08 11:00:00 trading-api METRICS: "
                f"txn_count={attr.get('transaction_count')} "
                f"latency_ms={attr.get('api_latency_ms')} "
                f"queue_depth={attr.get('queue_depth')}"
            )
        
        return lines
```

Register in `simulator/output/adapter.py`:

```python
from .trading_adapter import TradingAdapter

class ScenarioAdapter(Adapter):
    def __init__(self):
        self.adapters = [
            # ... existing adapters
            TradingAdapter(),
        ]
```

## Testing feeds

### Unit test structure

```python
# tests/unit/feeds/test_trading_activity_feed.py
import pytest
from simulator.feeds.financial.trading_activity_feed import TradingActivityFeed

def test_deterministic_generation():
    """Feed should generate identical events with same seed."""
    feed1 = TradingActivityFeed(seed=42)
    feed2 = TradingActivityFeed(seed=42)
    
    events1 = feed1.generate_events(duration=3600)
    events2 = feed2.generate_events(duration=3600)
    
    assert events1 == events2

def test_event_rate():
    """Feed should generate approximately correct number of events."""
    feed = TradingActivityFeed(base_rate=0.2, seed=42)
    events = feed.generate_events(duration=1000)
    
    # Expect ~200 events (0.2/sec * 1000sec), allow 20% variance
    assert 160 <= len(events) <= 240

def test_time_of_day_variation():
    """Peak hours should have more events than off-hours."""
    feed = TradingActivityFeed(base_rate=0.2, peak_multiplier=3.0, seed=42)
    events = feed.generate_events(duration=86400)  # 24 hours
    
    # Count events in peak hours vs off hours
    peak_events = [e for e in events if 32400 <= e[0] < 36000]  # 09:00-10:00
    off_events = [e for e in events if 0 <= e[0] < 3600]         # 00:00-01:00
    
    assert len(peak_events) > len(off_events)
```

### Integration test

```python
# tests/integration/test_feeds_with_scenario.py
def test_feeds_integrate_with_scenario():
    """Feeds should merge correctly with scenario events."""
    event_bus = EventBus()
    clock = SimulationClock()
    
    # Load scenario
    runner = ScenarioRunner("test_scenario.yaml", event_bus)
    runner.clock = clock
    runner.load()
    
    # Create feeds
    feeds = [BGPNoiseFeed(update_rate=0.5, seed=42)]
    
    # Collect all events
    collected_events = []
    event_bus.subscribe(lambda e: collected_events.append(e))
    
    # Run
    run_with_background(runner, feeds, event_bus, clock)
    
    # Verify mixing
    scenario_events = [e for e in collected_events if e.get("source") == "scenario"]
    feed_events = [e for e in collected_events if e.get("source") == "bgp_noise"]
    
    assert len(scenario_events) > 0
    assert len(feed_events) > 0
    assert len(collected_events) == len(scenario_events) + len(feed_events)
```

## Common feed patterns

### Pattern 1: Time-based variation

Events that vary by time of day:

```python
def _get_rate_for_time(self, timestamp: int) -> float:
    hour = (timestamp // 3600) % 24
    
    # Business hours: higher rate
    if 9 <= hour < 17:
        return self.base_rate
    # Off hours: lower rate
    else:
        return self.base_rate * 0.2
```

### Pattern 2: Burst events

Events that occur in clusters:

```python
def generate_events(self, duration: int) -> list[tuple[int, dict]]:
    events = []
    
    # Generate burst centers
    num_bursts = int(duration / 3600)  # One burst per hour
    for _ in range(num_bursts):
        burst_time = rng.randint(0, duration)
        
        # Generate 5-10 events within 60 seconds
        burst_size = rng.randint(5, 10)
        for _ in range(burst_size):
            offset = rng.randint(0, 60)
            events.append((burst_time + offset, {...}))
    
    return sorted(events, key=lambda x: x[0])
```

### Pattern 3: Correlated events

Events that trigger related events:

```python
def generate_events(self, duration: int) -> list[tuple[int, dict]]:
    events = []
    
    for timestamp in range(0, duration, 300):  # Every 5 minutes
        # Primary event
        events.append((timestamp, {
            "event_type": "maintenance.start",
            ...
        }))
        
        # Correlated follow-up (2 minutes later)
        events.append((timestamp + 120, {
            "event_type": "maintenance.complete",
            ...
        }))
    
    return events
```

## Conclusion

Background feeds transform sterile scenario logs into realistic operational environments. They're the difference between a training exercise that feels like a simulation and one that feels like real network operations.

As Commander Vimes would observe, "The best training happens when you can't immediately tell the difference between a 
drill and the real thing." Background feeds provide that realism:

- Feeds generate pre-sorted event lists, not real-time streams
- Keep event rates realistic (5-10x scenario rate, not 100x)
- Always use seeded randomness for reproducibility
- Tag events clearly for filtering during analysis
- Match your actual infrastructure (AS numbers, prefixes, systems)

Start with the provided [BGP noise feed](https://github.com/ninabarzh/red-lantern-sim/blob/main/simulator/feeds/bgp/bgp_noise_feed.py) 
and [CMDB noise feeds](https://github.com/ninabarzh/red-lantern-sim/blob/main/simulator/feeds/change_mgmt/cmdb_noise_feed.py), 
then add custom feeds that reflect your operational environment. A financial institution's feeds should look different 
from a cloud provider's.

## Related

- [Custom Scenario Development](scenarios.md) - Creating scenarios that can use custom feeds
- [Detection Engineering](../detection/index.rst) - Using feed noise to test detection rules
- [Collaborative Testing](testing.md) - Purple team exercises with realistic noise

## Feed Examples in Repository

- `simulator/feeds/bgp/bgp_noise_feed.py` - BGP routing churn
- `simulator/feeds/change_mgmt/cmdb_noise_feed.py` - Configuration changes
- Create your own in `simulator/feeds/{category}/` following these patterns