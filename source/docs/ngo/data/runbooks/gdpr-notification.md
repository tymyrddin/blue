# GDPR notification

The GDPR requires notification to the supervisory authority within 72 hours of becoming
aware of a personal data breach, if the breach is likely to result in a risk to the rights
and freedoms of natural persons. The 72 hours is not a deadline for completing the
investigation. It is a deadline for making the first notification, even if incomplete.

This runbook is run by the DPO, supported by the incident lead and technical lead. It
starts the moment a personal data breach is confirmed or reasonably suspected.

## Step one: establish when the clock started

The 72-hour window begins when the organisation first becomes aware of the breach. This is
not when the breach occurred. It is when someone in the organisation knew or should
reasonably have known that a breach had occurred or was occurring.

Document the awareness timeline:
- When did the incident first come to the attention of any staff member?
- When was it escalated to someone with responsibility for data protection?
- When was it confirmed as a personal data breach rather than a suspected one?

The DPO makes the determination of when awareness is established for GDPR purposes.
Document the reasoning. This decision will be scrutinised if the supervisory authority
investigates the timeline.

Calculate the 72-hour deadline from the awareness moment and record it prominently in
the incident log.

## Step two: assess notification obligation

Not every personal data breach requires supervisory authority notification. Notification
is required if the breach is likely to result in a risk to the rights and freedoms of
natural persons. Notification is not required if the breach is unlikely to result in such
a risk. The DPO makes this assessment.

Factors that increase risk:
- Volume of personal data involved.
- Sensitivity of the data: health data, DBS records, financial data, data about
  vulnerable individuals.
- Nature of the breach: exfiltration is higher risk than accidental internal exposure.
- Potential for harm to individuals: identity fraud, discrimination, physical risk,
  reputational harm.
- Whether the data has been encrypted or whether the attacker has functioning copies.

For an incident involving resident medical records and volunteer DBS reference numbers,
the assessment is almost certainly that notification is required. Document the assessment
and the reasoning regardless of the conclusion.

## Step three: assess individual notification obligation

If the breach is likely to result in a high risk to the rights and freedoms of individuals,
those individuals must also be notified directly and without undue delay. High risk is a
higher threshold than the supervisory authority notification threshold.

High risk factors include: the data is sensitive in nature, there is a credible risk of
harm such as identity theft or physical risk, the individuals cannot protect themselves
without knowing about the breach.

For resident medical records: high risk is very likely to apply. Residents or their
representatives must be notified.

For volunteer DBS records: high risk assessment depends on whether the data creates a
credible harm pathway. DBS reference numbers alone are less sensitive than DBS certificate
content, but in combination with name, address, and role information they may enable
targeting. The DPO assesses.

## Step four: notify the supervisory authority

Notification is made to the national data protection supervisory authority. In the UK,
this is the ICO. In Ireland, the DPC. In Germany, the relevant state authority. The
Home's supervisory authority is determined by its EU establishment or, for UK organisations,
the ICO.

The notification must include:
- The nature of the breach: what happened.
- The categories and approximate number of individuals concerned.
- The categories and approximate number of personal data records concerned.
- The likely consequences of the breach.
- The measures taken or proposed to address the breach, including mitigation.
- The name and contact details of the DPO.

Use the supervisory authority's online notification portal. Most EU and UK authorities
have a standardised form. Complete it with what is known at the time. If the investigation
is not complete, state this and provide an initial notification with a commitment to update.

Record the submission time and the reference number provided by the authority.

## Step five: notify individuals if required

If individual notification is required, the notification must:
- Describe the nature of the breach in clear language.
- Provide the name and contact details of the DPO.
- Describe the likely consequences.
- Describe the measures taken.
- Give individuals specific, practical recommendations for protecting themselves.

Do not use jargon. Do not use legal language. Do not minimise. The notification is being
sent to people who trusted the organisation with their data.

Prepare the individual notification text in collaboration with the communications lead.
The DPO approves the content. The incident lead approves the send.

Notification channels: for individuals with email addresses on file, email is appropriate.
For individuals where email is not available, written notification to the address on record.
For residents whose capacity to receive and process the notification is uncertain, notify
their designated contact or next of kin.

Record who was notified, through which channel, and when.

## Step six: maintain the notification record

The GDPR requires that all breaches be documented, including those where the risk
assessment concludes that supervisory authority notification is not required.

The incident record must contain:
- Description of the breach.
- The data involved.
- The awareness timeline and the DPO's determination of when the 72-hour clock started.
- The risk assessment and its reasoning.
- Actions taken in response.
- Notification decisions and their reasoning.
- Copies of all notifications sent.
- Reference numbers from supervisory authority submissions.

This record is retained and available for supervisory authority review. Do not delete it.
