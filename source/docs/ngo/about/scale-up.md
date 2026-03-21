# The Home at scale

At some point between the first dragon and the two hundred thousandth supporter, the Home
stopped being a small operation and became something else. Nobody announced this. The
transition happened the way most transitions do: gradually, then all at once, and then
everyone was too busy to notice that the old way of doing things had stopped working.

The staff grew to several dozen, then to hundreds. The residents increased. The Adopt-a-Legend
programme attracted thirty thousand sponsors. The member database, which had been a
spreadsheet with seventeen tabs, became a CRM. The CRM was selected by a committee who had
done their best, then configured by a contractor who had done their best, then maintained by
whoever was available, who had also done their best. The spreadsheet survived as a backup.
It always does.

## What the infrastructure looks like now

The Home runs on Microsoft 365, obtained through the nonprofit grant programme at a price
that made the finance team cry with relief. There is an Entra ID tenant, which is both true
and slightly aspirational. The tenant exists, but its contents are a palimpsest of good
intentions, emergency decisions, and historical artefacts.

There are guest accounts from a collaboration project four years ago, status unknown. There
are service accounts named after people who have since moved on. There are three accounts
that appear to be duplicates of each other, each belonging to a slightly different version of
the same contractor's name. The admin panel has Global Administrator assigned to two people,
one of whom still works here and one of whom definitely does not.

The CRM holds the records for 200,000 members, donors, and volunteers. It is cloud-hosted,
has its own authentication system, and is not connected to Entra ID because the integration
was quoted at a price that caused the finance team to cry in a different register. Access is
via passwords that vary considerably in their quality. A few staff use a password manager. A
few use a sticky note. One person uses the name of a minotaur they are particularly fond of,
which is not ideal but is at least memorable.

Email runs through Exchange Online. SPF is present. DKIM is configured for the primary
domain. DMARC is set to monitoring mode, where it has been for approximately eighteen months,
waiting for someone to have the time to look at the reports. The reports contain information.
Nobody knows yet what the information says.

On the previous premises, there was an on-premises server that came with the building.
It was moved to the new location because nobody confirmed it could be decommissioned. It is
running. What it is running has not been established. Switching it off has been discussed at
three consecutive IT planning meetings and deferred at each one on the grounds that it
might be important.

## What this means for security

The scale-up state is where most of the interesting security problems live, and interesting
is being used charitably here. The organisation has outgrown the informal structures that
worked when everyone knew everyone, but has not yet built the formal structures that would
replace them. Access is inconsistent. Policies exist but enforcement is patchy. MFA has been
rolled out to most staff and fewer volunteers, and the exceptions were granted for good
reasons that nobody wrote down.

This is not a failure. It is what happens when an organisation that was built on goodwill and
urgency grows faster than its administrative capacity. The security posture is a record of
the organisation's history: every gap traces back to a moment when there was not time to do
it properly and the proper way was never found afterwards. The ghost accounts are not
negligence. They are the archaeology of every staff change that happened before anyone
thought to build an offboarding process.

The work at scale-up is not starting from scratch. It is inheriting something that has been
running under pressure and making it more deliberate, one piece at a time, without breaking
anything that people are currently depending on. This requires more patience than starting
from scratch, and is considerably more common.

## What to do first

The Entra ID audit is the first job. What is actually in the tenant? Who has admin rights?
What are the guest accounts for? The answer will be uncomfortable, and knowing it is
better than not knowing. The ghost accounts cannot be remediated until they are counted.
The duplicate contractor entries cannot be resolved until someone has checked which one, if
any, is current. The admin role assigned to the person who no longer works here needs
revoking before it becomes a problem rather than a risk.

The second job is mapping the authentication landscape across the CRM, the finance system,
and whatever the HR team uses, because these are the systems where the important data lives
and they each have their own access model that nobody has drawn together. The map does not
need to be perfect. It needs to exist.

The third job is Conditional Access. The policies that are in place can be reviewed and
tightened. The ones that are missing can be added in report-only mode first, because finding
out what would break is more useful than breaking it without warning.

The DMARC reports are not going to read themselves. The server of uncertain purpose is not
going to explain itself. But these can wait one week. The admin role that belongs to
a former employee cannot.