# SharePoint and OneDrive: sharing settings

The most common data exposure incident in a non-profit M365 environment does not involve
an attacker. It involves someone who shared a document with "Anyone with the link", forgot
about it, and left a spreadsheet of donor contact details publicly accessible.

At the Home this has already happened in a different form. A photograph taken during the
Covenant Events onboarding, visible to the room and then uploaded to a SharePoint folder,
contains the webhook secret for the Covenant event registration integration. The image is
not obviously sensitive. It is just a picture of a screen. The secret is readable if you
look for it. The folder it lives in has not been reviewed since it was created. This is
the kind of exposure that does not show up in a threat log because nothing bad has yet
happened, and because nothing bad has yet happened, nobody has looked.

## Sharing at the tenant level

Check the SharePoint Admin Centre under Policies, then Sharing. The two settings that
matter most are the external sharing level for SharePoint, which controls what site owners
can do, and the external sharing level for OneDrive, which is often more permissive than
SharePoint and often overlooked.

The options range from Anyone (public links, no sign-in required) through New and existing
guests (sign-in required) to Only people in your organisation (no external sharing).

For most non-profits, the right balance is New and existing guests for SharePoint, since
external collaboration with partner organisations and funders is legitimate, with Anyone
links disabled. OneDrive can often be set to the same or more restrictive.

## Link defaults

Even with the right tenant-level settings, the default for what kind of link is created
when someone clicks Share determines what most users do in practice.

If the default is Anyone with the link, staff will routinely create public links without
thinking about it, because it is the easiest option. Changing the default to People in
your organisation, or Specific people, makes external sharing a conscious choice. This single change prevents a category of accidental
data exposure without blocking legitimate collaboration.

## Reviewing existing links

If the tenant has been running for several years under permissive defaults, there are
likely existing Anyone links pointing at documents their owners have forgotten about. A
one-off review of existing external shares, followed by a scheduled periodic review, is
worthwhile. Reports on sharing can be run from the SharePoint Admin Centre under Reports,
or via the Microsoft Purview compliance portal.

The Covenant webhook photograph is an example of why the review needs to look at content,
not just sharing settings. A document shared only within the organisation can still contain
sensitive data that should not be in SharePoint at all.

## Site permissions

SharePoint site permissions accumulate in the same way Entra ID roles do. Check high-value
sites: HR documents, fundraising data, member and donor records, and the IT documentation
site that contains the incident response contacts, runbooks, and the break-glass account
details. Site owners who have left the organisation, Contribute access granted for a
project that ended, and external guests who no longer need access are all common findings.

The IT documentation site deserves particular attention. The SIRT structure and runbooks
are the materials the Home needs in a breach. If they are in SharePoint, they need to be
accessible to the right people under the access conditions that exist during an incident,
including the condition where the primary Entra ID admin accounts are the ones under review.

## The Burrow as a symptom

The reason Priya created the Burrow on a personal Notion account rather than using
SharePoint for the volunteer coordination notes was, in part, because SharePoint at the
Home is an accumulation of folders from previous initiatives with inconsistent naming,
unclear ownership, and no maintained navigation. People use systems that work for them.
When the governed system is difficult to use, they find one that is not.

Fixing the sharing settings is necessary. It is not sufficient. If SharePoint remains
genuinely difficult to use as a day-to-day tool, the shadow IT alternatives will persist
alongside the governed ones.

## Related

- [Microsoft Secure Score](secure-score.md)
- [The Burrow](../applications/the-burrow.md)
- [Data protection and GDPR](../data/gdpr.md)
- [Controlling cloud storage and OAuth exposure](../../counter/human/cloud-controls.md)
Last updated: 10 July 2026
