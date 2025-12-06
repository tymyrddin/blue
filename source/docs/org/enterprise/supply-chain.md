# Supply chain security

Ludmilla is reading about a supply chain attack on a popular JavaScript library. The attacker compromised the 
maintainer's account, pushed malicious code, and thousands of applications downloaded it automatically.

She checks Golem Trust's dependencies. They use that library. In 23 different applications. Updated automatically by 
Renovate Bot.

"We got lucky this time," she tells the development team meeting. "The malicious version was detected and pulled 
within hours. But we would have automatically pulled it. We need to verify what we're building."

## What they built

Ludmilla implements SLSA Level 3 compliance across all build pipelines. Every artifact must have provenance attestation 
proving exactly how it was built.

[Tekton Pipelines](https://github.com/tektoncd/pipeline/releases) replaces the old CI/CD system. Ephemeral build 
environments, created fresh for each build, destroyed after. No persistent builders that could be compromised.

[In-toto](https://github.com/in-toto/in-toto/releases) generates attestations for every build step. Who triggered the 
build, what source code version, what dependencies, what build commands, what output artifacts. Complete chain of 
custody.

Sigstore integration: all artifacts signed with [Cosign](https://github.com/sigstore/cosign/releases). Signatures uploaded to a transparency log. Anyone can verify artifact provenance.

SBOM (Software Bill of Materials) generation using [Syft](https://github.com/anchore/syft/releases). Every container image, every release artifact includes complete component list with versions and licenses.

Dependency verification: custom tooling checks every dependency against known-good checksums. If checksum doesn't match, build fails. Manual review required.

Internal dependency mirror: critical open-source dependencies mirrored internally. 237 packages. Golem Trust maintains hashes. If upstream is compromised, they have clean versions.

They scan for license compliance and known vulnerabilities in dependencies. Forbidden licenses block builds. GPL-3.0 requires legal review. Proprietary licenses absolutely forbidden.

Supply chain security becomes competitive advantage. "We can prove exactly what's in our software" becomes a selling point to security-conscious customers.

## Runbooks

* Tekton pipeline setup
* SLSA implementation
* In-toto attestation
* Sigstore integration
* SBOM generation
* Dependency verification
* Internal mirroring

## Related

- [Watching the tributaries](https://purple.tymyrddin.dev/docs/audits/nis2/tributaries)
- [Supply-chain Levels for Software artefacts (SLSA)](https://blue.tymyrddin.dev/docs/dev/devsecops/cicd/artefacts.html#supply-chain-levels-for-software-artefacts-slsa)
- [Dependency hell in software supply chains](https://indigo.tymyrddin.dev/docs/debt/dependency-hell.html)
