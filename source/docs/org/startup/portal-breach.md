# The Seamstresses' Guild portal breach

It's 14:47 when Angua joins. She's working her first night shift in the new Security Operations Center (a generous 
term for the desk in the corner with three monitors). She's hired specifically because she has "excellent instincts 
for suspicious activity." Being a werewolf helps with pattern recognition.

"Something smells wrong," Angua says to no one in particular. She's reviewing web server logs manually because they 
don't have proper monitoring yet. Someone's been probing the Seamstresses' Guild portal.

Not just probing. They've been at it for three days. Systematic. Patient. Testing for SQL injection, directory 
traversal, authentication bypass. Nothing triggered alerts because there weren't any alerts to trigger.

Angua calls Carrot. Then Ponder. Then Adora Belle. By 16:00, everyone's in the warehouse.

"We've been blind," Carrot says, reading through the logs. "We have application logs, web server logs, and system logs. 
But they're just sitting in files. No correlation. No alerting. No visibility."

"We need eyes," Dr. Crucible says. He's the newest hire, from Unseen University's former threat research department. 
"Real eyes. Not just hoping someone notices something in a logfile at just that time."

## What they built

Dr. Crucible and Angua deploy [Graylog](https://graylog.org/releases/) as their centralised logging platform. Three 
nodes form a cluster: one master cloud instances and two additional nodes (each on an instance). 
[OpenSearch](https://github.com/opensearch-project/OpenSearch/releases) provides the backend search engine. 
[MongoDB](https://www.mongodb.com/docs/manual/release-notes/) stores metadata.

Every system sends logs to Graylog. Web servers, applications, databases, firewalls, authentication systems. Everything.

Angua creates the first detection rules. Failed authentication spike detection (more than 10 failures from a single 
IP in 5 minutes). Unusual access patterns (like the Seamstresses' Guild portal accessed between 2:00-4:00 with 
curl/wget user agents). Source country checks (their customers are all in Ankh-Morpork or nearby city-states).

Alerts route to a dedicated Slack channel. Then email. Then SMS if no one acknowledges within 10 minutes.

[Prometheus](https://github.com/prometheus/prometheus/releases) and 
[Grafana](https://github.com/grafana/grafana/releases) join Graylog. Node exporters on every server. Custom 
exporters for application metrics. Dashboards for everything Adora Belle wants to track (which is everything).

The attacker returns a week later. Angua catches them in 90 seconds.

## Runbooks

* Graylog cluster deployment
* OpenSearch configuration
* Input setup
* Stream rules
* Alert configuration
* Prometheus deployment
* Grafana dashboards
* Alert tuning


