# Covenant

Covenant is a cloud-hosted membership and supporter management platform built specifically
for the creature welfare sector. It is developed and maintained by Golem Trust Computing,
an Ankh-Morpork-based company that also produces Covenant Fundraising, Covenant Events, and
Covenant Grants, all of which are licensed separately and all of which the Home has been
told it should really consider adding to its subscription.

The Home uses Covenant as its primary system of record for the 200,000 members, donors,
volunteers, and supporters who make up its external community. This includes the full Adopt-a-Legend sponsorship programme: sponsor records, assigned creatures, sponsorship tiers, renewal
dates, communication preferences, and the monthly update workflow that produces the letters
informing thirty thousand paying citizens how their specific griffin, vampire bat, or
unclassified entity is getting on.

Fundraising uses Covenant daily. The communications team uses it for campaign segmentation
and email preference management. The programmes team uses it occasionally and reluctantly,
primarily to check volunteer status before assigning someone to a shift. The finance team
has a read-only view for reconciliation purposes and considers this sufficient.

## Technical details

Covenant is hosted on Golem Trust Computing's own infrastructure, with servers in the
Ankh-Morpork data district under their standard data boundary arrangement. The Home signed
a Data Processing Agreement with Golem Trust at initial onboarding. Whether the DPA reflects the
current scope of processing has not been reviewed since the Covenant Events module was added
two years ago.

Authentication is handled through Covenant's own identity layer. There is a SAML integration
option available in the Enterprise tier. The Home is on the Professional tier. The
difference in annual cost between Professional and Enterprise is enough to have caused
a deferred decision for two consecutive budget cycles.

Staff access Covenant through a web browser using email addresses and passwords managed
within the platform. Golem Trust supports MFA via an authenticator app, which the Home has
enabled as optional. Current MFA adoption among Covenant users is approximately forty
percent. The remaining sixty percent have been sent a recommendation twice. Password
complexity requirements within Covenant are set by the platform to a minimum of eight
characters with no enforced rotation, which is Golem Trust's default and has not been adjusted.

There are currently two Covenant administrator accounts. One belongs to the Head of
Fundraising. The second was created for an external consultant who assisted with the
original data migration from the previous system and has not been used since that project
concluded. The account exists. Its owner's current employer is not known to the Home.

## What it holds

Covenant holds the personal data of 200,000 individuals: names, addresses, email addresses,
telephone numbers, donation history, payment method references, communication preferences,
and, for Adopt-a-Legend sponsors, correspondence records including the claw-painted holiday
cards that Madame Zara's therapy group produces each December. The payment method references
are tokenised through the Home's payment processor. Covenant does not hold full card numbers.
The Home's Data Protection Officer has confirmed this. The confirmation is in an email thread
from eighteen months ago.

Volunteer records in Covenant include DBS check status, role assignments, emergency contact
details, and in some cases notes added by the shift supervisors that were not intended to
form part of a formal record but have accumulated there over several years because the notes
field was available and nobody specified what it was for.

## The integration with the payment processor

Covenant connects to the Home's donation payment processor via a webhook integration
configured during the original implementation. Donations made through the website are
processed by the payment processor and a confirmation event is sent to Covenant, which
updates the donor record, triggers a thank-you email, and, where applicable, initiates
the Adopt-a-Legend assignment workflow.

The integration was configured by the external consultant. The configuration documentation
is a two-page PDF in a SharePoint folder called "Covenant Setup 2022 FINAL". The webhook
secret is stored in a sticky note photograph in the same folder. This has been raised.

## Known issues

Covenant's bulk email functionality has been responsible for two incidents in which
communications went to suppressed addresses, once due to a filter that was not applied
correctly before an export and once due to a sync error between Covenant's preference
management and the Home's Brevo account, which is used for high-volume campaigns. The
incidents were reported to the ICO under the self-reporting threshold but documented
internally. The root cause of the second incident was not fully resolved before the relevant
member of the communications team went on parental leave, after which the priority was
quietly reclassified.

Golem Trust releases updates to the platform monthly. The release notes are sent by email to the
account administrator. The Head of Fundraising receives them. They are forwarded to IT
approximately forty percent of the time.