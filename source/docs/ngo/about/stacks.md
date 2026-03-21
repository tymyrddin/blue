# What they actually run

![Stacks used in NGO's](/_static/images/ngo-tools.png)

The technology stack of an NGO is never planned from first principles. It accumulates,
layer by layer, as each new need produces a new solution, and the solutions gradually develop
relationships with each other that nobody designed and everyone relies on. By the time anyone
looks at the full picture, it is usually too late to redesign it cleanly. The goal is to
understand it.

## Office productivity, and the email question

Every NGO needs email and somewhere to put files. These two requirements drive the first
major infrastructure decision, and the answer shapes everything that follows.

Microsoft 365 is the most common answer for medium and large organisations, partly on the
strength of the nonprofit grant programme, which provides access to the full suite at a price
that is genuinely hard to argue with. Google Workspace is equally common among smaller
organisations and advocacy groups, particularly those with a preference for simple
browser-based tools and a staff profile that skews younger. Some organisations use both,
because one department adopted one platform and the rest of the organisation adopted the
other and nobody ever resolved the tension. This is more common than vendors would like to
admit.

Document collaboration sits on top of whichever productivity platform was chosen, with a
layer of project management tools added by whichever team felt the need. Trello, Asana,
Notion, and their various competitors appear in most organisations at some scale, rarely
chosen centrally and rarely governed. They are where the work actually happens, which makes
them worth understanding even if they were never formally approved.

## CRM, and the question of where the data actually lives

Donor and membership management is the function most likely to involve a system that someone
purchased, configured, and then handed over to people who were not involved in either the
purchase or the configuration. The result is a CRM that does what was specified, mostly, and
is used for things that were not specified, also mostly.

Salesforce Nonprofit Cloud is the enterprise-tier answer: powerful, customisable, and
maintained by a small industry of consultants who specialise in it, because customisable also
means complex. CiviCRM is the open-source answer, widely used across Europe in organisations
that cannot afford the Salesforce licensing or the consultants and are willing to invest staff
time in maintenance instead. The third answer is whatever the sector-specific system is,
because many parts of the nonprofit world have purpose-built software that handles donor
management as part of a broader operational function: residency management, case management,
or volunteer coordination, depending on the mission.

The common factor is that the CRM is usually not integrated with the identity management
system, because integration projects cost money that the organisation did not have at the
moment it was needed. This means joiners, movers, and leavers are handled in two separate
processes, and occasionally in one process and not the other, and occasionally in neither.

## Finance, which is its own world

Accounting for NGOs is complicated by the need to track restricted funds, handle multi-year
grants with reporting obligations, and comply with whatever the national regulatory framework
requires. The finance team has almost always had more influence over the finance system than
IT, which means the finance system was selected, configured, and is maintained by people who
understand accounting rather than infrastructure. This is not unreasonable. It does produce
some interesting gaps.

The results range from SAP installations at large, well-funded organisations to QuickBooks
at small ones, with Sage Intacct, Exact Online, and various national-market systems in
between. Unit4 is common in the Nordics. Somewhere in almost every organisation, regardless
of what the official system is, there is also Excel. It is used as the intermediate format
between the system that generated the data and the report the funder wants to see.

The security implications of the finance system are underappreciated. It holds bank details,
salary information, and payment credentials. It is often accessed via methods that would not
be considered acceptable for less sensitive data. It is not always integrated with the main
identity management system. It is sometimes the oldest system in the estate.

## Communications, which is its own other world

NGOs that rely on public support rely on communications, and communications tools are chosen
by the people who use them rather than the people who govern the IT estate. Mailchimp is
ubiquitous for email marketing. Brevo, formerly known as Sendinblue, has gained ground in
Europe partly on the strength of its EU data residency positioning. Website CMSs range from
WordPress, which is everywhere and maintained with varying degrees of attentiveness, to
Drupal, which is technically superior and maintained by people who know what that means, to
Squarespace and Wix, which are used by organisations that want a website and not a systems
administration project.

Social media management tools sit on top of whatever platforms the communications team has
decided are worth the effort. The accounts themselves are governed by whoever set them up,
and it is worth establishing who holds the credentials before the person who holds them
moves on.

## Field operations, for those who have them

Humanitarian, development, and environmental NGOs often need to collect data in places where
the infrastructure is unreliable. KoBoToolbox and ODK Collect are the standard answers for
survey and data collection: both open-source, both designed to work offline and synchronise
when connectivity is available. GIS and mapping requirements produce QGIS for those with
budget constraints and ArcGIS for those without. Power BI and Tableau appear at the
reporting layer, alongside Metabase and Superset for organisations that prefer open-source
alternatives and have the staff to support them.

Field operations produce data security problems that are harder than office ones: devices
crossing borders, data collected about vulnerable populations, offline storage that needs to
synchronise through channels that may not be trustworthy. The field operations stack deserves
its own security assessment, separate from the office environment, and often does not get
one.

## Cloud, on-premises, and the hybrid middle

Most NGOs that were established before 2015 have something on-premises that has not been
fully migrated. It might be a file server, a line-of-business application with no cloud
equivalent, or an integration that was built to run on local hardware and has never been
moved because moving it was always the next project. The hybrid environment that results is
not a design choice. It is a historical record.

Cloud-first organisations, particularly those that started with Google Workspace or M365 and
never had on-premises infrastructure, are simpler to audit and simpler to secure. The surface
is well-defined. The providers maintain the underlying infrastructure. The configuration is
the responsibility of whoever was given the admin credentials, which introduces its own set
of questions, but at least the questions are knowable.

The honest picture is that most organisations of the Home's size and age have both: a cloud
tenant that is reasonably well understood, and a few on-premises artefacts that are
considerably less so, doing something that probably matters and that nobody wants to be
responsible for switching off.

This is not a failure of planning. It is what planning looks like when the plans are made
under pressure, with the resources available, by people who were trying to keep the Home
running while also keeping the thing in the basement fed.