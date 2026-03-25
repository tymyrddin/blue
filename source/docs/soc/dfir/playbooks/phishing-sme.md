# Phishing campaign response playbook (SME, 50-250 staff)

## Trigger

Any of these indicates a phishing campaign:
- Multiple staff report suspicious emails with similar characteristics
- Staff report clicking links or opening attachments in suspicious emails
- Email security system flags unusual volume of similar messages
- External warning about phishing campaign targeting your sector
- User reports unexpected password reset requests or MFA prompts
- Accounts showing unusual activity after suspicious email

Single report: Might be isolated, but investigate immediately.  
Multiple reports within hours: Assume active campaign, follow this playbook.

## Immediate actions (first 15 minutes)

### 1. Confirm it is phishing

IT/Security team:
- Get screenshot or forward of the suspicious email (use "forward as attachment" to preserve headers)
- Check sender address, links (hover without clicking), attachments
- Look for common signs: urgency, threats, unexpected requests, slight misspellings in sender domain
- Search mail logs for similar messages to other staff

If confirmed phishing:
- Note the time window (when did emails arrive?)
- Identify the lure (what's it pretending to be? Invoice? HR notice? CEO request?)
- Check if it's credential phishing (fake login page) or malware delivery

### 2. Contain immediately

IT/Security team actions:

Stop further delivery:
- Block sender addresses in email gateway
- Create mail flow rule to quarantine similar messages
- Search and delete remaining copies from all mailboxes (if your email system allows)

Identify victims:
- Search logs for who received the emails
- Identify who clicked links (check email security logs, web proxy logs)
- Identify who opened attachments (check endpoint logs if available)
- Create list of affected users for follow-up

### 3. Alert the response team

Notify immediately:
- IT Manager/CISO
- HR (may need to communicate to staff)
- Management (if credentials compromised or data accessed)

Status update template:
```
Phishing campaign detected at [time]
Emails sent to: [number] staff
Known clicks: [number]
Type: [credential theft/malware/BEC]
Actions taken: [blocked sender, quarantined emails]
Next steps: [user notifications, credential resets]
```

## Investigation (next 30-60 minutes)

### 4. Assess who is affected

For everyone who received the email:
- Create list by department
- Note who's in sensitive roles (finance, HR, executives)

For everyone who clicked:
- Did they enter credentials? (Check for successful/failed logins from unusual locations)
- Did they download malware? (Scan their endpoints immediately)
- Did they reply or provide information? (Check sent items)
- What access do they have? (Shared drives, financial systems, customer data)

Priority for investigation:
1. Finance staff (BEC risk)
2. IT/admin accounts (privilege escalation risk)
3. Executives (high-value targets)
4. Everyone else

### 5. Check for compromise

If credentials potentially stolen:
- Review login activity for affected accounts (unusual locations, times, failed attempts)
- Check for mail rules created (forwarding, deletion, hiding)
- Review sent items for any unusual messages
- Check for password reset requests
- Look for MFA changes or new devices registered

If malware potentially delivered:
- Isolate affected endpoints from network
- Run full antivirus scan
- Check for suspicious processes or scheduled tasks
- Review recent file modifications
- Look for lateral movement attempts

If sensitive action requested (BEC scenario):
- Check if any payments were initiated
- Review any data or files that were shared
- Verify if any credentials or access was provided

### 6. Document everything

Keep detailed records:
- Email headers and full message source
- List of recipients and their actions
- Timeline of discovery and response
- Evidence of compromise (screenshots, log excerpts)
- Actions taken and by whom

## Response actions (next 2-4 hours)

### 7. Contain compromised accounts

For accounts where credentials were entered:

Immediate (do this now):
- Force password reset
- Revoke all active sessions
- Remove any suspicious mail rules
- Check for and remove any delegated access
- Enable MFA if not already active

Within 24 hours:
- Review account activity for past 7 days
- Check for any data exfiltration
- Verify no backdoor access created
- Monitor for reuse attempts

### 8. Clean infected endpoints

If malware suspected or confirmed:
- Isolate from network immediately
- Run full scan with updated antivirus
- Check startup items and scheduled tasks
- Review browser extensions and installed applications
- Consider full reimaging if serious infection

Validate clean before reconnecting:
- Run multiple scan tools
- Verify no persistence mechanisms
- Test network behaviour
- Monitor closely for 48 hours after reconnection

### 9. Prevent further damage

Email security:
- Add IOCs to blocklist (sender domains, URLs, file hashes)
- Increase monitoring for similar patterns
- Enable additional warnings for external emails if not already active

User accounts:
- Review privileged accounts more thoroughly
- Check for any new accounts created
- Verify group memberships haven't changed
- Review recent permission changes

Financial systems (if BEC risk):
- Alert finance team to verify any pending transactions
- Increase verification requirements temporarily
- Review recent payment requests and approvals

## Communication

### To affected users (within 2 hours)

For those who received but didn't click:
```
Subject: Security Alert - Phishing Email

A phishing email was sent to you today with subject "[subject]" 
from "[sender]".

If you didn't click any links or open attachments: No action needed. 
We've removed the email and blocked the sender.

If you did click or respond: Contact IT immediately at [contact]. 
Do not use the affected account until we've confirmed it's secure.

How to recognize phishing: [link to quick guide]
```

For those who clicked (call them directly, then follow with email):
```
Subject: Urgent - Account Security Action Required

You clicked a link in today's phishing email. We need to secure 
your account immediately.

Actions we're taking:
- Forced password reset (you'll receive instructions)
- Session termination
- Account monitoring

Actions you must take:
- Change your password immediately when prompted
- Check your sent items for unexpected emails
- Report any unusual account activity
- Contact IT at [number] if you have questions

This is precautionary and standard procedure. 
Your quick reporting helped contain this incident.
```

### To all staff (within 4 hours)

```
Subject: Security Incident - Phishing Campaign

A phishing campaign targeted our organisation today. We've contained 
the incident and are monitoring affected accounts.

What happened:
Phishing emails impersonating [lure] were sent to staff between 
[time] and [time] today.

Current status:
- Threat contained
- Affected accounts secured
- No confirmed data breach at this time

What you should do:
- Be extra vigilant for suspicious emails
- Verify unexpected requests via phone or in person
- Report suspicious emails to [email/button]
- Don't click links in emails unless you're certain they're legitimate

Red flags for phishing:
- Unexpected urgency or threats
- Requests for passwords or sensitive data
- Spelling mistakes in sender addresses
- Generic greetings ("Dear user" instead of your name)

Questions: Contact IT at [contact]

Next update: [timeframe if ongoing]
```

### To management (within 6 hours)

Executive briefing:
- Scale of campaign (emails sent, clicks, compromises)
- Type of attack (credential theft, malware, BEC)
- Potential impact (data access, financial risk, operational disruption)
- Actions taken (containment, remediation, monitoring)
- Ongoing risks (what we're still investigating)
- Estimated time to full resolution
- Costs (if any: incident response, additional tools, lost productivity)
- Recommendations (improvements to prevent recurrence)

## Recovery (24-48 hours)

### 10. Validate containment

Confirm no ongoing compromise:
- Monitor affected accounts for 48 hours
- Watch for reinfection attempts
- Check for attempts to regain access
- Verify no lateral movement occurred
- Review logs for any missed indicators

### 11. Complete remediation

Close all loose ends:
- Ensure all affected accounts have new passwords
- Verify MFA is enabled where required
- Confirm all malware is removed
- Remove any attacker-created accounts or access
- Document final impact assessment

### 12. Lessons learned session

Within one week, review with team:
- How was the campaign detected?
- What worked well in response?
- What slowed us down or went wrong?
- Did technical controls help or hinder?
- Were users prepared to recognize and report?
- What would we do differently?

Update this playbook with findings.

## Prevention (ongoing)

### Immediate improvements (this week)

Email security:
- Review and tune spam/phishing filters
- Implement DMARC, SPF, DKIM if not already active
- Add external email warnings if missing
- Block dangerous attachment types (.exe, .js, .vbs, macros)

User awareness:
- Send examples of the actual phishing email as training
- Share what gave it away
- Remind users how to report suspicious emails
- Praise those who reported quickly

Technical controls:
- Enforce MFA on all email and critical systems
- Implement privileged access management
- Review and limit email auto-forwarding
- Enable mailbox auditing

### Medium-term improvements (this month)

Training program:
- Schedule regular phishing simulations
- Track who clicks and provide targeted training
- Make reporting easy (button in email client)
- Reward good security behaviour

Monitoring:
- Set up alerts for suspicious login patterns
- Monitor for mail rule creation
- Alert on large file downloads/uploads
- Track failed login attempts

Process improvements:
- Payment verification procedures (callback on known number)
- Approval workflows for sensitive actions
- Regular access reviews
- Clear incident reporting procedures

### Measure effectiveness

- Phishing reporting rate (higher is better)
- Click rate on simulations (lower is better)
- Time to detection (faster is better)
- Time to containment (faster is better)

Track these over time to show improvement.

## Decision Points

### Do we need external help?

Call incident response firm if:
- Suspected nation-state or APT involvement
- Widespread malware infection beyond your capability
- Evidence of significant data exfiltration
- You're overwhelmed and need expert assistance
- Insurance requires professional response

You can probably handle internally if:
- Standard credential phishing with limited clicks
- No confirmed compromise or contained quickly
- Clear understanding of scope and impact
- Team has capacity to respond and remediate

### Do we report this incident?

Consider reporting to:

Law enforcement:
- If financial fraud occurred or was attempted
- If you want to contribute to broader threat intelligence
- Optional in most cases, but can provide useful information

Information sharing partners:
- Sector-specific ISACs or information sharing groups
- Peer organisations to warn them
- Email providers (report phishing domains)

Regulators (if required):
- Data protection authority if personal data accessed (GDPR 72-hour rule)
- Sector regulators if you're in critical sectors (NIS2, financial services, etc.)
- Only if actual breach occurred, not just attempted phishing

Document your decision and reasoning.

## Key contacts

| Role                   | Name | Email | Mobile | Backup |
|------------------------|------|-------|--------|--------|
| IT Manager             |      |       |        |        |
| Security Lead          |      |       |        |        |
| HR Director            |      |       |        |        |
| Finance Director       |      |       |        |        |
| Legal Counsel          |      |       |        |        |
| External IT Support    |      |       |        |        |
| Incident Response Firm |      |       |        |        |

Email security vendor: \[Name] - \[Support contact]  
Endpoint security vendor: \[Name] - \[Support contact]  
Cyber insurance: \[Provider] - \[Policy number] - \[Claims contact]

## Tools and resources

Email investigation:
- Message header analyzer: https://mha.azurewebsites.net/
- URL checker: https://www.virustotal.com/
- Email verification: https://haveibeenpwned.com/

Phishing databases:
- Report phishing: https://www.phishtank.com/
- PhishTank lookup
- APWG reporting

User training:
- Phishing examples and training materials
- Report suspicious email button/alias
- IT security contact details

## Version control playbook

Current Version: 1.0  
Last Updated: \[Date]  
Next Review: \[Date]  
Owner: \[Name]

Update after:
- Any phishing incident (within 1 week)
- Changes to email systems or security tools
- Staff responsible for response change
- Every 6 months minimum

## Appendix: Common phishing types

Credential phishing:
- Fake login pages for email, Microsoft 365, banking
- Impersonates legitimate services
- Goal: steal usernames and passwords

Business email compromise (BEC):
- Impersonates executives or vendors
- Requests urgent wire transfers or gift cards
- Targets finance and administrative staff

Malware delivery:
- Malicious attachments or download links
- Often invoice or document themed
- Installs ransomware, trojans, or spyware

Data gathering:
- Requests sensitive information directly
- Impersonates HR, IT, or management
- Collects data for targeted attacks

Link manipulation:
- Legitimate-looking but fake URLs
- Slight misspellings (paypa1.com)
- URL shorteners hiding real destination

Know your organisation's most likely threats and prioritise monitoring for those patterns.

```{raw} html
<div class="page-post-card__link">
    <a href="https://tymyrddin.dev/contact/">
      See something you like? Let’s create your custom playbook.
    </a>
</div>
```
