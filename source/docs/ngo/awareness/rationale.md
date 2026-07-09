# Why this works the way it does

Two decisions in this programme are unusual enough to warrant explanation: the choice to
use attacker-role training, and the choice to run in-house simulations against live
defences.
Both decisions have the same root. The goal is behaviour change, not completion rates, and
those two goals produce different programmes.

## Why playing the attacker works better than being taught about attackers

Traditional security awareness training asks participants to absorb information about
threats and then apply that information when a threat arrives. The approach is
intuitive and it does not work particularly well. The reason is not that people are
inattentive or that the training is poorly designed. It is that knowledge about how to
recognise a threat and the instinct to recognise it in the moment are different things,
acquired differently.

Knowing that phishing emails often create urgency does not reliably produce the response
"I am feeling urgency, therefore I should be suspicious" when an urgent-sounding email
arrives at the end of a busy Friday afternoon. The gap between knowing and responding
is where most security incidents happen.

Experiential learning closes that gap more effectively than instruction. A participant
who has spent an hour trying to craft a convincing phishing email has done something
that passive training cannot replicate: they have felt the attacker's problem. They
have discovered that urgency works as a mechanism because they tried it and it worked.
They have noticed that a slightly wrong domain is easy to overlook because they nearly
used one themselves and had to think hard about whether it would be spotted. They have
a felt sense of what makes an email convincing that does not come from a slide about
red flags.

This is the basis of the attacker-role component. It is not novelty for its own sake.
It is the most direct route to the kind of recognition that survives a distracted
afternoon.

The purple team format reinforces this further. Participants who sit on the receiving
end of emails their colleagues have just crafted are not receiving abstract simulations.
They are receiving the output of people who were, twenty minutes ago, in the same room
thinking about exactly how to make them click. The emails feel real because they were
made by someone who wanted them to feel real. That experience is not available in a
training library.

## Why the simulation uses real techniques against live defences

Managed simulation platforms such as Microsoft Attack Simulation Training work by
instructing the email filtering system not to filter the simulation emails. A policy
exception tells Defender to let the simulation through. The email lands in the inbox
because the organisation's defences have been stood down for it.

This produces a measurement of how people respond to emails that would, in a real
attack, never reach them. It is not useless: even a bypassed simulation reveals
something about clicking behaviour. But it measures something different from what it
appears to measure, and the difference matters.

A real phishing email that reaches a staff inbox in 2025 or 2026 did not get there by
accident. It got there because it was constructed using a technique that the current
filters do not catch: a QR code image containing the payload URL, a link to a
legitimate OneDrive document that redirects to the credential page, an HTML attachment
that assembles its payload in the browser. These techniques are in active use. They are reaching real inboxes. They are what
staff need to recognise.

A simulation that only arrives because Defender was told not to block it does not train
recognition of these techniques. It trains recognition of a simulation. The two are not
the same, and the difference becomes visible the first time a real phishing email using
a current evasion technique lands in a staff inbox and nobody reports it, because it did
not look like the simulations.

The in-house approach requires the security team to track what is actually working in
the wild, translate it into Gophish campaigns, and test each payload against live
defences before deploying it. This is harder than selecting a template from a managed
platform's library. It is harder because it is the actual work. The value of the
simulation is precisely that it reflects the current threat.

## The professional commitment this requires

Running a simulation programme this way is not a one-time setup. It is a recurring
operational commitment. The security team, or the person responsible for the programme,
must maintain enough awareness of the current phishing landscape to select techniques
that are genuinely current, construct campaigns that are genuinely convincing, and
update the approach when the techniques change, which they do.

This is not a large time commitment. Reviewing a small number of threat intelligence
sources before each monthly campaign, running a payload test against a single account,
and adjusting the template as needed takes a few hours per cycle. But it requires that
someone owns it, reads the sources, and treats keeping the simulation current as part
of their security function.

The alternative, a managed platform running on autopilot with a stale template library,
produces completion metrics and click rate trend lines that look like a functioning
programme. Whether the programme is actually preparing staff for the emails they will
receive is a different question, and one that the metrics do not answer.
