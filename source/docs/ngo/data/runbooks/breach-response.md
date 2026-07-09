# Breach response

This runbook covers the immediate response to a confirmed or suspected personal data
breach. Run it from the moment the incident is declared. The documentation lead records
every action and timestamp as steps are completed.

## Prerequisites

- Incident declared by the Head of IT or IT coordinator.
- SIRT roles confirmed: incident lead, technical lead, communications lead, documentation
  lead.
- DPO notified. This happens before the runbook starts.

## Immediate containment

1. Disable the compromised account or accounts in Entra ID immediately. Do not wait for
   the scope to be confirmed. If the account is known or suspected, disable it now.
   In the Entra ID admin centre: Users > select user > Block sign-in.
2. Revoke all active sessions for the disabled account.
   In the Entra ID admin centre: Users > select user > Revoke sessions.
   In PowerShell: `Revoke-AzureADUserAllRefreshToken -ObjectId <user-object-id>`
3. Reset the account password. Do not reactivate the account until the scope of
   compromise is understood.
4. For each application the compromised account had access to that does not use Entra ID
   SSO, disable the account in that application separately. At the Home, this includes
   Bestiary (local account in the Bestiary admin panel) and Covenant (Covenant admin
   interface). Check the Great Ledger Consortium account status with the membership
   coordinator.
5. Preserve the compromised machine. Do not wipe, reimage, or allow the user to
   continue using it. Isolate it from the network: disconnect the ethernet cable and
   disable Wi-Fi. Label it with the incident name and date and store it in a locked
   space. Evidence on the machine may be required.
6. Export and preserve logs before taking any further action on systems:
   - Entra ID sign-in logs: Entra ID admin centre > Monitoring > Sign-in logs.
     Export to CSV covering the period from 14 days before detection to present.
   - Entra ID audit logs: same location. Export the same period.
   - Exchange Online message trace for the compromised account: Exchange admin centre >
     Mail flow > Message trace. Cover the same period.
   - Application access logs for each affected system where available. For Bestiary,
     the access log is in the SQL Server audit log on the Bestiary server. For Covenant,
     access the audit trail in the Covenant admin interface.
7. Assess whether affected systems need to be taken offline. Taking Bestiary offline
   stops the Bestiary server from being used by an attacker but also stops Dr. Flannel
   and the medical team from accessing resident records. This decision requires the
   incident lead, not just the technical lead. Document the decision and the reason.

## Scope assessment

Once immediate containment is in place, establish what actually happened.

1. Identify the initial access vector. Review the preserved logs for the earliest sign
   of anomalous activity and work backward from there. What was the first action the
   attacker took? What account did they use first?
2. Identify lateral movement. From the initial access account, which systems did the
   attacker reach? Review authentication logs for each application the account had
   access to.
3. Identify what data was accessed or exfiltrated. For each system accessed, review
   the application-level access logs:
   - Bestiary: what queries were run, what records were returned, were any exports
     generated?
   - Covenant: what records were accessed, were any bulk exports or reports run?
   - Exchange Online: were any emails forwarded, were any large attachments sent
     externally, were inbox rules created?
   - SharePoint and OneDrive: were any files downloaded or shared externally?
4. Establish the timeline: when did the attacker first access the environment, when
   did they access each system, when was the last observed attacker activity?
5. Record all findings with supporting log evidence. The documentation lead maintains
   a running incident log with timestamps for every finding.

## Escalation triggers

Escalate to the Director immediately if any of the following are confirmed:
- Personal data of more than 100 individuals has been accessed or exfiltrated.
- Resident medical or case records have been accessed.
- The attacker has or had access to financial systems or payment data.
- There is evidence of ongoing attacker presence after containment steps were taken.
- Any party external to the organisation, including press or a regulatory body, makes
  contact about the incident.

## Parallel tracks

While the technical lead conducts the scope assessment, the incident lead runs three
parallel tracks:

The DPO assesses the GDPR notification obligation as soon as sufficient scope information
is available. This does not wait for the scope assessment to be complete. A preliminary
assessment based on what is known is sufficient to start the notification clock question.
The GDPR notification runbook covers this in detail.

The communications lead prepares internal messaging for staff who need to know: the
affected user or users, their line managers, and anyone whose work is affected by
systems being offline or accounts being disabled. Internal communications are factual,
calm, and approved by the incident lead before being sent.

The incident lead briefs the Director as soon as the incident is confirmed. The briefing
covers: what happened, what data is involved, what containment actions have been taken,
and what the GDPR position is. The briefing does not wait for the full scope assessment.

## Recovery

Recovery begins only when the scope assessment is complete and the DPO has confirmed the
notification position.

1. Confirm the attacker has been fully evicted from the environment before restoring
   any affected systems or accounts.
2. Rebuild or reimage the compromised machine using verified clean media. Do not restore
   from a backup taken after the initial access date.
3. Review and reset all credentials that may have been accessible from the compromised
   account: saved browser passwords, credentials stored in the compromised applications,
   any password manager entries accessible from the compromised machine.
4. Review and revoke any OAuth application consents granted during the incident period.
   Entra ID admin centre > Enterprise applications > review consents granted in the
   incident window.
5. Reactivate affected systems and accounts only after confirming clean rebuild.
6. Confirm with the DPO that all notification obligations have been met or are in
   progress before communicating to affected staff that the incident is resolved.
Last updated: 10 July 2026
