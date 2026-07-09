# Baseline calculation

The baseline is what normal looks like for a specific person. Not what normal looks like in general, but what it looks like for Cheery Littlebottom, who works morning shifts and accesses the same five Kubernetes clusters every day, versus what it looks like for Ponder Stibbons, who works irregular hours, connects from multiple locations, and accesses essentially everything because he is responsible for everything. A model that treated them both as instances of "generic Golem Trust employee" would miss the behaviour that is anomalous for one of them while flagging the other constantly. The ninety-day rolling baseline is per user, always.

## Baseline features

For each user, the baseline model tracks five feature categories over the past ninety days.

Login time distribution: a histogram of the hour of day and day of week for each login event. Stored as a 168-value array (24 hours times 7 days), normalised so values sum to 1. This captures shift patterns, time zones, and work habits. Cheery logs in between 06:00 and 08:00 most days; a login at 03:00 on a Sunday is a deviation.

Source IP set: the set of IP addresses from which the user has previously logged in, weighted by frequency. IPs used more often have higher weight. Unknown IPs are scored as anomalous; IPs used only once or twice (one-off travel, for example) are moderately anomalous; IPs used regularly receive minimal anomaly contribution.

Accessed systems set: the set of Teleport targets the user has connected to, with frequency weighting. A developer who always connects to `dev-cluster`, `staging-cluster`, and `build-server` and then suddenly connects to `production-payments-db` is anomalous.

Data volume transferred: the daily bytes transferred in Teleport sessions. Stored as a distribution (mean, standard deviation). Large deviations from the user's typical volume are anomalous.

Command patterns: the most common commands executed on monitored hosts, extracted from Wazuh auditd logs. Stored as a TF-IDF-style weighted vector. If a user who normally runs `kubectl`, `git`, `python3`, and `vim` suddenly starts running `nmap`, `curl -o`, and `chmod +x`, the command pattern score will be high.

## Nightly baseline recalculation

The baseline batch job runs nightly at 01:00 UTC, scheduled as a Kubernetes CronJob:

```
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ueba-baseline-recalculate
  namespace: ueba
spec:
  schedule: "0 1 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: baseline-calculator
            image: registry.golemtrust.am/security/ueba-baseline:latest
            env:
            - name: GRAYLOG_API_URL
              value: "https://graylog.golemtrust.am/api"
            - name: LOOKBACK_DAYS
              value: "90"
            - name: POSTGRES_URI
              valueFrom:
                secretKeyRef:
                  name: ueba-secrets
                  key: postgres-uri
          restartPolicy: OnFailure
```

The baseline calculator queries the Graylog API for each user's events from the past 90 days:

```
# baseline_calculator.py (core query logic)
import requests
from datetime import datetime, timedelta

def fetch_user_events(username: str, lookback_days: int = 90) -> list:
    end = datetime.utcnow()
    start = end - timedelta(days=lookback_days)

    query = {
        "query": f'ueba_username:"{username}"',
        "from": start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "to": end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "fields": "timestamp,src_ip,teleport_target,bytes_transferred,auditd_command",
        "limit": 50000,
        "sort": "timestamp:asc"
    }

    response = requests.post(
        f"{GRAYLOG_API_URL}/search/universal/absolute",
        headers={"Authorization": f"Token {GRAYLOG_TOKEN}"},
        json=query
    )
    return response.json().get("messages", [])
```

## Baseline storage schema

Baselines are stored in a PostgreSQL database in the `ueba` namespace. The schema:

```
CREATE TABLE user_baselines (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(255) NOT NULL,
    version     INTEGER NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from  TIMESTAMPTZ NOT NULL,
    valid_to    TIMESTAMPTZ,  -- NULL means current
    feature_vector JSONB NOT NULL,
    event_count INTEGER NOT NULL,
    UNIQUE(username, version)
);

CREATE INDEX idx_user_baselines_username ON user_baselines(username);
CREATE INDEX idx_user_baselines_current ON user_baselines(username) WHERE valid_to IS NULL;
```

The `feature_vector` JSONB field stores the complete baseline for the user:

```
{
  "login_time_histogram": [0.02, 0.01, ...],
  "source_ips": {
    "100.64.1.10": 0.85,
    "100.64.1.11": 0.12,
    "213.95.100.55": 0.03
  },
  "accessed_systems": {
    "dev-cluster": 0.45,
    "staging-cluster": 0.35,
    "build-server": 0.20
  },
  "volume_mean_bytes": 524288,
  "volume_std_bytes": 131072,
  "command_tfidf": {
    "kubectl": 0.42,
    "git": 0.28,
    "python3": 0.15,
    "vim": 0.10
  }
}
```

## Baseline version control

Three versions are kept per user: `current`, `previous`, and `v(n-2)`. This allows the UEBA system to detect gradual drift, sometimes called the boiling frog problem: a baseline that is recalculated daily might drift slowly in the direction of a compromised user's changing behaviour, eventually normalising the attacker's activity.

Comparing the current baseline against the version from two weeks ago reveals whether a user's behaviour has changed significantly. A sudden change in source IPs or accessed systems between baseline versions is itself a signal worth reviewing, even if the current anomaly score is not high.

```
# Check for baseline drift
def detect_baseline_drift(username: str) -> dict:
    current = get_baseline(username, version='current')
    old = get_baseline(username, version='v_minus_2')

    if current is None or old is None:
        return {"drift_detected": False, "reason": "insufficient_history"}

    ip_overlap = jaccard_similarity(
        set(current['source_ips'].keys()),
        set(old['source_ips'].keys())
    )

    system_overlap = jaccard_similarity(
        set(current['accessed_systems'].keys()),
        set(old['accessed_systems'].keys())
    )

    drift = {
        "ip_overlap": ip_overlap,
        "system_overlap": system_overlap,
        "drift_detected": ip_overlap < 0.5 or system_overlap < 0.5
    }
    return drift
```

## New users and learning mode

Users with fewer than 30 days of history have no baseline model. For these users, the `ueba-processor` sets `ueba_scored=false` and `ueba_learning_mode=true` on each event. No anomaly score is generated. No UEBA alerts are created.

After 30 days, the nightly baseline job generates an initial model. On the following day, scoring begins. The initial model is typically noisier than a mature 90-day baseline; Angua expects a brief period of elevated false positives for new users and adjusts alert thresholds accordingly during the first two weeks of scoring.
Last updated: 20 March 2026
