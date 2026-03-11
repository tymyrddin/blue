# AI policy: starting from zero

The explicit mention of responsible AI in a job description for an IT architect role is
usually a signal that someone in the organisation has noticed AI tools are being used and
nobody has decided what the rules are.

This is not a crisis. Absolutely not. It is a normal stage for organisations in 2026. But it does need to
be addressed, because the risks are real and specific to a non-profit context: donor data
entered into a model with opaque data retention policies, member contact information used
to draft outreach emails via a consumer AI tool, sensitive animal welfare cases summarised
via a public AI service.

## The first step: find out what is actually happening

Before writing a policy, find out what tools people are using and for what. This is not an
investigation. It is a set of conversations. Talk to the communications team, the fundraising
team, the volunteer coordinators, the HR staff. Ask: do you use any AI tools in your work?
What for? Which tools?

The answers will surprise you. People are often more forthcoming about this than expected,
particularly if the conversation is framed as we are trying to understand what is useful so
we can support it rather than we are looking for rule violations.

## The policy structure

An AI policy for a non-profit does not need to be long or elaborate. It needs to answer
the questions that people actually have.

What AI tools can I use? Is there an approved list? Can I use tools not on the list, and
if so, under what conditions?

What can I put into AI tools? What categories of data are okay to put in? Member and donor data,
sensitive case information, confidential financial records, personal data about employees
or volunteers: these need explicit guidance. The default position could be that personal
data does not go into AI tools without a specific reason and specific approval.

Who is responsible for AI-generated content? A fundraising email drafted with AI assistance
still needs to be reviewed and approved by a human before it goes out. Who does that review?

What happens if something goes wrong? Where does an employee report a concern about AI use?

## The Microsoft Copilot question specifically

If the organisation has Microsoft 365 licences and is considering or has enabled [Copilot](https://learn.microsoft.com/nl-nl/copilot/),
the data handling is different from consumer AI tools. Copilot operates within the M365
compliance boundary: it does not train on customer data, and data does not leave the tenant.
This is a meaningful distinction.

However, it does not eliminate the governance question. Copilot's ability to surface
information from across the M365 environment means that it will surface information that
a user can access but might not have thought to look for. An overly permissive SharePoint
environment, where documents are shared more broadly than intended, becomes a Copilot
problem when users start finding content they did not expect to find.

[Getting SharePoint permissions in order](https://learn.microsoft.com/nl-nl/sharepoint/modern-experience-sharing-permissions) is a prerequisite for responsible Copilot use,
not a nice-to-have.

## Related

- [Microsoft Copilot specifically](copilot.md)
- [Application governance](application-governance.md)
- [SharePoint and external sharing](../m365/sharepoint.md)
