# Threat intelligence for simulation campaigns

Each monthly simulation should reflect a technique currently being used in the wild.
This requires the security team to maintain awareness of what phishing campaigns are
actually doing, updated at least monthly before each simulation cycle. This page
describes where to look, what to look for, and how to translate what you find into
a Gophish campaign.

## Sources

Microsoft publishes threat intelligence through the Defender Threat Intelligence portal
and through the Microsoft Security Blog. The blog's incident and campaign write-ups
describe specific phishing campaigns in enough detail to understand the technique, the
payload structure, and the evasion method used. Filter for posts tagged with phishing,
BEC (business email compromise), and credential harvesting.

The SANS Internet Storm Center publishes daily handler diaries that frequently cover
current phishing techniques with technical detail. The diary entries are short and
practical. Check them weekly.

PhishTank is a community database of submitted phishing URLs. It shows what is active
right now, which landing page designs are in use, and which services are being abused
as redirect hosts. Browse it before each simulation cycle to see what the current
aesthetic is: what a convincing credential harvest page looks like today may differ
significantly from six months ago.

ANY.RUN and VirusTotal both allow searching recent malware and phishing submissions.
ANY.RUN's public task feed shows live analysis of phishing pages, including screenshots
of the landing page the victim sees. This is directly useful for crafting a realistic
Gophish landing page that matches what the current campaign landscape looks like.

Sector-specific intelligence is available through the Cybersecurity and Infrastructure
Security Agency (CISA) advisories and through European counterparts including ENISA
threat landscape reports. Non-profit and third-sector organisations are not the primary
focus of most of these publications, but BEC, credential harvesting, and grant fraud
campaigns targeting the sector are documented when they reach significant volume.

CERT-EU and national CERTs publish advisories when campaigns targeting European civil
society organisations are observed. Subscribe to the national CERT mailing list for the
Home's jurisdiction.

## What to look for

For each potential technique, establish:

- How does the email reach the inbox? If it is being caught by Defender at volume, it
  is not a useful simulation technique. Look for techniques described as currently
  active and effective.
- What is the evasion mechanism? QR codes, legitimate service hosting, HTML smuggling,
  and redirect chains each require a different Gophish configuration.
- What does the landing page look like? Is it a cloned Microsoft login, a document
  preview, a payment portal? The landing page design should match what the technique
  is actually producing in the wild.
- What is the pretext? Grant notification, invoice, shared document, account security
  alert? The pretext should be plausible for the Home's context.

## Current techniques and Gophish implementation notes

This section is updated each simulation cycle by the security team. Archive previous
entries rather than deleting them: the history of what has been used and when is part
of the programme record.

### QR code phishing

Observed consistently since 2023 and remaining effective as of early 2026 because
Defender cannot scan a URL embedded in an image.

In Gophish: do not use the `{{.URL}}` template variable in the email body. Instead,
after launching the campaign, copy the tracking URL from the campaign details page and
generate a QR code image pointing to it. Embed the image in the email template HTML.
The recipient scans the QR code on a mobile device. Defender does not process the image
content.

Effective pretexts: document approval requests, multi-factor authentication setup
prompts, package delivery notifications.

### Legitimate service redirect

The email contains a link to a genuine Microsoft or Google service. The link leads to
a OneDrive file, a SharePoint page, or a Google Docs document that contains the actual
phishing link. Defender allows the first link because the domain is trusted.

In Gophish: host a simple HTML page on OneDrive or SharePoint that contains a button
linking to the Gophish tracking URL. Use `{{.URL}}` to generate the tracking URL from
within the hosted document rather than the email body. The email body link points to
the OneDrive or SharePoint URL.

Effective pretexts: shared document notifications, grant application submissions,
collaboration requests from known partner organisations.

### HTML smuggling

The email contains an HTML attachment that assembles and downloads a file in the browser
using JavaScript. The attachment itself is clean at the point of scanning.

In Gophish: attach the HTML file to the campaign email. The landing page is the HTML
file itself rather than a hosted page. Configure the attachment in the email template.
The `{{.URL}}` variable can be embedded in the JavaScript within the HTML file so that
Gophish records the open event when the file executes.

Effective for demonstrating how attachments evade gateway scanning. Use with care in
the afternoon session: participants need some JavaScript familiarity to construct this
variant themselves.

## Selecting a technique for the current cycle

Before each monthly campaign, review the sources above and identify one technique that:

- Has been observed active in the past 60 days.
- Has not been used in the previous two simulation cycles.
- Can be implemented in Gophish and passes the payload testing runbook.
- Is plausible in the Home's context given the impersonation scenario.

Document the source that informed the selection in the programme record. If a technique
that passed the payload test is subsequently caught by Defender mid-campaign, note the
date and the approximate time. This tracks how quickly Defender's signatures respond to
active campaigns and informs how far in advance the payload test needs to run before a
campaign launches.
