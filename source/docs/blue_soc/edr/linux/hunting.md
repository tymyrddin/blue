# Threat Hunting with Open Source

| Tool	    | Purpose	                    | Command example                 |
|----------|-----------------------------|---------------------------------|
| Osquery	 | SQL-based endpoint queries	 | `SELECT * FROM process_events`    |
| Falco	   | Behavioral detection	       | `falco -r rules/falco_rules.yaml` |
| Lynis	   | Compliance auditing	        | `lynis audit system`              |