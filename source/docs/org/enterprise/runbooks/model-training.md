# Model training

Dr. Crucible selected the Isolation Forest algorithm because it does not require labelled training data. At the time he implemented the UEBA system, Golem Trust had no historical dataset of confirmed compromised account events to train on. What it had was months of authentication logs describing normal behaviour. Isolation Forest is precisely suited to this situation: it learns what normal looks like and flags deviations, without needing to be told in advance what abnormal looks like. The algorithm isolates anomalies by observing that unusual data points are easier to isolate than common ones, which is a statistical way of saying what any experienced detective already knows: unusual things stand out.

## Algorithm selection rationale

Isolation Forest from scikit-learn was chosen over alternatives for three reasons:

It handles high-dimensional data well. The 15-feature vector is not particularly high-dimensional, but experience from the Unseen University's thaumaturgical anomaly detection work (Dr. Crucible's prior research) showed that algorithms that scale poorly with dimensions create maintenance problems as new features are added.

It is computationally efficient at inference time. Scoring a single event takes microseconds; the ueba-processor handles hundreds of events per minute without strain.

It produces interpretable scores. The `decision_function` output can be examined per-tree to understand which features contributed most to the anomaly score, supporting the explainability required by Angua's review workflow.

## Training configuration

```
# ueba_trainer/train.py

from sklearn.ensemble import IsolationForest
import numpy as np
import pickle
import boto3
from datetime import datetime

def train_user_model(username: str, feature_vectors: list) -> IsolationForest:
    if len(feature_vectors) < 30:
        # Insufficient data for reliable model
        raise ValueError(f"User {username} has only {len(feature_vectors)} events; minimum 30 required")

    X = np.array(feature_vectors)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        max_samples='auto',
        max_features=1.0,
        bootstrap=False,
        n_jobs=-1,
        random_state=42
    )

    model.fit(X)
    model.username = username
    model.trained_at = datetime.utcnow().isoformat()
    model.version = generate_version_id(username)
    model.event_count = len(feature_vectors)

    return model
```

Parameters explained:

`n_estimators=200`: the number of isolation trees. More trees produce more stable scores at the cost of training time. 200 provides good stability for datasets of the size Golem Trust produces per user.

`contamination=0.05`: the expected proportion of anomalous events in the training data. Set to 5% as an initial estimate; this value is adjusted during the alert tuning process based on observed false positive rates.

`random_state=42`: ensures reproducible model training, which is important for debugging: given the same input data, the same model is produced.

## Training schedule

Model training runs weekly on Sunday at 02:00 UTC, as a Kubernetes CronJob:

```
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ueba-model-training
  namespace: ueba
spec:
  schedule: "0 2 * * 0"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ueba-trainer
            image: registry.golemtrust.am/security/ueba-trainer:latest
            env:
            - name: TRAINING_LOOKBACK_DAYS
              value: "90"
            - name: MODEL_BUCKET
              value: "ueba-models.golemtrust.am"
            resources:
              requests:
                memory: "2Gi"
                cpu: "2000m"
              limits:
                memory: "8Gi"
                cpu: "4000m"
          restartPolicy: OnFailure
      backoffLimit: 3
```

The trainer fetches 90 days of feature vectors for each user from the PostgreSQL baseline database, trains a new model, saves the model artefact to object storage, and updates the database to mark the new model as current.

## Model artefact storage

Models are stored as pickle files in Hetzner Object Storage:

```
# Saving a trained model
def save_model(model: IsolationForest, username: str):
    s3 = boto3.client(
        's3',
        endpoint_url='https://nbg1.your-objectstorage.com',
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY
    )

    model_bytes = pickle.dumps(model)
    version = model.version

    # Save as current
    s3.put_object(
        Bucket='ueba-models.golemtrust.am',
        Key=f'models/{username}-current.pkl',
        Body=model_bytes,
        ContentType='application/octet-stream'
    )

    # Save versioned copy
    s3.put_object(
        Bucket='ueba-models.golemtrust.am',
        Key=f'models/{username}-{version}.pkl',
        Body=model_bytes,
        ContentType='application/octet-stream'
    )
```

The bucket retains the last three versioned models per user. Older versions are deleted by a lifecycle policy that removes objects with keys matching `models/*-v*.pkl` older than 30 days.

## Score normalisation

The Isolation Forest `decision_function` returns a score where negative values indicate anomalies and positive values indicate normal behaviour. The raw range is approximately -0.5 to +0.5 for well-calibrated models. This is converted to a 0.0-1.0 scale:

```
def normalise_score(raw_score: float) -> float:
    # decision_function: negative = anomaly, positive = normal
    # Map to 0 (normal) to 1 (highly anomalous)
    # Clamp to [0, 1]
    normalised = 0.5 - raw_score
    return max(0.0, min(1.0, normalised))
```

Score thresholds:

- 0.0 to 0.70: normal, no alert
- 0.70 to 0.85: moderate anomaly, routed to Slack for Angua's review
- 0.85 to 1.0: strong anomaly, PagerDuty alert

## False positive feedback loop

Angua provides feedback on UEBA alerts via a button in the Graylog UEBA dashboard. Two feedback options: "False positive: user's behaviour has changed legitimately" and "False positive: known exception (incident response, known travel, etc.)".

Feedback is stored in the `ueba_feedback` table:

```
CREATE TABLE ueba_feedback (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL, -- 'fp_behaviour_change' or 'fp_known_exception'
    submitted_by VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);
```

The weekly model training job queries the feedback table. If a user has more than 5 false positives of type `fp_behaviour_change` in the past 30 days, the trainer increases the `contamination` parameter to 0.08 for that user's model, reducing its sensitivity. If a user has a high proportion of `fp_known_exception` feedback, the trainer adds feature weights to downgrade the anomaly contribution of the features that drove those false positives.

This feedback loop is what reduced the initial false positive rate from 18% to 3.2% over three months.
Last updated: 20 March 2026
