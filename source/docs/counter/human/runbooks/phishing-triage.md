# Phishing investigation and AiTM detection

Two hunts: email header analysis for a reported phishing message, and Entra sign-in
log analysis to detect AiTM (adversary-in-the-middle) token theft where MFA was
bypassed through a reverse proxy.

AiTM phishing does not defeat MFA cryptographically. It proxies the authentication in
real time: the victim authenticates to the proxy, the proxy forwards credentials and
the TOTP code to the real service, and receives a valid session token that is then used
independently. Detection is at the sign-in log layer: the session token issued to the
legitimate user and the session used from the attacker's IP are the same token, used
from different locations.

Data sources: raw message files in `.eml` format, retrieved from the quarantine or the
user's mailbox; Microsoft Entra ID sign-in logs via the Microsoft Graph PowerShell
module (`Connect-MgGraph -Scopes "AuditLog.Read.All"`).

## Email header analysis for a reported phishing message

Hypothesis: a user has forwarded a suspicious email. Extracting the delivery path,
sender authentication results, and embedded URLs is the triage starting point.

```python
#!/usr/bin/env python3
# header-triage.py: print delivery path and authentication results from an .eml file
import sys, email, email.policy

with open(sys.argv[1], 'rb') as f:
    msg = email.message_from_binary_file(f, policy=email.policy.default)

for hdr in msg.get_all('Received', []):
    print('Received:', hdr.strip().replace('\n', ' ')[:200])

for hdr in msg.get_all('Authentication-Results', []):
    print('Auth-Results:', hdr.strip()[:400])

print('From:          ', msg['From'])
print('Reply-To:      ', msg['Reply-To'])
print('Return-Path:   ', msg['Return-Path'])
print('X-Originating: ', msg.get('X-Originating-IP', 'not present'))
```

```bash
# extract all URLs from an .eml body (text/plain and text/html parts)
python3 - "$1" <<'EOF'
import sys, email, email.policy, re

with open(sys.argv[1], 'rb') as f:
    msg = email.message_from_binary_file(f, policy=email.policy.default)

body = ''
for part in msg.walk():
    if part.get_content_type() in ('text/plain', 'text/html'):
        body += part.get_content()

for u in sorted(set(re.findall(r'https?://[^\s"<>]+', body))):
    print(u)
EOF
```

SPF and DKIM results in `Authentication-Results` indicate whether the sending domain
authenticated successfully. A pass on both for a domain an organisation does not control
is expected for attacker-owned lookalike domains: the attacker controls
`company-invoices.net`, has valid SPF and DKIM, and the checks pass. DMARC alignment is
the relevant field: does the authenticated domain align with the header From address the
recipient saw?

A `Received` chain that terminates at an IP outside the sending domain's expected sending
ranges, or that shows a gap consistent with a proxy insertion, warrants further
investigation.

## AiTM token theft detection in Entra sign-in logs

Hypothesis: a user authenticated successfully through a reverse proxy. The session token
was replayed from a different IP address. The sign-in log shows a successful
authentication, but subsequent token use originates from an address that does not match
the authentication event.

```powershell
$startTime = (Get-Date).AddDays(-7).ToUniversalTime().ToString('o')
$upn       = 'user@example.com'

# sign-in events for the user: look at IP, MFA requirement, and status
Get-MgAuditLogSignIn -Filter "userPrincipalName eq '$upn' and createdDateTime ge $startTime" |
    Select-Object CreatedDateTime, IpAddress, AppDisplayName, ClientAppUsed,
        @{N='MFA';    E={$_.AuthenticationRequirement}},
        @{N='Result'; E={$_.Status.ErrorCode}},
        @{N='Detail'; E={$_.Status.AdditionalDetails}},
        ConditionalAccessStatus |
    Sort-Object CreatedDateTime
```

```powershell
# compare against a baseline window: surface IPs not seen in the prior 30 days
$baseline = (Get-Date).AddDays(-30).ToUniversalTime().ToString('o')
$window   = (Get-Date).AddDays(-7).ToUniversalTime().ToString('o')
$upn      = 'user@example.com'

$knownIPs = Get-MgAuditLogSignIn -Filter (
    "userPrincipalName eq '$upn' and " +
    "createdDateTime ge $baseline and createdDateTime lt $window"
) | Select-Object -ExpandProperty IpAddress | Sort-Object -Unique

Get-MgAuditLogSignIn -Filter (
    "userPrincipalName eq '$upn' and " +
    "createdDateTime ge $window and status/errorCode eq 0"
) |
    Where-Object { $_.IpAddress -notin $knownIPs } |
    Select-Object CreatedDateTime, IpAddress, AppDisplayName, AuthenticationRequirement |
    Sort-Object CreatedDateTime
```

A successful sign-in from an IP with no prior history for that user, where
`AuthenticationRequirement` shows MFA was satisfied, is consistent with AiTM token theft
but not conclusive on its own. Confidence increases when the IP resolves to a hosting
provider, subsequent API activity from that IP is inconsistent with the user's normal
behaviour, or a forwarding rule or OAuth consent event appears in the minutes following
the sign-in.

The Evilginx and Modlishka proxy frameworks produce exactly this pattern: a successful
TOTP-based authentication followed by session token replay from infrastructure the
defender does not recognise.
Last updated: 10 July 2026
