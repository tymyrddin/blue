# Runtime security with Falco

Kubernetes is running hundreds of pods. Containers starting, stopping, communicating. What happens inside containers 
at runtime? Ludmilla doesn't know, and that bothers her.

"We scan images before deployment," she says. "We have network policies. But what if something malicious runs 
inside a container at runtime? Crypto mining, data exfiltration, container escape attempts?"

Dr. Crucible suggests Falco. "eBPF-based monitoring. Sees system calls. Detects suspicious behaviour. The container 
equivalent of having Angua watch everyone's actions."

## What they built

Dr. Crucible deploys [Falco](https://github.com/falcosecurity/falco/releases) on every Kubernetes node as a DaemonSet. 
Falco uses eBPF to monitor system calls from all containers without requiring kernel modules.

Detection rules for suspicious behaviour:

- Shells spawned in containers (except explicitly allowed)
- Sensitive file access (/etc/shadow, /etc/passwd)
- Unexpected network connections
- Privilege escalation attempts
- Container escape attempts
- Crypto mining indicators (high CPU with network to mining pools)

Custom rules for Golem Trust environment:

- Production database containers shouldn't spawn shells
- Application containers shouldn't access Kubernetes API
- No outbound connections to unexpected countries
- Volume mounts to host filesystem flagged

Alert routing to Graylog. Critical alerts also to PagerDuty.

Response automation: containers exhibiting malicious behaviour can be automatically killed. Network policies updated 
to block malicious connections.

First week catches: developer accidentally left debugging shell in production container. Falco alerts. Container 
killed and replaced. Three crypto mining attempts in staging environment (compromised developer workstation). 
All caught within seconds.

## Runbooks

* Falco deployment
* eBPF configuration
* Custom rule development
* Alert routing
* Response automation
* Troubleshooting.

## Related

[Risk management & assessment](https://purple.tymyrddin.dev/docs/risk-management/)
