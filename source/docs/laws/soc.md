# Set up a security operations team (SOC)

Depending on size of the organisation, these roles may be beneficial:

* Security analysts (4 tiers is common in large organisations) are first responders. They report on threats and implement any changes needed to protect the organisation. They are supposed to be the last line of defense against security threats, and work together with security managers and security engineers.
* Security engineers are usually software and/or hardware specialists, and are in charge of maintaining and updating tools and systems. They are also responsible for documentation other team members might need, such as digital security protocols.
* A direct manager is responsible for the team, directing operations and responsible for communications; hiring; training; and creating and executing the chosen security strategy. They also direct and orchestrate responses to major threats.
* A chief information security officer (CISO) is responsible for creating security-related strategies, policies, and operations. They work closely with CEO, senior management, HR, legal departments, and inform management on security issues.
* A leader of incident response (IR) is responsible for managing incidents, and [communicating security requirements](communications.md) to the organisation in the case of a data breach.

## Difference between SIRT and SOC

An [incident response team](sirt.md) (alias CERT or CIRT) is responsible for receiving, analysing, and responding to 
security incidents. SIRTs can be a part of a SOC or can stand alone.

While the core function of a SIRT is to minimize and manage damage caused by an incident, it does not just deal with 
the attack itself; they also [communicate with clients, executives, and the board](communications.md).

## Considerations

* The distinction between detection and response is not clear-cut. Threat hunting is used to identify threats, 
and often also operates as a method of response.
* Both SOC and SIRT use security orchestration, automation and response (SOAR) tools.
* Tier 1 work is pretty boring. Monitoring screens all the time, including nights and weekends. Motivation can fall, 
including eyelids. When the teams are combined, job rotation is possible, and may keep people motivated.
* Keeping the SIRT and SOC separate allows them to focus on their core objectives, say some. Or makes people less effective.
* When an organisation has multiple sites, it is good practice to have a SOC at each, and a single centralised SIRT.

## Resources

* [Pros and Cons of Outsourced SOC](https://www.datashieldprotect.com/blog/pros-and-cons-of-an-outsourced-soc)
* [Pros and cons of an outsourced SOC vs. in-house SOC](https://www.techtarget.com/searchsecurity/tip/In-house-vs-outsourced-cybersecurity-operations-center-capabilities)
