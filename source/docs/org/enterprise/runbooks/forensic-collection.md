# Forensic data collection

When a honeypot is accessed, Angua does not want to know only that someone was there. She wants to know everything: every command typed, every query submitted, every file touched, every tool uploaded. The attacker's behaviour inside a honeypot is forensic gold, providing intelligence that cannot be obtained any other way. The three-hour session on the SSH honeypot in December 2025 was not a security incident; it was, in Dr. Crucible's words, an extremely informative field study conducted entirely at the attacker's expense.

## SSH honeypot forensic collection

OpenCanary logs every interaction with the SSH honeypot at the keystroke level. All session recordings are captured automatically.

Data collected per SSH session:

- Authentication attempts (username, password, timestamp, source IP)
- Full keystroke log (every key pressed, including corrections and deletions)
- Command execution log (parsed commands and arguments)
- File access log (files read, created, or modified in the fake filesystem)
- Network connections initiated from within the fake shell
- Uploaded files (binaries, scripts)
- Session duration and total bytes transferred

The session recording format is compatible with the `script` terminal recording tool. Sessions can be replayed using:

```
scriptreplay --timing=session-timing.txt session-typescript.txt
```

All SSH session data is written to `/var/log/opencanary/sessions/` on the honeypot VM and forwarded to Graylog in real time via syslog.

## Database honeypot forensic collection

Every SQL query submitted to the PostgreSQL honeypot is logged in full. OpenCanary captures:

- Connection metadata (source IP, port, timestamp)
- Authentication attempt (username, password)
- All SQL statements executed in the session
- Query timing (how long each query took, which reveals whether the attacker is running automated tools or exploring manually)

```
# Example Graylog entry for a DB honeypot event
{
  "event_type": "opencanary.db.query",
  "src_ip": "100.64.1.45",
  "dst_port": 5432,
  "username": "postgres",
  "password": "postgres",
  "sql_query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  "session_id": "db-session-20251218-143022",
  "timestamp": "2025-12-18T14:30:22.341Z"
}
```

## HTTP and API token forensic collection

For HTTP-based canary tokens (honeydoc beacons, the Flask API honeypot), full request details are captured:

- Source IP and geolocation
- HTTP method and path
- All request headers (including User-Agent, which often reveals the tool or browser used)
- Request body (for POST requests)
- Referrer header (can reveal how the attacker navigated to the endpoint)
- Response code returned

The Flask API honeypot captures the full request object and logs it as structured JSON:

```
@app.before_request
def log_all_requests():
    log_entry = {
        "event_type": "honeypot_http_request",
        "source_ip": request.headers.get('X-Forwarded-For', request.remote_addr),
        "method": request.method,
        "path": request.path,
        "user_agent": request.headers.get('User-Agent'),
        "headers": dict(request.headers),
        "body": request.get_data(as_text=True)[:4096],
        "timestamp": datetime.utcnow().isoformat()
    }
    syslog.syslog(syslog.LOG_ALERT, json.dumps(log_entry))
```

## AWS credential token forensic collection

When a fake AWS credential is used, AWS CloudTrail records the API call. CloudTrail events are forwarded from the canary AWS account to Graylog via an SNS-to-Lambda-to-Graylog pipeline.

Data captured per CloudTrail event:

- IAM access key used
- API action attempted (e.g. `sts:GetCallerIdentity`, `s3:ListBuckets`)
- Source IP address
- User agent (the AWS SDK or CLI tool used)
- AWS region the request was made to
- Whether the request succeeded or was denied (all will be denied; the account has no permissions)

The API actions attempted often reveal the attacker's goals: an attacker who immediately tries `iam:ListRoles` is looking for privilege escalation paths; an attacker who tries `s3:ListBuckets` is looking for data.

## Forensic storage

All forensic data is stored in a dedicated Hetzner Object Storage bucket: `honeypot-forensics.golemtrust.am`. The bucket has:

