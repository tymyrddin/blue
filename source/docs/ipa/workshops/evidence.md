# How to identify, interpret, and preserve digital traces in survivor support work

This interactive workshop introduces participants to the basics of digital evidence, its role in intimate partner 
abuse contexts, and how to recognise, handle, and preserve it without compromising legal or ethical integrity.

Duration: 2 hours (can be adjusted for shorter or longer formats)

## Learning outcomes

By the end of the session, participants will be able to:

* Recognise different types of digital evidence relevant to IPA cases
* Understand how digital evidence can be compromised
* Follow safe handling procedures that preserve survivor privacy and evidentiary value
* Know when and how to escalate to technical or legal experts
* Begin using tools (like IPA-SIEM or manual checklists) to support survivors

## Target audience

* Shelter intake staff
* Survivor support advocates
* Legal aid workers
* Community outreach workers
* Volunteers with minimal technical background

## Materials needed

* Projector and screen
* Handouts (sample screenshots, simple flowcharts, evidence log templates, [extra exercises](../guides/doc-evidence.md))
* Laptops with basic tools installed (if practical, e.g., for demo)
* Dummy phones or anonymised backup files for analysis demo
* Sticky notes, pens, flipchart

## Workshop structure

### Part 1: The Nature of Digital Abuse *(30 mins)*

#### Topics:

* What counts as “digital evidence” in IPA?
* Common forms:

  * Text messages, call logs
  * Spyware / stalkerware
  * Location tracking (Google Timeline, Find My iPhone)
  * App activity (e.g. WhatsApp, Google Photos)
  * Social media monitoring
  * Email and cloud account abuse

#### Activity:

* “Red Flags Brainstorm”: In small groups, list unusual device behaviours a survivor might report. Discuss whether these could indicate digital surveillance or abuse.

### Part 2: Evidence Lifecycle *(30 mins)*

#### Topics:

* How evidence is generated, stored, and erased
* Volatile vs persistent data
* Chain of custody basics
* Metadata, timestamps, and device logs
* Risks of modifying/deleting evidence accidentally

#### Activity:

* “What Not To Do” Scenario Roleplay: Discuss what happens if you screenshot messages, install antivirus, or factory reset a device too early.

### Part 3: Collection Do’s and Don’ts *(30 mins)*

#### Topics:

* Consent and survivor control: always ask first
* Safe ways to document: screenshots, notes, backups
* Using tools like ADB or iTunes without altering data
* When to use forensic tools (e.g. PiRogue, IPA-SIEM server)

#### Demo:

* Simple backup and log collection from a test Android or iPhone device (real or simulated)
* Highlight how data is transferred and where it’s stored

### Part 4: Preserving and Analysing Evidence *(20 mins)*

#### Topics:

* Using basic logs: what’s suspicious?
* How to encrypt and store logs
* Introduction to IPA-SIEM (just the basics)

  * Kibana screenshots showing stalkerware detection
  * What an alert looks like
  * When to act, when to ask for help

#### Activity:

* “Digital Clue Hunt”: Given anonymised data samples, participants work in groups to identify 2–3 suspicious signs in each one (e.g. strange processes, unauthorised logins)

### Part 5: Legal and Ethical Considerations *(10 mins)*

#### Topics:

* Survivor safety and digital evidence
* When evidence is admissible in court
* GDPR and UK DPA: storing personal data
* Working with police or legal aid
* Documentation and consent forms

### Wrap-Up and Q\&A *(10 mins)*

* Recap main points
* Resources list:

  * IPA-SIEM quickstart guides
  * Digital privacy checklists
  * Open-source analysis tools (like Autopsy, Wazuh dashboards)
  * Referral orgs (digital rights groups, local DFIR volunteers)

#### Handout:

* "Quick Reference: Handling Digital Evidence in IPA Contexts" PDF. Includes:

  * Checklist for what to ask survivors
  * Dos and don’ts
  * Who to contact for help
  * A template for evidence logs

## Optional add-ons

* Follow-up Session: How to safely communicate with survivors being digitally surveilled
* Tech Volunteer Training: For people wanting to help configure IPA-SIEM or analyse logs
* Legal Briefing Module: Presented by a local solicitor or barrister on using digital evidence in restraining orders or prosecutions
