# UEBA pipeline implementation

Dr. Crucible had been staring at authentication logs for three weeks when he noticed it: a user who logged in from Ankh-Morpork at 09:00 and from Tsort at 09:15. Physically impossible. The rules-based detection system had no rule for this, because the rules system checked for impossible travel within a single session, and these were two separate sessions. The gap was not a failure of the rules system; rules are good at catching what they know about. The gap was in the space between rules: the subtle, gradual, statistical deviations that a patient attacker or a compromised account produces over days and weeks. Machine learning does not replace rules. It fills the space between them.

## Architecture overview

The UEBA pipeline has three data sources, one processing microservice, and writes results back to Graylog.

Data sources:

- Keycloak authentication events, forwarded to Graylog via the Graylog GELF input. Every login, logout, token issuance, MFA attempt, and failed authentication generates a GELF message.
- Teleport access events, forwarded via syslog. Every session start, session end, and node connection is logged.
- Wazuh auditd events, enriched by the Wazuh pipeline before they reach Graylog. Commands executed on monitored hosts are logged with the executing user's identity.

Processing pipeline:

```
Keycloak --> Graylog GELF input --|
Teleport  --> Graylog Syslog    --|--> Graylog pipeline --> Kafka topic: ueba-events
Wazuh     --> Graylog Beats     --|

Kafka: ueba-events --> ueba-processor (Python, Kubernetes) --> Graylog REST API
                                                            --> anomaly_score field
                                                            --> routed to UEBA Alerts stream
```

## Kafka setup

A single-node Kafka instance runs in the `ueba` namespace on the Kubernetes cluster. Single-node is acceptable because the UEBA pipeline is not a safety-critical system; a brief Kafka outage means events are not scored, but they are not lost (Graylog buffers them).

```
# kafka-values.yaml for Helm deployment
replicaCount: 1
zookeeper:
  replicaCount: 1
persistence:
  enabled: true
  size: 50Gi
  storageClass: hcloud-volumes

config:
  log.retention.hours: 168
  log.retention.bytes: -1
  num.partitions: 4
  default.replication.factor: 1
```

The Kafka topic `ueba-events` is created with 4 partitions, one per ueba-processor replica (with two replicas, each replica consumes from 2 partitions, providing parallelism without complex partition assignment).

Topic configuration:

```
kafka-topics.sh --create \
  --bootstrap-server kafka.ueba.svc.cluster.local:9092 \
  --topic ueba-events \
  --partitions 4 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete
```

## Graylog Kafka output

Graylog forwards enriched authentication and access events to the `ueba-events` Kafka topic using the Graylog Kafka output plugin. The output is configured on the UEBA source stream, which collects events from all three data sources.

The Graylog pipeline rule that routes events to this stream:

```
rule "Route to UEBA pipeline"
when
  (
    has_field("keycloak_user") OR
    has_field("teleport_user") OR
    has_field("auditd_user")
  ) AND
  has_field("src_ip")
then
  let username = coalesce(
    $message.keycloak_user,
    $message.teleport_user,
    $message.auditd_user,
    "unknown"
  );
  set_field("ueba_username", username);
  route_to_stream("UEBA Source Events");
end
```

## ueba-processor microservice

The `ueba-processor` is a Python service that consumes from the `ueba-events` Kafka topic, scores each event against the user's baseline model, and writes the anomaly score back to Graylog.

Kubernetes deployment:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ueba-processor
  namespace: ueba
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ueba-processor
  template:
    metadata:
      labels:
        app: ueba-processor
    spec:
      containers:
      - name: ueba-processor
        image: registry.golemtrust.am/security/ueba-processor:latest
        env:
        - name: KAFKA_BOOTSTRAP_SERVERS
          value: "kafka.ueba.svc.cluster.local:9092"
        - name: KAFKA_TOPIC
          value: "ueba-events"
        - name: GRAYLOG_API_URL
          value: "https://graylog.golemtrust.am/api"
        - name: GRAYLOG_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: ueba-secrets
              key: graylog-api-token
        - name: MODEL_BUCKET
          value: "ueba-models.golemtrust.am"
        - name: POSTGRES_URI
          valueFrom:
            secretKeyRef:
              name: ueba-secrets
              key: postgres-uri
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## Processor main loop

The processor consumes events, extracts features, scores them, and writes scores back:

```
# ueba_processor/main.py (simplified structure)
from kafka import KafkaConsumer
import json
import pickle
import boto3
from feature_extraction import extract_features
from model_loader import load_model_for_user
from graylog_client import update_message_field

consumer = KafkaConsumer(
    'ueba-events',
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    group_id='ueba-processor-group',
    auto_offset_reset='latest'
)

for message in consumer:
    event = message.value
    username = event.get('ueba_username')
    if not username or username == 'unknown':
        continue

    features = extract_features(event)
    model = load_model_for_user(username)

    if model is None:
        # User has no baseline yet (first 30 days); skip scoring
        continue

    raw_score = model.decision_function([features])[0]
    # Convert Isolation Forest score (-inf to +inf) to 0.0-1.0
    # Negative scores are anomalies; the more negative, the more anomalous
    normalised_score = max(0.0, min(1.0, (0.5 - raw_score)))

    update_message_field(
        message_id=event['_id'],
        fields={
            'ueba_anomaly_score': normalised_score,
            'ueba_scored': True,
            'ueba_model_version': model.version
        }
    )
```

## Model loading and caching

Models are stored as pickle files in the `ueba-models.golemtrust.am` Hetzner Object Storage bucket. The processor loads models at startup and checks for updates every hour.

```
# Model file naming convention
ueba-models.golemtrust.am/
  models/
    {username}-current.pkl
    {username}-previous.pkl
    {username}-v{n}.pkl
```

The processor maintains an in-memory cache of loaded models. When the hourly check finds a newer `current.pkl` for a user, it loads the new model and replaces the cached version.

## Related

- [Long-window detection](../../../counter/evasion/notes/long-window.md)
- [Alert tuning](alert-tuning.md)
