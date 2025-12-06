# DMARC configuration

DMARC allows the domain owner to specify what happens with failed emails and get feedback when they arrive. 
Basically, there are three actions receiving servers can take if BOTH SPF and DKIM checks fail: `none`, `quarantine`, 
and `reject`.

Setting it up takes [five-steps as listed on the DMARC website](https://dmarc.org/overview/)

* Deploy [DKIM](../dkim/overview.md) & [SPF](../spf/spf). You have to cover the basics, first.
* Ensure that your mailers are correctly aligning the appropriate identifiers.
* Publish a DMARC record with the “none” flag set for the policies, which requests data reports.
* Analyse the data and modify your mail streams as appropriate.
* Modify your DMARC policy flags from “none” to “quarantine” to “reject” as you gain experience.

[Flaws as per the infosec institute](https://resources.infosecinstitute.com/topic/domain-based-message-authentication-reporting-and-conformance/)

We may think that, using SPF and DMARC would complete the holes in the mail filtering system. There is a small side effect for this method, i.e. the mail reaches the receiver end if either one of SPF or DKIM passes it in. If an attacker manages to find a way to pass SPF or DKIM, it will reach the inbox. An attacker can bypass the DMARC by creating a perfect mail copy if the following steps are followed:

* If the attacker uses a server IP that passes through SPF policy. This could be done by selecting the same email
provider as the sender.
* Attacker can make use of any authorized server to create a mail; this mail will be given proper DKIM keys as other 
legitimate mail and would reach the receiver end.
* Let’s say that the senders side is fully configured with SPF, DKIM, DMARC and the receiver side is left without any 
proper configuration, the mail could easily reach the receivers end, since there are no properly established filters.





