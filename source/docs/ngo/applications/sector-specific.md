# Sector-specific software

Animal welfare organisations have software requirements that generic ERP and productivity
tooling does not cover. Understanding what sector-specific systems exist in the landscape,
and how they are integrated and secured, is part of the application audit.

## What to expect

Animal registration software typically holds records for individual animals: intake date,
species, breed, identifying information, adoption status, and location within the shelter.
In the Netherlands, this intersects with legal obligations around microchipping, breed
registration, and reporting to authorities.

Medical records for animals in care include veterinary treatment histories, vaccination
records, medication schedules, and surgical notes. The sensitivity of this data is lower
than human medical records under AVG, but it is still operational data that the organisation
depends on and that could be embarrassing or legally relevant if lost or exposed.

Case management tools may track the circumstances of animal intake, the history of a case
where neglect or abuse is involved, or interactions with enforcement agencies. These records
may intersect with human personal data and carry a higher AVG classification.

Volunteer and foster care coordination tools track which volunteers are approved for which
roles, vaccination and health records for foster carers' existing animals, and placement
histories. These hold personal data about volunteers and their households.

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

Vendors of niche sector-specific software for the Dutch animal welfare market are typically
small companies with limited security resources of their own. This is not a criticism: it
reflects the market. It does mean that you should ask directly about their security practices,
their data handling, their incident response capability, and their data residency.

Ask whether they have a Data Processing Agreement template and whether it meets current AVG
requirements. If they do not know what a DPA is, that is information too.

## Related

- [Application landscape](landscape.md)
- [CRM and membership systems](crm.md)
- [Data protection and AVG](../data/avg.md)
