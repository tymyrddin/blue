# Engagement planning

Carrot insists on rules of engagement before Mr. Teatime so much as looks at a keyboard. This is not a lack of trust; Carrot has a great deal of trust in Mr. Teatime's competence. It is precisely that competence which makes clear planning essential. An unplanned engagement by Mr. Teatime would be like an unplanned Assassins' Guild contract: someone would definitely end up very thoroughly handled, and it might not be the right someone.

## Engagement types

Golem Trust runs five categories of red team engagement, each serving a different purpose.

Full-scope penetration test runs quarterly. The red team operates with no constraints other than the standing rules of engagement, starting from an external attacker position with no prior knowledge beyond what is publicly available. Duration: two weeks. Authorisation: Carrot and Adora Belle.

Assumed breach starts with the red team already inside the perimeter, simulating a scenario where an attacker has established an initial foothold via a method that was not caught. Mr. Teatime's team is given a low-privilege account on an internal system and instructed to escalate and move laterally. Duration: one week. Authorisation: Carrot.

Physical security test assesses the warehouse and office facilities. Mr. Teatime has, on two occasions, walked out of the building carrying a cardboard box and a look of bored administrative purpose. The box contained nothing; the point was made. Duration: one to two days. Authorisation: Carrot and Adora Belle, and a letter for Mr. Teatime to show the Watch if stopped.

Social engineering campaigns test staff susceptibility to phishing and pretexting. Given that Sam Vimes Jr. has now clicked on a phishing link in every single exercise, these campaigns serve a dual purpose: measurement and targeted training. Duration: two weeks. Authorisation: Carrot and Adora Belle.

Purple team exercise is a collaborative engagement where both red and blue teams know an exercise is occurring. Mr. Teatime announces the technique at the start of each scenario. The purpose is detection improvement, not surprises. Duration: one day per month. Authorisation: Carrot. Angua is informed.

## Engagement planning document

Before any engagement begins, Mr. Teatime completes an engagement planning document. The template lives at `security/red-team/engagement-template.md`. A completed example:

```
# Engagement plan: Q1 full-scope penetration test

## Objective
Exfiltrate Royal Bank customer data from the payments-service namespace
or demonstrate the capability to do so.

## Scope
In scope:
  - All internet-facing Golem Trust services
  - Internal network (once foothold established)
  - Teleport jump hosts
  - Kubernetes API server
  - Keycloak authentication
  - Royal Bank integration endpoints

Out of scope:
  - Customer data at rest (do not actually download)
  - Production write operations (read-only to customer data)
  - Royal Bank's own infrastructure
  - Physical access (separate engagement type)
  - DNS infrastructure of external providers

## Duration
Start: [REDACTED - see approval]
End: [REDACTED - see approval]

## Team
Lead: Mr. Teatime
Members: Regards, Chickenwire (Überwald contractors)

## Rules of engagement
1. No production writes.
2. No actual exfiltration of real customer data; demonstrate capability
   by capturing a sample of 5 rows maximum, immediately deleted.
3. No persistence mechanisms that survive engagement end date.
4. No denial of service, intentional or otherwise.
5. Emergency stop codeword: STANDDOWN-ICHOR
6. If real evidence of a third-party attacker is found, stop and notify
   Angua immediately.

## Approval signatures
Proposed by: Mr. Teatime
Approved by: Carrot
Signed off by: Adora Belle
Date: [DATE]
```

## Approval chain

The approval chain depends on engagement type:

| Engagement type | Proposed by | Approved by | Signed off by |
|---|---|---|---|
| Full-scope pentest | Mr. Teatime | Carrot | Adora Belle |
| Assumed breach | Mr. Teatime | Carrot | (none required) |
| Physical security | Mr. Teatime | Carrot | Adora Belle |
| Social engineering | Mr. Teatime | Carrot | Adora Belle |
| Purple team | Mr. Teatime | Carrot | (none required) |

Adora Belle's sign-off is required for any engagement that involves staff deception (social engineering) or full external simulation. This is not because Adora Belle distrusts Mr. Teatime. She has said, clearly, that she simply wants to know before her staff start receiving fake emails about their pension contributions.

## Angua notification

Angua is notified that an engagement is running before it begins. She is not told:

- The specific techniques that will be used
- The start time within the engagement window
- The specific target systems

This is intentional. If Angua knew exactly when and how the attack would come, she would tune her detection for that specific pattern, which would not reflect real-world conditions. She knows only that "an engagement is active this week" and that the codeword `STANDDOWN-ICHOR` means she should stop treating alerts as real and call Mr. Teatime immediately.

Angua has noted that she finds this arrangement professionally irritating and operationally correct.

## Out-of-scope items

The following items are permanently out of scope for all engagements unless a separate authorisation is obtained:

- Customer data at rest (databases containing real Royal Bank customer records)
- Production write operations to any financial system
- Attacks on third-party infrastructure (Royal Bank's own systems, Hetzner management interfaces)
- Social engineering of Golem Trust customers (only staff are in scope)
- Any action that could cause unrecoverable damage to data or service

Out-of-scope items are written into the engagement plan and acknowledged by Mr. Teatime's signature. Mr. Teatime has never violated an out-of-scope boundary. He says this is because he respects the rules. Carrot believes this, mostly.

## Emergency standdown procedure

If a red team action accidentally causes real operational impact, the emergency stop procedure is:

1. Mr. Teatime or any team member calls out the codeword `STANDDOWN-ICHOR` on the red team Slack channel and by phone to Carrot.
2. All red team activity stops immediately. Tools are halted. No further actions.
3. Mr. Teatime calls Angua directly to explain what happened.
4. Angua takes over incident response, treating any red team changes as real incidents to remediate.
5. Mr. Teatime documents exactly what was done and in what order.
6. Engagement is suspended pending a review before resuming.

The codeword was chosen by Carrot. Mr. Teatime suggested "NIGHTSHADE" but Carrot felt that had unfortunate connotations.

## Engagement calendar

Engagements are scheduled in the security team's shared calendar under the "Red Team" category, visible only to Carrot, Adora Belle, and Mr. Teatime. The calendar entry contains only the engagement type and duration; the planning document is stored in the red team's private GitLab repository at `gitlab.golemtrust.am/security/red-team/engagements/`.
