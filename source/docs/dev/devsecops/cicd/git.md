# Code and Git

## Clean Git

Removing all secrets from the current state of the repository is not enough. Sensitive information that made it into the Git history can still be accessible to attackers if a Git repository is exposed. Tools like [Trufflehog](https://github.com/dxa4481/truffleHog) and [GitLeaks](https://github.com/zricethezav/gitleaks) scan the repository Git history for traces of secrets that the team may have added in the past.

And [GitOops!](https://github.com/ovotech/gitoops) is a tool to help attackers and defenders identify lateral movement and privilege escalation paths in GitHub organizations by abusing CI/CD pipelines and GitHub access controls.

## Linting

Linting is a process performed by tools that identify coding style deviations and unsafe practices, such as:

* Indexing beyond arrays.
* Dereferencing null pointers.
* (Potentially) dangerous data type combinations.
* Unreachable code.
* Non-portable constructs.

linters are more valuable for interpreted languages such as Python and JavaScript, because there is no compiler to detect errors during development time. And there is "too much". Implementing a linter on a mature project can become a tremendous task and annoyance.

Linters focused on Security:

* [Brakeman](https://docs.sourcelevel.io/engines/brakeman/) for Ruby
* [Bandit](https://docs.sourcelevel.io/engines/bandit/) for Python
* [Node Security](https://docs.sourcelevel.io/engines/nodesecurity/) for JavaScript

## Static Application Security Testing (SAST) 

SAST techniques can look through the application in a commit and analyse its dependencies. SAST tools can find buffer overflows, SQL injection flaws, and other issues. If dependencies contain any issues or known security vulnerabilities, the commit will be marked as insecure and will not proceed to deployment.

## Dynamic Application Security Testing (DAST) 

Have DAST techniques spin up a copy of the production environment inside the CI job to scan the containers and executables. The dynamic aspect helps the system catch dependencies that are being loaded at launch time.

## Data security procedures

Teams need real data to ensure that everything will work smoothly once in production, but the nonproduction systems are usually not secure enough.

Update development and testing environments with data pulled from production environments. Then use this recently pulled data to validate features and test experiences and employ data masking to obscure personally identifiable information and other data subject to data compliance requirements.

Other techniques include using synthetic data and service virtualisation. 

## Zero-trust principles

Some basic practices include the least-privilege principle, hiding API keys, defining project- and role-based security credentials in CI/CD tools, and securing access for remote devops team members.

## Automation

Intelligent automation addresses many of the core requirements for successful software delivery. Basic process automation can increase devops productivity by automating routine manual tasks through code. 

Building on that, work with operational teams and tools to respond to incidents and recognise when technical debt is becoming an operational or security concern. 

* AIops tools centralise operational data, correlate alerts into incidents, and help automate incident response around performance and reliability issues.
* Security automation protects against threats and attacks while enabling automations that set permissions, patch systems, and respond to security incidents.
* Many CI/CD tools provide two-way integrations with AIops, security automation, and other generalised IT automation tools. Trigger notifications to these tools as part of the CI/CD pipeline to inform operations and infosec about code deliveries. And vv. Also allow IT ops and infosec automations to trigger builds or rollbacks to support operational and security needs.

## Resources

* [OWASP Source Code Analysis Tools](https://owasp.org/www-community/Source_Code_Analysis_Tools)
* [Splunk: What Is Artificial Intelligence for IT Operations (AIOps)?](https://www.splunk.com/en_us/data-insider/ai-for-it-operations-aiops.html)

