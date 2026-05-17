# Staying hidden

Perfect mimicry is not the goal. Being realistic enough to waste an attacker's time while gathering
intelligence is. The two are different targets, and the difference determines how much effort is worth
spending on anti-detection.

## Automatic redeployment

Low-interaction honeypots are convincing at a glance but fragile under scrutiny. One approach is to
stop trying to make them detection-resistant and instead redeploy them quickly when detected.

Monitor ICMP traffic to the honeypot. If traffic drops below a threshold, the attacker has probably
identified the decoy and disengaged. Spin up a fresh instance with a slightly different configuration.
The attacker believes they have moved past the honeypot; they encounter another one. The cost of
engineering resilience against detection shifts to the cost of fast redeployment, which is usually
lower.

## Latency fingerprinting

Honeypots often introduce predictable delays. Virtual honeypots built on Honeyd, for instance, have
historically exhibited response times in multiples of 10ms, which is atypical for real systems.
Scanners and probing tools can detect this pattern.

The fix is measurement before deployment: record the response timing of the production services the
honeypot is mimicking, then adjust the honeypot responses to match. A 23ms delay is harder to flag
as synthetic than a 20ms or 30ms one.

## TCP handover transparency

Hybrid honeypots (low-interaction frontend, high-interaction backend) can leak observable artefacts
during the handover between layers. One approach to reduce this:

* The frontend completes the TCP handshake as normal.
* Rather than an overt handover, it replays the SYN packet to the backend, synchronising sequence
  and acknowledgement numbers.
* The attacker interacts directly with the backend without passing through a visible transition point.

The tradeoff is a small additional latency during handover, which needs to be within the expected
range for the mimicked service.

## Dedicated hardware

Software honeypots emulate systems. Hardware honeypots are systems, and the difference shows in timing
behaviour. Real hardware has no artificial delays and handles high connection volume without the resource
exhaustion patterns that virtualised stacks exhibit under load.

FPGA-based implementations take this further: they process traffic at line speed and present no OS
attack surface of their own. The tradeoff is cost and deployment inflexibility.

## Adaptive behaviour

Several systems apply machine learning to honeypot responses:

* RASSH uses reinforcement learning to vary its responses to attacker actions rather than following
  fixed scripts.
* DeepDig adjusts its behaviour based on what previous intrusion attempts revealed.
* Systems that rename or alter command outputs (renaming `ls` to `dir`, for instance) can observe
  how an attacker adapts when the environment behaves unexpectedly.

The practical value is in studying how specific adversaries respond to variation, which produces more
useful intelligence than a static environment that confirms only what the attacker already assumed.
