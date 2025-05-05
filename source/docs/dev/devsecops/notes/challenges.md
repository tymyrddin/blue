# Growing list of challenges

## Security silos

It is common for many security teams to be left out of DevOps processes and portray security as a separate entity, where specialised people can only maintain and lead security practices. This situation creates a silo around security and prevents engineers from understanding the necessity of security or applying security measures from the beginning.

This is not scalable or flexible. Security is a supportive function to help other teams scale and build security, without security teams being a blocker, but rather a ramp to promote secure solutions and decisions. The best practice is to share these responsibilities across all team members instead of having a specialised security engineer.

## Lack of visibility & prioritisation

Aim to create a culture where security and other essential application components treat security as a regular aspect of the application. Developers can then focus on development with confidence about security instead of security departments playing police and the blame game. Trust can be built between teams, and security can promote the autonomy of teams by establishing processes that instil security.

## Stringent processes

Every new experiment or piece of software must not go through a complicated process and verification against security compliances before being used by developers. Procedures can be made to be flexible to account for these scenarios, where lower-level tasks are treated differently, and higher-risk tasks and changes are targeted for these more stringent processes.

Developers need environments to test new software without common security limitations. These environments are known as "SandBoxes", which are temporarily isolated environments. These environments have no connection to any internal network and have no customer data.

## Promote autonomy of teams

Whether it is a large organization or a start-up in hypergrowth, the only way to not leave security behind is by promoting the autonomy of teams. This can be done by automating processes that fit seamlessly with the development pipeline until security tests become just another type of test, like unit testing, smoke bombs, etc.

Leading by example and promoting education like creating playbooks/runbooks to spot these flaws and fix them, understand their risk, and build confidence in engineers to make the secure decision independently. The ratio of developers, platform, infrastructure engineers, etc., won't be the same as security engineers, and we must understand they can't be in every conversation. Security is a supporting function that focuses on building trust and creating as much overlap in knowledge between teams as possible.

## Visibility and transparency

For every tool being introduced or practised, there needs to be a supporting process that provides visibility and promotes transparency to other teams. This means that if we want to build autonomy in groups, as mentioned earlier, they need to have visibility on the security state of the service they own or maintain. For example, a dashboard visualises the number of security flaws by the criticality of the service. This helps prioritise accordingly, so tasks don't get lost in the backlog or noise, and they can tackle flaws at the right time. The security state measure depends on the company, but it could be the number of high findings a service might or might not have which determine if it is in a good security state.

Transparency would refer to introducing tools and practices that are accessible to teams. For example, if you present a check before merging code, and the review doesn't pass and shows a message saying "signature of possible code injection flaw detected, please remediate," the developer or engineer needs to have access to the tool that is flagging that message. Usually, these analysis tools that flag those alerts have a UI that specifies the line in code where it's affected. They include a definition and a remediation suggestion with steps. In this example, a developer role can be created so that they have access to more information. This promotes education and autonomy by extending transparency that, traditionally, was only accessible by security teams.

## Understanding and empathy

There is no magic tool or process for everyone. It is essential to understand how developers/engineers work, what they know to be a risk, and what they prioritise. If you know their perspective, it's easier to build a process that finds common ground and has a higher chance to work vs adding another tool that creates more noise and stress for everyone. This understanding builds perspective, which accounts for empathy for how other teams work and builds a process that accounts for flexibility. This is needed because every situation might be different, deadlines might be different, and bandwidth can change over time.

As a DevSecOps engineer, suppose you took the time to understand how a team owns a service. You can tune the scanners or add a triaging process that tackles the questions they would ask themselves, and this would, in turn, build trust vs crying wolf and security processes being questioned.


