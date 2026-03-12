# Application governance

The application landscape of a non-profit that has grown without a dedicated IT architect
is typically characterised by tools acquired ad hoc, governed informally, and reviewed rarely.
Application governance is the process of changing that.

## What application governance means in practice

It does not mean a formal enterprise architecture function with mandatory approval gates for
every tool purchase. That would be appropriate for a different kind of organisation. For a
mid-sized non-profit, it means having clear answers to three questions for every application:

Who decided we use this, and do we still need it? Someone made a decision to acquire or
adopt every tool in the landscape. That decision may have been made years ago by someone
who is no longer at the organisation. Periodically reviewing whether the decision still
stands, and whether the tool still justifies its cost and its data handling obligations, is
the core of governance.

Who owns it? Every application needs a named business owner who is accountable for the
decision to keep using it and for the data it holds. The IT team is the custodian. The
business owner is accountable for the content and the data governance obligations.

Does it fit within the agreed framework? This is the architect role that was mentioned in
the job description. Before a new tool is acquired, someone needs to assess whether it
creates new data residency concerns, whether it can integrate with Entra ID or requires
separate account management, whether a DPA is needed, and whether it duplicates something
that already exists in the landscape.

## A lightweight review process

For an organisation at this stage, the process does not need to be elaborate. A simple
checklist run through for every new tool request:

- What does it do, and is there something in the current landscape that already does it?
- What data will it hold or process? Does that trigger any GDPR or data residency considerations?
- Where is the data hosted?
- Does the vendor have a DPA template?
- Will it use Entra ID SSO or require separate account management?
- Who is the named business owner?

A decision is documented. The tool either joins the landscape (asset) register or the requester is
pointed to an existing solution. This is not bureaucracy for its own sake: it is the
mechanism for preventing the landscape from continuing to grow in ways that nobody has
reviewed.

## Managing technical debt

Every application landscape in an organisation of this type has technical debt: integrations
that nobody documented, tools that are paid for but not really used, systems running on
configurations that made sense in 2015. You cannot fix all of it at once.

Prioritise based on risk. An undocumented integration that passes donor payment data between
the CRM and the financial system is higher priority than a legacy survey tool that was used
for one project and forgotten. Address the highest-risk debt first, document everything as
you go, and accept that this will likely be a multi-year process.

## Related

- [Application landscape](../applications/landscape.md)
- [Integration mapping](../applications/integration-map.md)
- [AI policy](ai-policy.md)
