# The sticky note incident

It starts on a Tuesday morning when Commander Vimes of the City Watch walks into the warehouse unannounced. His 
boots leave muddy prints on the concrete floor that still smells faintly of fish. He's holding a sticky note.

"Found this in an alley near Pseudopolis Yard," Vimes says, placing it on Ponder's desk. 
"Says `HEX-THINKS-THEREFORE-HEX-AM` and has your company address on it."

Ponder's face goes pale. It's the root password. The wind must have blown it off Mr. Pump's chest plate again. The 
golem tends to stand near the warehouse's ventilation grate when processing particularly complex routing tables.

"Mr. Stibbons," Vimes continues, sitting down without being asked, "I've been hearing things. The Seamstresses' 
Guild trusts you with their data. Mrs. Cake's boarding house financial records are on your systems. And you're 
authenticating users with passwords written on sticky notes?"

Adora Belle arrives, overhearing. Her expression could freeze the Ankh in summer. "Ponder. My office. Now."

The meeting lasts two hours. By the end, they have a plan.

## What Ponder built

Ponder deploys [Keycloak](https://github.com/keycloak/keycloak/releases) on their first proper production server, 
a [Hetzner cloud](https://www.hetzner.com/cloud/) instance in Finland. He chooses Finland specifically because it's 
"sufficiently far from Ankh-Morpork's chaos" and "extremely strict about data protection laws."

The server runs [Debian](https://www.debian.org/releases/) with 
[PostgreSQL](https://www.postgresql.org/docs/release/) as the backend database. Ponder configures two realms: 
one for internal Golem Trust employees, another for customer portal access.

Password policies are strict (Adora Belle insisted): minimum 16 characters, no dictionary words, mandatory 2FA 
using authenticator apps. She orders hardware authentication devices from Überwald for the entire team.

But then there's the golem problem. Mr. Pump doesn't use passwords. He has a cryptographic identity embedded in his 
chem. Ponder creates the first "golem authentication protocol," using SHA3-512 hashes of golem chem signatures for 
authentication.

For password storage, Ponder deploys [Vaultwarden](https://github.com/dani-garcia/vaultwarden/releases) 
(Bitwarden-compatible) on another Hetzner cloud instance. Collections are created for infrastructure secrets, 
customer admin accounts, and emergency access credentials (the latter physically stored in an actual vault at the 
Bank of Ankh-Morpork).

The sticky note is ceremonially burned.

Documentation begins using [Sphinx](https://github.com/sphinx-doc/sphinx/releases) with the Sphinx-Immaterial theme. 
Adora Belle insists everything be written down. "We're not cowboys. We're professionals. Professionals document."

## Runbooks

* Keycloak deployment
* PostgreSQL backend configuration
* golem authentication implementation
* Vaultwarden setup
* Backup procedures

## Related

- [Initial threat modeling: physical and remote access](https://purple.tymyrddin.dev/docs/threat-modelling/)
- [Risk assessment: Shades fire scenarios](https://purple.tymyrddin.dev/docs/risk-management/)