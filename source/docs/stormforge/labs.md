# Tidepool experiments

The tidepool experiments are for looking closely at small, contained things in order to
understand large, complicated ones.

Tidepools are instructive precisely because of the boundaries. Everything that lives there
is visible and examinable. You can observe without managing. You can put things in and watch
what happens. You can make mistakes without sinking anything larger.

The labs take more time than the workshops. Some people run them in an afternoon; others
return to them over several sessions across a week. The lab does not know which you are and
does not care. Take the tide as it comes.

## Threat intelligence lifecycle

The full intelligence cycle, from collection through processing to analysis to finished
product, sounds very formal. In practice it involves arguing about what counts as a reliable
source, discovering that two-thirds of the feeds you have been trusting are just republishing
each other, and producing a report that someone will actually act on rather than file under
interesting reading.

Participants work through the complete lifecycle for a fictional organisation and a realistic
threat scenario. They define collection requirements, which is harder than it sounds because
everyone wants to know everything about everything. They gather data from a set of provided
sources of varying quality. They process it into something structured, analyse it for what it
actually means for this specific context, and produce a finished intelligence product.

The finished product is then assessed by another crew, who are playing the role of the
management team that has to decide whether to do something about it. This is the moment when
participants discover whether they produced intelligence or whether they produced interesting
background reading that feels important but contains no actionable conclusion.

The second run is faster. The third run is where habits start to form.

## What is actually in the water

A tidepool of network traffic. Participants are given a packet capture from a network that
has had some things happening on it. The first task is to establish what normal looks like.
The second task is to find what is not normal. The third task is to say what it means.

Tools used in the session include Wireshark, Zeek, and enough command-line work to make
participants comfortable with the idea that the graphical interface is optional. The scenarios
range from the clearly suspicious (a device scanning every port on the local network in
sequence, which is the network equivalent of trying every door in a building while wearing
a balaclava) to the ambiguous (traffic to an unusual external address that might be legitimate
and might not be) to the subtle (something that looks entirely normal until you examine
the timing).

The ambiguous scenarios generate the most discussion. They should. Ambiguity is the normal
condition of network analysis. The skill is not in spotting the obvious; it is in building
the case for or against the non-obvious, and knowing when the case is strong enough to
escalate rather than quietly close.

## Raising a honeypot

A honeypot is a thing that exists to be found. You put it somewhere plausible, make it look
like it could be useful to an attacker, and then watch who touches it.

This lab is about building one. Participants deploy a basic honeypot in a test environment
using a low-interaction tool (choices provided, all running on modest hardware or a virtual
machine), configure it to look like something an attacker might plausibly want to reach,
connect it to basic alerting, and then have another participant play the role of a curious
attacker who knows nothing about the honeypot's existence.

The attacker's job is to explore the environment and find interesting things. The defender's
job is to watch the alerts and reconstruct what the attacker did from the honeypot logs alone.

The notable moment in this lab is always the attacker's debrief. People who have spent the
session thinking like an attacker tend to return to the defender's seat with rather more
imagination about what to watch for than they had when they left it.

## Sandcastle and storm

Malware analysis for people who have not done malware analysis before, and who may have been
slightly afraid to start.

Participants work in an isolated sandbox environment (pre-built, nothing terrible can escape,
this has been checked more than once) with a set of samples ranging from simple scripts to
obfuscated executables. The task is to understand what each sample is trying to do without
running it carelessly, using static analysis first and then controlled dynamic analysis in the
sandbox.

The approach is narrative: what story is this thing trying to tell, and is it lying? Malware
rarely labels itself helpfully. The session focuses on developing the habit of asking what
would this do if it worked rather than treating analysis as a technical exercise disconnected
from consequences.

No prior reverse engineering experience is required. Curiosity and a willingness to be wrong
a few times before being right are the prerequisites. The sandbox has seen worse.
