# MFA fatigue

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
helpdesk.

Passkeys (FIDO2 authenticators) eliminate push fatigue entirely. They are also origin-bound,
which means a phishing site cannot relay the credential. Hardware security keys cost money. Browser
and platform passkey support is inconsistent across older operating systems and enterprise management
tools. An organisation mid-rollout has a mixed environment where push notification MFA remains the
fallback for users who cannot yet use passkeys, and push fatigue remains a live risk for those users.

The honest picture: the gap between "MFA deployed" and "MFA deployed in a form resistant to push
fatigue and phishing" is substantial, and many organisations are somewhere in that gap.
