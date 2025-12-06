# Everything in Docker Hub is trustworthy, right?

Ludmilla is reviewing pull request history when she finds it. A developer (Sam Vimes Jr., it's always him) pulled a 
Docker image called `totally-not-malware:latest` from Docker Hub.

"Sam," Ludmilla says, walking to his desk with laptop in hand, "what is this?"

"Oh, that? It's a Redis container. I needed it for testing."

"From an account called `definitely-legitimate-source` with zero stars, no description, and published three days ago?"

"...yes?"

Ludmilla closes her eyes. Counts to ten in Überwalder. Opens them. "Cheery, we need vulnerability scanning. Like, 
yesterday."

The deeper investigation reveals worse problems: no image signing, no vulnerability scanning, developers pulling 
random images from public registries, base images months out of date, and absolutely no process for validating 
container provenance.

## What they built

Ludmilla deploys [Harbor](https://github.com/goharbor/harbor/releases) as their private container registry on a cloud 
instance with 500GB storage. All images must pass through Harbor. No exceptions.

[Trivy](https://github.com/aquasecurity/trivy/releases) scans every image before it is promoted to production. 
Critical or high severity vulnerabilities block the image. And no manual overrides without security team approval.

[Cosign](https://github.com/sigstore/cosign/releases) signs all approved images. Build pipelines generate signatures. 
Kubernetes admission controllers verify signatures before allowing pods to run.

Image promotion workflow: build → scan → review vulnerabilities → sign → push to production registry. Immutable tags 
enforce that production images can't be overwritten.

SBOM generation using [Syft](https://github.com/anchore/syft/releases) catalogues every component in every image. 
When vulnerabilities are announced, they can instantly identify affected images.

The `totally-not-malware:latest` image is deleted from all systems. Sam Vimes Jr. buys everyone pizza as penance 
and attends mandatory container security training.

## Runbooks

* Harbor deployment
* Trivy integration
* Cosign signing workflows
* Admission controller configuration
* SBOM generation
* Vulnerability management procedures

