# Sector-specific software

The Home for Bewildered Beasts of Legend has software requirements that generic ERP and
productivity tooling does not cover. Understanding what sector-specific systems exist in the
landscape, and how they are integrated and secured, is part of the application audit.

## What to expect

Resident registration software typically holds records for individual creatures: intake date,
species, identifying information (where applicable, some residents resist categorisation),
rehoming status, and current location within the Home. This intersects with legal obligations
around creature welfare, documentation requirements, and reporting to relevant authorities.

Medical records for residents in care include treatment histories, care schedules, and
clinical notes from Dr. Flannel's surgery. The sensitivity of this data is operational rather
than personal, but it is still data the organisation depends on and that could be embarrassing
or legally relevant if lost or exposed.

Case management tools may track the circumstances of a creature's intake, the history of a
case where neglect or difficult ownership situations are involved, or interactions with
enforcement and welfare bodies. These records may intersect with human personal data and
warrant careful access controls.

Volunteer and foster care coordination tools track which volunteers are approved for which
roles, health and suitability records for foster carers, and placement histories. These hold
personal data about volunteers and their households.

## The security questions

For each sector-specific application, the same questions apply as for any other application
in the landscape: where does the data live, who has access, how is authentication handled,
what integrates with it, and when was it last backed up?

The additional questions specific to this category are about SSO and lifecycle management.
Sector-specific tools often have limited or absent Entra ID integration. If the application
cannot federate with Entra ID, then every new employee and every leaver requires a manual
action in that system. Document this, build it into the onboarding and offboarding checklists,
and factor the manual overhead into your capacity planning.

Audit logging in sector-specific tools is often limited. Find out whether the application
logs who accessed which records and when. If not, that is a risk to note in your register,
particularly for applications that hold sensitive case data.

## Vendor relationships

Vendors of niche sector-specific software for this market are typically small companies with
limited security resources of their own. This is not a criticism: it reflects the market.
It does mean that you should ask directly about their security practices, their data handling,
their incident response capability, and their data residency.

Ask whether they have a Data Processing Agreement template and whether it meets current GDPR
requirements. If they do not know what a DPA is, that is information too.

## Related

- [Application landscape](landscape.md)
- [CRM and membership systems](crm.md)
- [Data protection and GDPR](../data/gdpr.md)
