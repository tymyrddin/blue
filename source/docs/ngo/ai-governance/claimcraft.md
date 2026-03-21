# The ClaimCraft Incident

The finance team found ClaimCraft AI at a charity sector finance conference. The
pitch was elegant in its simplicity: upload your gift aid declarations, and the AI
validates eligibility, flags errors, and formats the the Guild of Tax Collectors batch submission. What
previously took three days of manual review took, with ClaimCraft, approximately
forty minutes. The price was competitive. The interface was clean. The finance
director signed up for the trial on the conference Wi-Fi.

The IT manager found out when the first bulk export was already scheduled.

## The export

Gift aid processing requires donor records. Specifically, it requires full legal names,
current addresses, donation amounts, dates, and the Guild of Tax Collectors reference numbers for each valid
declaration. The Home had gift aid declarations for approximately 38,000 donors. The
finance team prepared the export from Covenant: a spreadsheet with 38,000 rows and
eleven columns, including everything ClaimCraft required.

The business analyst, who had been included in the discussion after raising his hand
during a team meeting, pointed out that ClaimCraft's privacy policy contained the
following clause: "ClaimCraft may use aggregated and anonymised transaction data to
improve the accuracy and performance of our AI models."

The finance director read the clause and said that it said anonymised, so presumably
the data would be anonymised before any model training occurred.

The business analyst explained that 38,000 records containing full names, addresses,
amounts, and the Guild of Tax Collectors references formed a dataset where each row contained enough linked
attributes to uniquely identify most of the individuals involved, and that anonymisation
of such a dataset was a significantly more complex operation than simply removing the
name column. He used the phrase "quasi-identifier linkage attack." The finance director
wrote it down. It was the first time the finance director had written something in a
meeting with the business analyst.

The DPO had not been consulted. ClaimCraft had no Data Processing Agreement available
on their website. Their website's contact page had a form and a note saying responses
could take up to five business days.

The export went ahead. The IT manager received a calendar notification after the fact.

## ClaimCraft's infrastructure

ClaimCraft AI was eighteen months old, had nine employees, and was processing gift aid
submissions for 340 Circle Sea charities. Their infrastructure ran on a cloud provider
whose servers were, as the business analyst eventually established after several rounds of
email, located in Ankh-Morpork and on the Counterweight Continent. The data that crossed
to the Counterweight Continent was covered, ClaimCraft assured the IT manager, by Standard
Contractual Clauses.

The IT manager asked to see the SCCs. ClaimCraft said they would forward them from
their legal team. The legal team was, as best the IT manager could tell from context,
one person who also managed ClaimCraft's the Guild of Tax Collectors accreditation. The SCCs arrived eleven
days later as a PDF with no digital signature and a date that was two years before
ClaimCraft was founded.

Meanwhile, the 38,000 records had already been processed. The gift aid claims had
been submitted to the Guild of Tax Collectors. The process had worked exactly as advertised. The finance
director had saved three days of work and was very pleased.

## The acquisition

Eight months after the Home first used ClaimCraft, the business analyst found a press
release on the Clacks noticeboard. ClaimCraft AI had been acquired by The Assessors' Bureau, a
data analytics company that described its business as "enriching and activating donor
intelligence across the third sector." The Assessors' Bureau's product portfolio included a charity
prospect research database and a donor wealth screening service.

The acquisition terms stated that all existing ClaimCraft customer data and model
assets would transfer to The Assessors' Bureau as part of the transaction.

The business analyst forwarded the press release to the IT manager with no additional
comment. The IT manager forwarded it to the DPO with the subject line: "You may wish
to be sitting down."

The 38,000 donor records, including the gift aid declarations with amounts and the Guild of Tax Collectors
references, were now in the possession of a company whose primary business was selling
donor intelligence to the charity sector. The Assessors' Bureau's terms of service, updated post-
acquisition, stated that anonymised and aggregated data from their platform services
could be used to enrich their prospect research database.

Whether the re-identification risks the business analyst had described eight months
earlier were theoretical was now a less abstract question.

## The response

The DPO sent a formal data subject request to The Assessors' Bureau asking for confirmation of what
data they held relating to the Home's donors, under what legal basis it was held, and
whether it had been used to train or enrich any The Assessors' Bureau product.

The Assessors' Bureau's response confirmed that historical ClaimCraft processing data was retained
for model performance purposes and that this was covered under the original ClaimCraft
terms of service. They declined to confirm specifically what had been used in their
enrichment database on the grounds of commercial confidentiality.

The DPO escalated to the supervisory authority. The IT manager drafted a notification
to the 38,000 affected donors. The finance director sat in the notification drafting
meeting and did not, at any point, mention saving three days of work.

ClaimCraft's vacancy for a Data Protection Officer had been open on the Clacks noticeboard throughout
the period the Home had been using the service. The business analyst found it while
doing background research for the notification. She added it to the incident file
without comment.

## Related

- [What the departments have in mind](ai-policy.md)
- [The attack surface](ml-risks.md)
- [GDPR notification runbook](../data/runbooks/gdpr-notification.md)
- [Covenant](../applications/covenant.md)
