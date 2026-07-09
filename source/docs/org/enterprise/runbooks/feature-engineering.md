# Feature engineering

The quality of an anomaly detection model depends almost entirely on the quality of the features fed to it. A model that receives poorly constructed features will produce confident, useless scores. Dr. Crucible spent more time on feature engineering than on any other aspect of the UEBA implementation, because he understood from his Unseen University experience that the way you frame a question determines whether you can answer it. The fifteen features described here were selected after discarding eleven others that either added no predictive value or introduced instability into the scoring.

## Feature extraction per event

Each authentication or access event that passes through the `ueba-processor` produces a 15-dimensional feature vector. The vector is assembled by the `extract_features` function:

```
# ueba_processor/feature_extraction.py

import numpy as np
from datetime import datetime
import math

def extract_features(event: dict, baseline: dict, context: dict) -> np.ndarray:
    features = []

    # Time features (4 features)
    features.append(extract_hour(event))
    features.append(extract_day_of_week(event))
    features.append(extract_is_weekend(event))
    features.append(extract_hour_deviation(event, baseline))

    # Location features (3 features)
    features.append(extract_known_ip(event, baseline))
    features.append(extract_ip_country_score(event, baseline))
    features.append(extract_impossible_travel(event, context))

    # Access features (2 features)
    features.append(extract_new_target(event, baseline))
    features.append(extract_target_sensitivity(event))

    # Volume features (2 features)
    features.append(extract_bytes_transferred(event))
    features.append(extract_volume_deviation(event, baseline))

    # Context features (2 features)
    features.append(extract_active_incident(context))
    features.append(extract_recent_password_reset(event, context))

    # Command features (2 features)
    features.append(extract_command_novelty(event, baseline))
    features.append(extract_privilege_escalation_attempt(event))

    return np.array(features, dtype=float)
```

## Time features

`hour`: integer 0-23, the hour of the event in UTC. Not normalised at extraction; normalisation is applied later.

`day_of_week`: integer 0-6, Monday through Sunday.

`is_weekend`: binary (0 or 1). Saturday or Sunday returns 1. This is a separate feature because weekend access by a user who never works weekends is qualitatively different from an unusual hour on a weekday.

`deviation_from_mean_hour`: z-score of the event hour against the user's historical mean login hour.

```
def extract_hour_deviation(event: dict, baseline: dict) -> float:
    event_hour = datetime.fromisoformat(event['timestamp']).hour
    hist = baseline.get('login_time_histogram', [1/24] * 24)
    hours = list(range(24))
    mean_hour = sum(h * p for h, p in zip(hours, hist))
    variance = sum((h - mean_hour)**2 * p for h, p in zip(hours, hist))
    std_hour = math.sqrt(variance) if variance > 0 else 1.0
    return (event_hour - mean_hour) / std_hour
```

## Location features

`known_ip`: float 0.0-1.0. If the source IP is in the user's known IP set, this is the frequency weight for that IP (e.g. 0.85 for the IP used 85% of the time). If the IP is not in the known set, this is 0.0.

`ip_country_score`: float 0.0-1.0. If the source IP country matches the countries previously seen for this user, this is 1.0. If it is a new country, this is 0.0. If it is a country associated with known threat actors (per MISP), this is -0.5 (can drive the total feature value negative, increasing anomaly score).

`impossible_travel`: binary (0 or 1). Calculates whether the time elapsed since the user's previous login is consistent with the distance between the two source IP geolocations.

```
def extract_impossible_travel(event: dict, context: dict) -> float:
    prev = context.get('previous_login')
    if not prev:
        return 0.0

    time_delta_hours = (
        datetime.fromisoformat(event['timestamp']) -
        datetime.fromisoformat(prev['timestamp'])
    ).total_seconds() / 3600

    distance_km = haversine(
        prev.get('src_lat', 0), prev.get('src_lon', 0),
        event.get('src_lat', 0), event.get('src_lon', 0)
    )

    # Maximum plausible travel speed: 900 km/h (commercial aircraft)
    max_distance = time_delta_hours * 900
    return 1.0 if distance_km > max_distance else 0.0
```

## Access features

`new_target_system`: binary (0 or 1). Returns 1 if the Teleport target system is not in the user's known accessed systems set. Accessing a system for the first time is not inherently suspicious, but in combination with other features, it contributes to a higher anomaly score.

`target_system_sensitivity_score`: integer 1-5, configured per system in the sensitivity table. The table is maintained at `security/ueba/system-sensitivity.yaml`:

```
system_sensitivity:
  dev-cluster: 1
  staging-cluster: 2
  build-server: 2
  production-cluster: 4
  production-payments-db: 5
  vault.golemtrust.am: 5
  keycloak.golemtrust.am: 5
  harbor.golemtrust.am: 3
```

## Volume features

`bytes_transferred`: the raw bytes transferred in the Teleport session or the data volume in a database query session.

`deviation_from_mean_volume`: z-score of the current session volume against the user's historical mean and standard deviation.

```
def extract_volume_deviation(event: dict, baseline: dict) -> float:
    current_bytes = event.get('bytes_transferred', 0)
    mean = baseline.get('volume_mean_bytes', 0)
    std = baseline.get('volume_std_bytes', 1)
    if std == 0:
        std = 1
    return (current_bytes - mean) / std
```

## Context features

`active_incident`: binary (0 or 1). Set to 1 when the SOC has declared an active incident and set the `incident_active` flag in the UEBA context table. During an incident, many users will legitimately access systems they do not normally access, at unusual hours, with elevated data transfer volumes. Context-aware scoring prevents a flood of UEBA false positives during incident response.

`recent_password_reset`: binary (0 or 1). Set to 1 if the user has had a password reset within the past 24 hours. A login immediately after a password reset is expected; a login with a new source IP after a password reset may indicate an attacker completing a credential theft attack.

## Feature normalisation

Before the feature vector is passed to the Isolation Forest model, all features are normalised using z-score normalisation against the baseline statistics. This ensures that no single feature dominates the anomaly score purely due to scale differences between features.

```
def normalise_features(features: np.ndarray, baseline: dict) -> np.ndarray:
    means = np.array(baseline['feature_means'])
    stds = np.array(baseline['feature_stds'])
    stds = np.where(stds == 0, 1, stds)
    return (features - means) / stds
```

The `feature_means` and `feature_stds` arrays are computed during the baseline calculation and stored in the baseline record alongside the feature vector histograms.
Last updated: 20 March 2026
