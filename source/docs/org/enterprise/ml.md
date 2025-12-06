# Behavioural analytics and ML detection

Dr. Crucible has been experimenting. He's applying machine learning to authentication logs, trying to detect anomalies 
that rule-based detection misses.

"Look at this," he shows Angua. "User logs in at 9:00 from Ankh-Morpork. Then at 9:15 AM from Tsort. Physically 
impossible. But our rules only flag it if it's the same session. Different sessions, we miss it."

"Impossible travel," Angua says. "Classic indicator of compromised credentials."

"Right. But there are more subtle patterns. Users who normally work 9-5 suddenly logging in at 15:00. Access 
patterns changing. Unusual sequences of actions. Machine learning can detect these."

## What they built

Dr. Crucible implements User and Entity Behaviour Analytics (UEBA) as a Graylog pipeline. Custom Python processors 
analyse authentication events, access patterns, command histories.

Baseline calculation: 90 days of normal behaviour per user. Login times, access locations, systems accessed, command 
patterns, data volumes transferred.

Feature extraction for ML model:

- Login time deviation from normal
- Geographic anomalies
- Access pattern changes
- Privilege escalation attempts
- Volume anomalies

Isolation Forest algorithm detects outliers. Anomaly scores 0-1. Scores above 0.7 trigger SOC alerts.

User context matters. Developer accessing production at 2 AM during incident response? Not anomalous. Same developer 
accessing production at 2 AM on Saturday with no incident? Very anomalous.

Entity behaviour extends beyond users: service accounts, API keys, applications. A service account suddenly accessing 
new databases? Alert.

False positive rate starts high (18%). Tuning over three months drops it to 3.2%. Angua provides feedback on every 
alert, training the model.

First major catch: compromised service account. Behaving normally for weeks (attackers were patient), then 
suddenly exfiltrating data at unusual volume. ML model scored it 0.89. Alert fired. Incident response: 15 minutes 
from detection to containment.

## Runbooks

* UEBA pipeline implementation
* Baseline calculation
* Feature engineering
* Model training
* Alert tuning
* Integration with SOC workflows

## Related

- [Blue team @SOC](../../soc/index.rst)
- [Machines learning](https://indigo.tymyrddin.dev/docs/ml/)

