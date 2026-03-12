# SharePoint and OneDrive: sharing settings

The most common data exposure incident in a non-profit M365 environment does not involve an
attacker. It involves someone who shared a document with Anyone with the link, forgot about it,
and left a spreadsheet of donor contact details publicly accessible for two years.

SharePoint and OneDrive's default sharing settings in older tenants are often more permissive
than current Microsoft guidance recommends. Tightening them is a configuration change, not a
project.

## Sharing at the tenant level

Check the SharePoint Admin Centre under Policies, then Sharing. The two settings that matter
most are the external sharing level for SharePoint (controls what site owners can do) and the
external sharing level for OneDrive (often more permissive than SharePoint, and often
overlooked).

The options range from Anyone (public links, no sign-in required) through New and existing
guests (sign-in required) to Only people in your organisation (no external sharing).

For most non-profits, the right balance is New and existing guests for SharePoint (external
collaboration is legitimate and necessary) with Anyone links disabled. OneDrive can often be
set to the same or more restrictive.

## Link defaults

Even with the right tenant-level settings, the defaults for what kind of link is created when
someone clicks Share determine what most users do in practice. Check the default link type
under the same sharing settings panel.

If the default is Anyone with the link, users will routinely create public links without
thinking about it because it is the easiest option. Change the default to People in your
organisation or Specific people and external sharing becomes a conscious choice rather than
the path of least resistance.

## Reviewing existing Anyone links

If the tenant has been running for several years with permissive defaults, there are likely
existing Anyone links pointing at documents that their owners have forgotten about.

Reports on sharing can be run from the SharePoint Admin Centre under Reports, or via the
Microsoft 365 compliance portal. A one-off review of existing external shares, followed by
a periodic scheduled review, is worthwhile.

## Site permissions

SharePoint site permissions also accumulate. Check high-value sites (HR documents, financial
reports, fundraising data, member and donor records) for appropriate access controls. Site
owners who are no longer in the organisation, broad Contribute access granted for a project
that ended, external guests who no longer need access: these are common.

## Related

- [Microsoft Secure Score](secure-score.md)
- [Application landscape: shadow IT](../applications/shadow-it.md)
- [Data protection and GDPR](../data/gdpr.md)