- Immutable object lock enabled (Compliance mode, 30-day retention)
- Versioning enabled
- Access logging enabled (writes to `honeypot-forensics-access-log.golemtrust.am`)
- No public access
- Access restricted to the forensics-writer service account (write-only from honeypot VMs) and the security-analyst service account (read-only for Angua and Dr. Crucible)

Objects are stored with the path structure:

```
honeypot-forensics.golemtrust.am/
  ssh/
    YYYY/MM/DD/
      session-{uuid}.log
      session-{uuid}-timing.txt
      session-{uuid}-metadata.json
  db/
    YYYY/MM/DD/
      session-{uuid}.json
  api/
    YYYY/MM/DD/
      request-{uuid}.json
  aws-cloudtrail/
    YYYY/MM/DD/
      cloudtrail-{uuid}.json
```

The 30-day immutable retention ensures forensic data cannot be deleted or modified during an active investigation or the immediate aftermath of an incident.

## Automated MISP event creation

When a honeypot is accessed, a Graylog alert webhook triggers a script that creates a MISP event automatically:

```
# /opt/security/tools/honeypot-to-misp.py
import requests
import json

def create_misp_event(alert_data):
    misp_event = {
        "Event": {
            "info": f"Honeypot access: {alert_data['event_type']} from {alert_data['src_ip']}",
            "distribution": 0,
            "threat_level_id": 2,
            "analysis": 1,
            "tags": [
                {"name": "tlp:amber"},
                {"name": "golemtrust:honeypot"},
                {"name": "type:honeypot-access"}
            ],
            "Attribute": [
                {
                    "type": "ip-src",
                    "category": "Network activity",
                    "value": alert_data['src_ip'],
                    "comment": f"Attacker IP from {alert_data['event_type']}"
                }
            ]
        }
    }

    if alert_data.get('malware_hash'):
        misp_event["Event"]["Attribute"].append({
            "type": "md5",
            "category": "Payload delivery",
            "value": alert_data['malware_hash'],
            "comment": "Malware uploaded to SSH honeypot"
        })

    if alert_data.get('mitre_technique'):
        misp_event["Event"]["Attribute"].append({
            "type": "text",
            "category": "External analysis",
            "value": alert_data['mitre_technique'],
            "comment": "ATT&CK technique observed"
        })

    response = requests.post(
        f"{MISP_URL}/events/add",
        headers={"Authorization": MISP_API_KEY},
        json=misp_event
    )
    return response.json()
```

## The December 2025 SSH honeypot incident

An attacker accessed the SSH honeypot on 18 December 2025 at 14:22 UTC and maintained a session for 3 hours and 7 minutes. Key intelligence collected:

Timeline of the session: authenticated with `root:password` at 14:22. Spent the first 20 minutes running reconnaissance commands (`uname -a`, `whoami`, `id`, `cat /etc/passwd`, `netstat -tulpn`, `ps aux`). Uploaded a compiled ELF binary at 14:43 (MD5 hash recorded; binary identified as a modified Mirai variant via VirusTotal API). Attempted to reach internal hosts (`ping 10.0.0.1` through `ping 10.0.0.254`). These connections failed because the honeypot has no route to the real internal network. Spent the final hour trying various privilege escalation techniques on the fake shell. Disconnected at 17:29.

Intelligence extracted: source IP added to MISP as a Network Activity indicator. The Mirai variant binary added as a Malware Sample attribute. ATT&CK techniques T1059.004 (Unix Shell), T1046 (Network Service Scanning), and T1068 (Exploitation for Privilege Escalation) added as galaxy clusters. The MISP event was shared with TLP:AMBER to the financial sector ISAC information sharing group, where two other members confirmed the same IP had accessed their honeypots within the same 24-hour window.

Total cost to Golem Trust: approximately 15 minutes of Angua's time reviewing the forensic data. Total intelligence value: confirmed attribution for a threat actor group that was subsequently observed in a real attack against a different financial institution.
