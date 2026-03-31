# Stormwatch sessions

The Stormwatch sessions are hands-on without qualification. You will not watch a slide deck.
You will do something, get parts of it wrong, do it again with that knowledge, and leave
knowing things you did not know when you arrived.

What each session is building, beneath the specific technique, is pattern recognition: the
kind that is only constructed through practice followed by a genuine debrief. Reading about
what a webshell looks like is not the same as searching a file system for one and finding it,
or not finding it, and then being shown what you missed. The gap between knowing and
recognising-in-practice is where incidents live. These sessions exist to close that gap
through repeated exposure rather than repeated description.

The pace is yours. Some people work through a scenario in twenty minutes and want three more;
others need the full session on one. Both are fine. The point is not the speed. The point is
the understanding that sticks afterwards, and the habit of asking what you would have done
differently, which is the question the debrief is really for.

These sessions can be run within organisations by someone who knows the material. Someone
working through them at home can rope in a patient collaborator, or argue with themselves
out loud, which also works. A laptop and genuine curiosity are the minimum viable equipment.

## Detecting webshells in the wild

Webshells are what attackers leave behind when they want a door they can come back to. Small,
quiet, sometimes one line of code buried in a file that has four hundred other lines and looks
mostly boring. They blend in. That is the whole point.

Participants get a set of web server file systems, some legitimate and some containing
webshells of varying subtlety. The task is to find them. Not by running a scanner and reading
the output. By actually looking: at file timestamps, at permissions, at content that is
slightly wrong in ways that are hard to articulate until you have seen it enough times to
name the feeling.

The scenarios span different environments deliberately. A webshell on a corporate server looks
different from one on an NGO's shared hosting. A PHP webshell looks different from a JSP one,
which looks different again from a minimal Perl variant that is clearly the work of someone
who was very pleased with themselves.

Participants play the investigator. There is also a round where participants play the attacker:
plant a webshell in a test environment, then trade environments with another crew and find each
other's work. This is, consistently, the round where people learn the most, and where people
who thought they were being subtle discover they were not.

## Reading the ship's log

An account was compromised. Data may have been exfiltrated. Someone was in the network for
three days before detection. The investigation starts with logs. The first thing it often
finds is that the logs needed to reconstruct the timeline were not being collected, or were
not retained long enough, or were stored in a format that makes correlation impossible.
This session is about not being in that position.

Logs tell the story of what happened. They tell it in a format that was not designed for
humans to enjoy, which is why most people ignore them until something breaks and then stare
at them in mild panic at three in the morning.

This session is about getting comfortable with logs before the emergency. Participants work
with real-format log samples: web server access logs, authentication logs, Windows event logs,
email server logs. The scenario gives them a timeline and a question. Something happened.
What was it? Who did it? When? From which direction?

The answer is in the logs. It always is, assuming the logs were configured to capture it,
which they sometimes were not, and discovering that mid-investigation is also part of
the learning.

The session includes a round where participants configure log collection for a small test
environment, trigger a set of actions, and then have to find their own tracks in the logs
they just created. Watching people try to find their own footprints is instructive in
both directions.

## The phishing ship

One half of the crew sends phishing emails. The other half receives them. Then they swap.

This is not as alarming as it sounds. The exercise runs in an isolated simulation environment
where everyone knows what is happening. The phishing emails are crafted during the session,
targeting the fictional organisation whose details are provided, [using the same techniques
that real phishing campaigns use](../ngo/awareness/attack-simulation.md).

The sending crew learns what goes into a current convincing phishing email and how surprisingly little effort
it takes to make something that would probably work on a tired Tuesday afternoon. The
receiving crew learns to spot the tells without the luxury of being told to look for them.

The debrief covers what almost worked and why. The near-misses are more instructive than the
obvious failures. Nobody falls for an email that arrives with seventeen red flags. People fall
for the one with a single very subtle one.

## The impersonator's hold

Social engineering in roleplay. Participants work through scenarios where one person has a
goal (obtaining access, information, or action) and another has to assess whether that goal
is legitimate, without being so suspicious that the organisation becomes impossible to work in.

The balance is the interesting part. An organisation where everyone challenges every request
is unworkable. An organisation where nobody challenges anything is a phishing campaign waiting
to succeed. The exercises explore the space in between.

The scenarios are the ordinary ones: a call from someone claiming IT support who needs to
verify something urgently, an email from what looks like a senior colleague requesting an
unusual action, a visitor whose contact happens to be away and who needs somewhere to wait,
a contractor with most but not quite all the right documentation and a slight impatience
about the delay. Nothing exotic. The exercise is not about defending against the implausible.
It is about the space between appropriate caution and functional paranoia, which is where
real social engineering succeeds.

Participants rotate through both roles. The person doing the impersonating often has the
most uncomfortable realisations. It turns out to be easier than expected, which is,
again, the point.

## Related

- [Foundation: Workshops and analytical processes](https://purple.tymyrddin.dev/docs/workshops/)