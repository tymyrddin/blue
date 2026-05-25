# Operational cost of security controls

Security documentation describes what controls do. It rarely describes what they cost to run.
A control that works when deployed correctly and produces zero operational friction does not exist.
Every control involves a tradeoff between the protection it provides and the overhead it creates,
and practitioners navigate that tradeoff constantly.

Vendors do not document this. The framing in most product documentation assumes deployment is
straightforward and operational friction is negligible. It is not. Five categories where the gap
between stated benefit and deployed reality is large enough to affect deployment decisions are
worth naming directly.

## MFA fatigue

Push notification MFA can be defeated by sending repeated authentication requests to a target
until they approve one to stop the notifications. The technique has appeared in significant breaches,
including those targeting major technology companies. It is not theoretical.

Number matching (displaying a code on the authentication attempt that the user must confirm in the
push notification) defeats push fatigue. Most enterprise MFA platforms support it. It adds a few
seconds to the authentication flow.

The operational friction lies elsewhere. Helpdesk call volume for MFA issues is substantial: new
phones, lost authenticators, lockouts after repeated failures, travelling users without signal.
Implementing the correct helpdesk recovery flow (verifying identity before resetting MFA) is a
separate project that many organisations have not completed. The gap left is a helpdesk reset process
that accepts weaker identity verification, which allows MFA bypass through social engineering at the
helpdesk rather than through push fatigue.

Passkeys (FIDO2 authenticators) eliminate push fatigue entirely. They are also origin-bound,
which means a phishing site cannot relay the credential. Hardware security keys cost money. Browser
and platform passkey support is inconsistent across older operating systems and enterprise management
tools. An organisation mid-rollout has a mixed environment where push notification MFA remains the
fallback for users who cannot yet use passkeys, and push fatigue remains a live risk for those users.

The honest picture: the gap between "MFA deployed" and "MFA deployed in a form resistant to push
fatigue and phishing" is substantial, and many organisations are somewhere in that gap.

## Detection false positive economics

Every analyst has a finite queue. An alert that is almost always a false positive trains the analyst
who reviews it to dismiss quickly. Eventually, they dismiss all alerts in that category quickly,
including the ones that are real.

Alert fatigue is not a motivational problem. It is a signal quality problem. A detection system
that fires on 90% false positives does not detect 10% of incidents: it provides something closer
to no detection, because the processing overhead eliminates the human capacity to investigate the
real ones.

A tuned detection rule is not one that fires rarely. It is one that fires with a high true positive
ratio. The exclusion list on a rule is calibration, not compromise. The goal is that when the rule
fires, the analyst has reason to investigate rather than reason to dismiss.

Measuring false positive rate requires tracking analyst disposition on every alert. Many environments
do not do this systematically. Without it, false positive rate is a feeling rather than a metric,
and calibration has no feedback signal. The "our detection is probably too noisy, but we're not sure"
state is common.

The practical consequence: the cost of a detection rule is not the engineering time to write it.
The cost is the analyst time consumed by every false positive it generates for as long as it runs.
A rule that generates ten false positives per analyst per week consumes roughly three hours of
analyst time per week, indefinitely, until it is tuned or disabled.

## HVCI and performance overhead

Hypervisor-Protected Code Integrity prevents unsigned code from running in kernel mode. It defeats
BYOVD (Bring Your Own Vulnerable Driver) attacks, which have appeared in ransomware deployments
and nation-state operations. HVCI is among the most effective endpoint controls available against
this class of attack.

Its cost: between 5% and 25% overhead on workloads that make intensive use of kernel operations,
on hardware that does not support MBEC (Mode-Based Execution Control). MBEC is supported on processors with hardware virtualisation extensions introduced around
2017 to 2019; check the Windows Hardware Compatibility Program or the device vendor for a
specific system. On older hardware, the hypervisor cannot
distinguish user-mode from kernel-mode execution at the page level, and enforces protection with
software inspection that adds overhead proportional to kernel call frequency.

On server workloads (database engines, storage controllers, network appliances with kernel bypass
networking), the overhead can reach a level that requires additional hardware capacity. On developer
workstations with virtualisation-heavy workflows, it may cause noticeable performance changes.

The deployment pattern this produces: HVCI on all workstations where the BYOVD risk is highest and
the performance impact is acceptable; HVCI on servers where workloads permit; explicit policy
exceptions for servers where the overhead would require reprovisioning. The exceptions are the
remaining attack surface.

One additional condition: Memory Integrity (the Windows UI name for HVCI) can be disabled via
registry on systems where it is not enforced through hardware or through a policy that prevents
the registry write. An attacker with local administrator access can disable it. Effective deployment
requires enforcement through Secure Boot and a mechanism that prevents the registry modification.

## Application control exclusion creep

Application control starts with a policy: only approved binaries run. Over time, the exceptions
accumulate. Each exception reflects a binary that needed to run and was not in the approved list.
Legitimate exceptions include vendor tooling, custom line-of-business applications, diagnostics
utilities, and update installers.

After two or three years, the exception list in many deployments is larger than the original
approved list. The effective policy at that point approximates "block unsigned binaries from
user-writable paths", which provides some protection but is substantially weaker than the
intended control.

A more durable approach manages exceptions through a review process where each exception includes
the binary, the use case, and a review date. Exceptions granted for a one-off diagnostic tool
have an expiry; exceptions for ongoing line-of-business applications are reviewed annually against
whether the application is still in use. Exceptions without review dates accumulate indefinitely.

The partial deployment case: enforce mode on domain controllers, certificate authorities, backup
infrastructure, and other high-value targets still provides meaningful protection. The deployment
does not need to be universal to raise lateral movement cost significantly for an attacker
targeting those specific systems.

## CASB and DLP latency

Cloud Access Security Brokers deployed in proxy mode and DLP systems with inline content inspection
add latency to operations that route through them. The added delay per request is typically small
(50 to 200 milliseconds), but it is noticeable in interactive workflows, particularly for
applications that make many small API calls.

The more significant operational issue is false positive volume. DLP rules matching on regular
expressions for credit card numbers, tax identifiers, or other sensitive patterns will catch
legitimate business documents that contain such data in non-sensitive contexts: audit reports,
anonymised training data, financial statements. In environments with active DLP, the per-week
false positive volume can reach hundreds of cases.

The typical response to high false positive volume is raising thresholds or narrowing rules. Both
reduce sensitivity. At the extreme, rules that would generate too many false positives to investigate
are disabled, and the protection exists on paper only.

Effective DLP requires ongoing tuning: understanding what legitimate data flows look like, writing
rules narrow enough to catch anomalous transfers without flagging routine business activity. This
is ongoing work. An organisation that deploys DLP and does not maintain it typically ends up with
a system that generates too many alerts to action, too few alerts to trust, or both at different
times.

The honest framing for all five categories: the controls are worth deploying. The friction is worth
naming, because practitioners who understand the friction can plan for it, resource it, and make
informed decisions about where to accept a tradeoff. Practitioners who are not told about it
encounter it as failure rather than as an expected property of the environment.
