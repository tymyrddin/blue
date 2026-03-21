# Create and run a monthly simulation campaign

The monthly simulation uses Gophish with a technique selected from current threat
intelligence. Defender is not modified. The email must land in the primary inbox on its
own merits. Test delivery on a single test account before deploying to the staff population.

## Prerequisites

- Gophish installed and running.
- A technique selected from the threat intelligence runbook that has been observed in
  the wild recently and not used in the previous two simulation cycles.
- Sending profile configured for the impersonation scenario.
- Landing page created for the technique.
- Test account available for delivery verification (see the payload testing runbook).
- Staff have been told at the start of the programme year that simulations will run
  monthly. They have not been told when or what technique will be used.

## Steps

1. In Gophish, create a new email template for this campaign. Base it on the technique
   selected from threat intelligence. Name it with the date and technique, for example
   `2026-04-quishing-consortium`.
2. Write the email to match the impersonation scenario: a grant notification from a
   known funding body, a supplier invoice from Fabulist Systems, a message from the
   Consortium, or whatever scenario fits the technique and feels plausible to the
   target population.
3. Keep the email short. Real phishing emails are short. Urgency and a single call to
   action are the structure. Long emails with detailed context are easier to scrutinise.
4. Create the target group for this campaign. Export the staff list from Entra ID and
   import it into Gophish. Include first name, last name, and email address. Exclude
   IT staff who manage the programme.
5. Run the payload testing runbook against the test account. Do not proceed until the
   email lands cleanly in the primary inbox with no warning banner and the link resolves
   without a Safe Links interstitial.
6. Set the campaign launch time to a weekday morning between 08:00 and 10:00. This
   matches the delivery pattern of real phishing campaigns and the time when staff are
   most likely to be processing email without sufficient attention.
7. Launch the campaign.
8. Monitor the Gophish dashboard for the first two hours. If delivery is failing broadly,
   pause the campaign and re-run the payload test. Defender signatures update in near
   real time and a payload that passed the morning test may be caught by an updated
   signature by midday.
9. Let the campaign run for 72 hours, then close it. Events recorded after 72 hours are
   less meaningful as behavioural data: the people who were going to click have clicked,
   and those who have not are either cautious or have not seen the email yet.

## After the campaign closes

Run the results review runbook. Brief the department leads for any team with a credential
submission rate above zero before the results are shared more broadly. A staff member who
submitted credentials to a realistic simulation payload should have their password reset
and sessions revoked as a precaution, treated the same way a real incident would be treated.
