# Run the purple team session

The afternoon session is a purple team exercise. Red team and blue team are active
simultaneously throughout. While one participant is at the blue team machine deciding
whether to click or report an email that just arrived, another is at a red team
workstation composing the next one. Both sides watch the same display. This simultaneity
is what creates the energy in the room: events on the display are live, they are
happening now, and everyone can see both sides of them as they happen.

The facilitator's role is to set the conditions, brief the participants, manage rotation
at the blue team machine, run the mid-session review, and lead the debrief. Not to
manage the exercise moment to moment. Once it is running, it runs.

Purple teaming is not a competition. There is no winning. Both sides are learning from
the same events, in real time, with full visibility of what is happening on both sides.

## Room setup

- Main projector: display machine running the Gophish campaign dashboard, visible to
  the whole room throughout. See the display machine runbook.
- Blue team machine: at the front of the room or on a second projector, showing the
  sandbox Outlook inbox. The blue team participant's decisions are visible to the room.
- Red team workstations: one per participant or pair. Each has browser access to the
  Gophish email template editor. Red team participants do not need access to the full
  Gophish admin interface. They work in the template and campaign creation screens only.
- All machines on the session network. Gophish admin port 3333 restricted to the display
  machine IP only.

## What participants are given

Red team participants are given a tracking link, prepared by the facilitator before the
session. This is the Gophish campaign URL for the session's landing page. They do not
configure infrastructure. Their task is to craft a convincing email that uses this link
as its payload. The link is the same for all red team participants in the session.

Before the exercise begins, the facilitator walks through the current phishing techniques
drawn from threat intelligence: what is reaching inboxes right now, how each technique
works, and why it evades filtering. This is not a long briefing. It is specific and
practical: here is a QR code campaign observed last month, here is what made it
convincing, here is a legitimate-service redirect observed this week. Participants are
then given the link and told: use what you just learned, or try something different.
The techniques are not mandatory. They are the starting point.

## Timing

The session runs for approximately three hours.

- 30 minutes: introduction and threat intelligence briefing. Purple team format, the
  two roles, the display, the ground rules. Then the threat intel briefing: current
  techniques with real examples. Then the tracking link is distributed and the exercise
  begins.
- 90 minutes: live exercise. Red team and blue team active simultaneously. Blue team
  participants rotate at the machine every fifteen to twenty minutes. The display
  accumulates events throughout.
- 15 minutes: mid-session review. Pause everything, look at the display together.
- 45 minutes: debrief.

## Facilitator actions before the session starts

1. Prepare the Gophish campaign for the session: create the landing page, create a
   campaign targeting the sandbox inbox, and copy the tracking URL. This is the link
   distributed to red team participants.
2. Set up the display machine and confirm the campaign dashboard is visible and
   projecting.
3. Log in to the sandbox Outlook inbox on the blue team machine and confirm the Report
   button is visible.
4. Prepare the threat intelligence briefing: two or three current phishing examples
   with screenshots, a brief description of the technique used, and why it works. Pull
   these from the sources in the threat intelligence runbook. Keep it to ten minutes of
   material.

## Facilitator actions during the exercise

1. Distribute the tracking link to red team participants at the start of the exercise.
   Write it on the whiteboard or paste it into a shared note they can copy from.
2. Do not help participants craft their emails unless they are completely stuck. The
   struggle to make something convincing is part of the learning.
3. Brief each blue team participant before they sit down: act as you would at your desk
   on a normal working day. Emails will arrive. Respond as you would respond to a real
   email. Do not look to the room for cues.
4. Do not tell blue team participants how many emails to expect or when they will arrive.
5. If a blue team participant asks whether a specific email is a simulation, the answer
   is: what would you do if I was not here to ask?
6. Rotate the blue team participant every fifteen to twenty minutes. Tap the next person
   on the shoulder quietly. Do not announce the rotation to the room.
7. After each blue team rotation, take a brief note from the departing participant: what
   did you notice, what made you uncertain. These feed the debrief.
8. Monitor the display. Do not comment on events as they happen. Let the room notice
   them.

## Mid-session review

After ninety minutes, pause the exercise and bring the room's attention to the display.

Walk through the results together: how many emails were sent, how many opened, how many
clicked, how many reported. Ask the room what they observe. Let red team participants
identify their own campaigns. Let blue team participants say what they did and why.

Ask the red team: what worked and what did not? Ask the blue team: what was convincing
and what gave it away? The answers are the intelligence both sides carry into the second
half.

After the review, the exercise resumes. Red team participants adjust their approach based
on what they learned. Blue team rotation continues. The display keeps accumulating.

## Debrief

The debrief has two parts.

The first part reviews the full session results on the display. Go through each campaign.
For campaigns that generated clicks: what made this work? For campaigns that generated
reports: what gave it away? For campaigns that generated neither: what does hesitation
look like and what is the right response to it?

The second part covers the practical takeaways: the recognition signals, the verification
habit, and the Report button as the correct response to any suspicious email regardless
of certainty. Demonstrate the Report button on the blue team machine. Show the room that
using it generates a report event on the display, distinct from a click. The loop is
visible and complete.

End with this: the emails produced in this room today were made in ninety minutes by
people with no prior attacker experience, using a tracking link they were handed and
the organisation's public website. A dedicated attacker has more time, more skill, more
information, and is not doing this as an afternoon exercise. The question is not whether
a convincing phishing email can reach the Home. It can. The question is what the person
who receives it does next.

They now know the answer.
Last updated: 21 March 2026
