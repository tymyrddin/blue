# Review simulation results

Run this review after each monthly campaign closes, before the next one launches.

## Steps

1. In the Gophish admin interface, open the closed campaign and go to the Results tab.
2. Review the summary counts: emails sent, emails opened, links clicked, credentials
   submitted, emails reported.
3. Export the full results as CSV. Store it in the programme record folder with the
   campaign name and date.
4. Separate credential submissions from link clicks in the export. These are distinct
   behaviours with different risk implications. Someone who clicked and then stopped at
   the landing page made a different decision from someone who entered credentials. Treat
   the latter as you would treat a real account compromise: reset the password, revoke
   sessions, and review sign-in logs for that account.
5. Calculate the reporting rate: reports divided by emails delivered. This is the metric
   that matters most for programme health. A population that reports quickly is more
   resilient than one that simply does not click, because the same instinct that drives
   reporting also drives calling the director to verify an unusual request.
6. Note the time from campaign launch to first report. A short time indicates the
   technique was recognised. A long time or zero reports indicates it was convincing,
   which is exactly what you want to know.
7. Aggregate results by department for any reporting to management. Do not share
   individual-level results with anyone outside the IT security function.

## Assess the technique

After reviewing results, assess whether the technique chosen remains a useful simulation
tool for future cycles.

If the click rate was very low and the reporting rate was high, the technique is well
understood by the population. Retire it from the rotation for at least six months and
replace it with something less familiar.

If the click rate was high and the reporting rate was low, the technique is working well
as a training challenge. Consider running a variation of it in a future cycle after a
refresher session has been delivered to the most affected teams.

If the campaign was caught by Defender despite passing the payload test, make a note of
the technique and the date. This indicates a Defender signature update addressed the
evasion method during the campaign window. Feed this back into the threat intelligence
review: if this technique is no longer viable, what is replacing it in the wild?

## Update the programme record

The programme record is a running log maintained by the security function. After each
campaign, add a row:

- Date
- Technique used
- Source from threat intelligence that informed the technique
- Delivery rate
- Click rate
- Credential submission rate
- Reporting rate
- Time to first report
- Whether Defender caught the payload mid-campaign
- Notes on technique viability for future use

Review the full log at the end of the programme year. The trend across twelve months is
the evidence base for arguing for resources, adjusting the session curriculum, and
demonstrating to management that the programme is responding to the actual threat
landscape.
Last updated: 10 July 2026
