# Secrets in Git commits

Carrot Ironfoundersson joins from the City Watch. His first day, Adora Belle asks him to "have a look at our 
security posture." She doesn't specify what that means. Carrot is thorough by nature.

On day three, he appears in Ponder's workspace holding a printout. It is 47 pages long.

"Ponder," Carrot says in his earnest way, "I found API keys in 23 different Git commits. Database passwords in 8 
configuration files. One AWS credential. I didn't know we used AWS?" 

They don't. It's a developer's personal account. For testing. From six months ago.

"And," Carrot continues, flipping pages, "there's a file called `production-db-passwords.txt` in the merchant's 
guild repository. It has `644` permissions. Anyone can read it."

Ludmilla Katzenzungen, the new developer from Überwald, is called in. She's horrified. "This is ... this is not how 
we did things at the Überwald Engineering Guild. This is not acceptable."

Adora Belle makes a decision. "Carrot, you're now Head of Security. Fix this. Use whatever resources you need. 
Ludmilla, you're helping. Ponder, give them server access."

## What they built

Carrot and Ponder deploy [HashiCorp Vault](https://releases.hashicorp.com/vault/) in a high-availability configuration. 
Three cloud instances form a Raft cluster across two availability zones. They use Integrated Storage as the backend 
and configure `auto-unseal` using Vault's Transit engine.

The architecture is deliberate: no single point of failure, automatic leadership election, and all data encrypted at 
rest.

Database credentials become dynamic. Applications request short-lived database users from Vault's database secrets 
engine. Default TTL is one hour. Maximum is 24 hours. Credentials rotate automatically.

Application authentication uses AppRole. Each application gets a role with precisely defined policies. No 
overprivileged service accounts.

Ludmilla implements `git-secrets` hooks across all repositories. Pre-commit checks scan for patterns that look like 
secrets. [TruffleHog](https://github.com/trufflesecurity/truffleHog/releases) runs in CI/CD pipelines to catch 
anything that slips through.

The `production-db-passwords.txt` file is deleted, shredded, and its existence never spoken of again.

## Runbooks

* Vault HA deployment
* Raft configuration
* Database secrets engine setup
* AppRole authentication
* Dynamic credentials workflows
* `git-secrets` implementation

## Related

- [SIRT formation with Carrot as incident commander](https://purple.tymyrddin.dev/docs/secops/sirt/)
- [Knowledge transfer and IR playbooks](https://purple.tymyrddin.dev/docs/knowledge-transfer/)
