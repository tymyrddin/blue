Email and cloud security
======================================================================================================

Cloud accounts, particularly email, are high-value targets. Email is typically the recovery path for
every other account: control of an inbox often means control of everything linked to it. Attackers know
this and target it accordingly.

MFA blocks credential stuffing and phishing attempts that would otherwise succeed with a stolen password.
Checking forwarding rules catches a common post-compromise technique that allows attackers to read incoming
mail silently. Encrypting files before uploading limits the damage from cloud storage breaches or provider
access requests.

.. toctree::
   :glob:
   :maxdepth: 1
   :includehidden:
   :caption: Email access is access to most things. Worth protecting accordingly.

   mfa.md
   email.md
   encrypt.md
