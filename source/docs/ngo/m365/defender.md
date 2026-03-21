# Defender for Office 365

What Defender capabilities the Home actually has depends on the licence tier in effect
under the Microsoft nonprofit grant. This is worth confirming before assuming either that
protection is in place or that something is switched on because it is included.

Exchange Online Protection is included with all M365 licences. It provides baseline
anti-malware, anti-spam, and anti-spoofing filtering. It is on by default, but the default
configuration is not the same as a tuned configuration.

Defender for Office 365 Plan 1 adds Safe Links and Safe Attachments. Safe Links rewrites
URLs in email and documents and checks them at click time against a threat intelligence
feed. Safe Attachments detonates suspicious attachments in a sandbox before delivery. Both
require configuration beyond their defaults to provide useful protection.

Defender for Office 365 Plan 2 adds threat investigation and response tools, advanced
hunting, and attack simulation training. For the Home at its current stage, Plan 1 is the
relevant threshold.

## What Defender does not catch

The Fabulist Incident is the clearest illustration of Defender's limits in the Home's
context. The phishing email that initiated the breach arrived in the inbox cleanly: it
contained no suspicious attachments, no URL that triggered Safe Links, and no domain that
matched a known blocklist at the time of delivery. The follow-up executable was a loader
technique tested against Defender before deployment. Kevin's machine was running Defender.
The executable opened. The loader reached its destination.

This is not a failure of Defender specifically. It is a description of the current
threat landscape: attacker techniques are developed against the defences that targets are
known to run, and techniques that pass those defences are the ones used in campaigns. This
is why the security awareness programme runs simulations against live Defender rather than
bypassing it. The question is not whether Defender catches everything, it does not, but
whether the organisation's detection and response capability catches what Defender misses.

## Checking what is configured

Go to the Microsoft 365 Defender portal, then Email and collaboration, then Policies and
rules, then Threat policies. Work through: Anti-phishing, Anti-spam, Anti-malware, Safe
Links, and Safe Attachments.

For each policy, check whether it is enabled and what it covers. Safe Links and Safe
Attachments in default configuration protect email. They can be extended to SharePoint,
OneDrive, and Teams, which is worth enabling given how much of the Home's content lives
in those workloads.

## Preset security policies

Microsoft's Standard and Strict preset security policies apply recommended configuration
across Exchange Online Protection and Defender for Office 365 in a single action. For an
organisation that does not have capacity to tune individual policies, applying the Standard
preset is a reasonable baseline. Check the current configuration against the preset
settings to understand the gap.

## Alert policies

Check what alert policies are configured and where alerts go. In a default M365 tenant,
security alerts are sent to Global Administrators. At the Home, that means alerts currently
route to an account held by someone who does not work here. This needs to be resolved as
part of the admin role remediation, but it also means that security alerts may have been
going unreviewed for as long as the dormant account has been present.

Assign a named recipient for security alerts: the Head of IT, or a shared mailbox that the
Head of IT and IT coordinator both monitor. A security alert that reaches a distribution
list of people who each assume someone else has read it is functionally the same as an
alert that was not sent.

## Related

- [Microsoft Secure Score](secure-score.md)
- [Exchange security](exchange.md)
- [Security awareness programme](../awareness/attack-simulation.md)
- [The Fabulist Incident](../data/breach-simulation.md)
