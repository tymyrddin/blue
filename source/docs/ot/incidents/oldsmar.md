# Oldsmar

The operator was at his workstation when the cursor moved. The sodium hydroxide setpoint climbed from
111 parts per million to 11,100: a hundredfold increase in lye concentration bound for the water supply.
He reversed the change immediately. The attack lasted seconds by the measure of what changed on the HMI;
the access that made it possible had been present for longer. The Oldsmar incident on 5 February 2021 is
unusual in the incident record because an operator was present and watching while it happened. It is not
unusual in the conditions that allowed it to happen.

## 5 February 2021, Oldsmar, Florida

The Oldsmar plant supplies water to around 15,000 residents of Oldsmar, a city in Pinellas County,
Florida. The plant's HMI workstation had TeamViewer installed, used for remote support. On 5 February
2021, an unidentified person gained access through TeamViewer and, while an operator watched the cursor
move across his screen, changed the sodium hydroxide setpoint from 111 ppm to 11,100 ppm.

Sodium hydroxide is added to treated water to control pH. At the concentrations used in water treatment
it is not hazardous. At 11,100 ppm it would cause serious harm to anyone who consumed it. The operator
reversed the change within seconds. The plant's downstream pH monitoring and the normal residence time
in the treatment system before water reaches consumers would have offered additional catches had the
change persisted. No water reached distribution at the altered concentration.

Pinellas County Sheriff Bob Gualtieri disclosed the incident on 8 February 2021. The FBI and Secret
Service investigated. Attribution was not publicly established. Later reporting raised questions about
whether the incident involved external intrusion or an internal error; the investigation did not produce
a confirmed account.

## What was accessible

TeamViewer was installed on the HMI workstation for remote support, and remained active after that
support need had ended. The access path reached the HMI directly: no jump host intervened, no approval
workflow required a request before the session began. Whoever connected had the same view and the same
controls as an operator at the workstation.

Whether the account used was a vendor credential, a shared credential, or obtained by other means was not
confirmed in public reporting. The workstation reportedly ran Windows 7, which had reached end of support
in January 2020. An out-of-support operating system is not necessarily compromised, but its patch coverage
is bounded by what remains unpatched rather than by what is kept current.

The TeamViewer connection was logged. The log showed a connection. It did not trigger an alert.

## What caught it

An operator happened to be at the workstation and saw the cursor move. He recognised what the change
meant and reversed it immediately.

No automated detection flagged the remote session as anomalous. No alert fired on the setpoint value
leaving its normal operating range. No approval workflow required the connection to be authorised before
it began. The outcome depended on a person being present at the right moment with enough situational
awareness to act.

That is a single point of failure at the human layer. Several preceding conditions together ensured
everything depended on it.

## What would have changed the outcome

A jump host or purpose-built remote access gateway between any external connection and the HMI workstation
would have placed an auditable, approval-gated chokepoint in the path. A session reaching the plant
network would have required explicit authorisation before starting, and the session would have been
recorded in full.

Disabling TeamViewer between active support sessions removes the persistent access path. The discipline
of enabling remote access software only for specific, time-bounded windows and disabling it afterwards
prevents a support tool from becoming a standing entry point.

A setpoint alarm configured to alert on values outside expected operating ranges would have flagged the
11,100 ppm entry independently of whether anyone was watching. Process-layer controls of this kind do not
require an operator to be present; they fire against the value, not the session that set it. The plant's
downstream pH monitoring was a second catch that would have operated the same way. Neither requires the
operator to be lucky about the timing.

## Related

- [Remote access architecture](../architecture/remote-access.md): the jump host model and vendor access
  controls this incident did not have
- [Defence in depth](../architecture/defence-in-depth.md): process-layer setpoint alarms as a catch
  independent of whether the network or remote access layer held
- [Network monitoring and visibility](../architecture/monitoring.md): session logging that records
  connections but does not, by itself, alert on them
- [Colonial Pipeline](colonial-pipeline.md): May 2021, a different remote access failure in the same
  period; together they defined 2021's conversation about OT access controls

