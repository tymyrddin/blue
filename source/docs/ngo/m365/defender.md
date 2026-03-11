# Defender for Office 365

What Defender capabilities you actually have depends on your licencing. This is worth checking
before assuming either that you have protection you do not have, or that you are paying for
something that is not switched on.

Exchange Online Protection (EOP) is included with all M365 licences. It provides basic
anti-malware, anti-spam, and anti-spoofing protection. It is on by default but the default
configuration can be improved.

Defender for Office 365 Plan 1 adds Safe Links and Safe Attachments. Safe Links rewrites URLs
in email and documents and checks them at click time against a blocklist. Safe Attachments
detonates suspicious attachments in a sandbox before delivery. Both require configuration
beyond their defaults to be effective.

Defender for Office 365 Plan 2 adds threat investigation and response capabilities, attack
simulation training, and advanced hunting. For most non-profits at the foundation stage,
Plan 2 features are not the priority.

## Checking what is configured

Go to the Microsoft 365 Defender portal, then Email and collaboration, then Policies and rules,
then Threat policies. Work through: Anti-phishing, Anti-spam, Anti-malware, Safe Links, and
Safe Attachments.

For each, there is a default policy and potentially custom policies. Check whether Safe Links
and Safe Attachments are enabled and what their configuration covers. The default is often to
protect email but not other M365 workloads like SharePoint, OneDrive, and Teams, which can
be extended.

## Preset security policies

Microsoft offers Standard and Strict preset security policies that apply Microsoft's recommended
configuration across EOP and Defender for Office 365. For an organisation that does not have
the capacity to tune individual policies, applying the Standard preset is a reasonable starting
point. It covers anti-phishing, anti-spam, anti-malware, Safe Links, and Safe Attachments with
settings that Microsoft considers appropriate for most organisations.

## Alert policies

Check what alert policies are configured and where alerts are going. By default, some alerts
go to the global administrators. If there are six global admins and the alerts go to all of
them, the chances of anyone taking action on any individual alert are lower than they should be.

Assign a named recipient for security alerts. Even if that is you for now, having a named
responsible person is better than diffusing accountability across a distribution list.

## Related

- [Microsoft Secure Score](secure-score.md)
- [Exchange security](exchange.md)
