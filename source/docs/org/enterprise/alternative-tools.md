# Alternative tools

The Royal Bank of Ankh-Morpork has sent a third-party risk questionnaire. Item 47 asks for a list of all software vendors and their country of incorporation. Item 48 asks what would happen if any of those vendors became unavailable.

Otto Chriek photographs both items for the record. Then he hands the questionnaire to Dr. Crucible.

She reads item 48 twice. "They're asking whether we've thought about this."

"Yes," Otto says.

"Good," says Dr. Crucible. "Because I have."

This is that document. The [startup edition](../startup/alternative-tools.md) covers core infrastructure. The [scale-up edition](../scale-up/alternative-tools.md) covers the tooling added during the growth phase. This edition covers what was introduced at enterprise scale: the service mesh, the supply chain pipeline, the threat intelligence platform, the red team stack, and everything else that arrived with the banking customers.

## Framing

The same preferences apply as in the earlier documents: open source first, European where possible, no tool that cannot be replaced if its vendor changes direction. At enterprise scale, the stakes are higher. The Patrician's Office has opinions about vendor concentration. The Royal Bank auditors have forms for it.

Some of the tools listed here are already European. That is noted and the alternatives are documented anyway, because "already good" does not mean "irreplaceable".

## Service mesh

Current: [Istio](https://github.com/istio/istio/releases/)

Istio is a CNCF graduated project under the Apache 2.0 licence. It was originally developed by Google, IBM, and Lyft. Google contributes the majority of upstream commits. There is no licence concern; the concern is that the project's direction is substantially influenced by US hyperscaler interests, and that Istio's operational complexity is a significant burden if upstream support diminishes.

[Linkerd](https://github.com/linkerd/linkerd2/releases) is a CNCF graduated service mesh under the Apache 2.0 licence. It is significantly simpler than Istio: it uses a Rust-based micro-proxy rather than Envoy, has no control plane as complex as Istiod, and provides mTLS and observability with less configuration overhead. The tradeoff is fewer features: Linkerd does not support the full Istio AuthorizationPolicy model or traffic management capabilities such as header-based routing. For Golem Trust's primary use case (mTLS everywhere, SPIFFE identity, Kiali-based observability), Linkerd covers the requirements with lower operational complexity.

[Cilium](https://github.com/cilium/cilium/releases) is a CNCF graduated project that provides both CNI networking and a service mesh via eBPF. Isovalent, the company behind Cilium, was acquired by Cisco in 2024; the project remains Apache 2.0 and under CNCF governance. The eBPF approach eliminates sidecar overhead and provides deeper visibility into network traffic than either Istio or Linkerd. If Calico is ever replaced as the CNI layer, Cilium would handle both CNI and service mesh in a single component.

Linkerd is the preferred alternative for a direct Istio replacement. Cilium is the preferred path if the cluster networking layer is also under review.

## Policy as code

Current: [OPA Gatekeeper](https://github.com/open-policy-agent/gatekeeper/releases)

OPA and Gatekeeper are CNCF projects under the Apache 2.0 licence. Open Policy Agent was founded by Styra (US). There is no licence concern. The complexity concern is Rego: it is a capable policy language that is difficult to read and debug for teams without dedicated experience.

[Kyverno](https://github.com/kyverno/kyverno/releases) is a CNCF graduated project (Apache 2.0) that uses plain YAML for policies. The scale-up phase used Kyverno before Gatekeeper was adopted for its flexibility with complex multi-resource policies. For organisations prioritising readability over expressiveness, Kyverno remains the better choice.

[Kubewarden](https://github.com/kubewarden/kubewarden-controller/releases) is from SUSE (Germany), a CNCF sandbox project. Policies are WebAssembly modules. This is the most European of the three options and provides strong policy isolation, but the toolchain is less mature. It is worth tracking as it matures.

## Supply chain pipeline

Current: [Tekton Pipelines](https://github.com/tektoncd/pipeline/releases) with [In-toto](https://github.com/in-toto/in-toto/releases) attestation and [Cosign](https://github.com/sigstore/cosign/releases) signing

Tekton is a CNCF incubating project (Apache 2.0) originally developed by Google. It runs build pipelines as Kubernetes resources, which is its principal advantage: no external CI system, no special agents, pipelines are Kubernetes-native. The main limitation is that Tekton is significantly more complex to operate than GitLab CI.

[Argo Workflows](https://github.com/argoproj/argo-workflows/releases) is a CNCF graduated workflow engine (Apache 2.0) with similar Kubernetes-native design. Argo Workflows is better documented than Tekton and has a more mature UI. The Argo project as a whole (Argo CD, Argo Events, Argo Rollouts) provides a coherent GitOps stack that Tekton does not. If the supply chain pipeline were rebuilt from scratch, Argo would be the primary candidate.

[Woodpecker CI](https://github.com/woodpecker-ci/woodpecker/releases) (German, Apache 2.0) is simpler than either and less Kubernetes-native. It does not support the SLSA provenance attestation workflow that Tekton enables via TaskRun records, but it pairs well with a Forgejo source control migration if GitLab is ever replaced.

In-toto is a Linux Foundation project (Apache 2.0) with roots at New York University. There is no practical European alternative for supply chain attestation at this level of specificity; the standard itself is the relevant risk more than any particular implementation.

Cosign and the Sigstore infrastructure dependency are covered in the [scale-up alternative-tools document](../scale-up/alternative-tools.md).

## Threat intelligence

Current: [MISP](https://github.com/MISP/MISP/releases)

MISP is maintained by CIRCL (Computer Incident Response Center Luxembourg), a national CERT operated by the Luxembourg government. It is open source under the AGPL licence and one of the most European pieces of software in the entire stack. The threat intelligence sharing community around MISP is substantially European: CIRCL, ENISA, and national CERTs across the EU use it as their primary sharing platform.

There is no comparable European alternative. This is the correct tool and the correct choice.

[OpenCTI](https://github.com/OpenCTI-Platform/opencti/releases) is a French threat intelligence platform (Apache 2.0) 
developed by Filigran (Paris). It uses a graph model rather than MISP's event model and provides richer relationship 
mapping between indicators, actors, and campaigns. OpenCTI can ingest MISP feeds directly. For organisations that need 
deeper threat actor tracking and relationship visualisation, OpenCTI complements or replaces MISP depending on 
workflow preference. The Filigran team is French; the project is unambiguously European.

## Bug bounty platforms

Current: [HackerOne](https://www.hackerone.com/) (US) and [Intigriti](https://www.intigriti.com/) (Belgian)

Intigriti is already the European choice and is listed as the primary platform preference in the programme documentation. It is headquartered in Antwerp and subject to EU law. The HackerOne component exists because its researcher community is larger; the trade-off is knowingly accepted.

[YesWeHack](https://www.yeswehack.com/) is French (Paris) and covers the European researcher community with strong GDPR alignment. It is operationally comparable to Intigriti. If a single European platform is required, either Intigriti or YesWeHack covers the requirement; both have active researcher communities in the EU.

Running a self-hosted programme via a coordinated disclosure policy page plus direct contact, without a platform intermediary, is also viable for mature programmes with established triage processes. It reduces platform fees and vendor dependency at the cost of losing the platform's researcher network and automated triage tooling.

## Red team tooling

Current: [Caldera](https://github.com/mitre/caldera/releases) (adversary emulation) and Mythic C2

Caldera is maintained by MITRE (US non-profit, US government-funded). It is open source under the Apache 2.0 licence. The concern is not the licence but the funding model: MITRE's priorities are set by US government contracts, and the project's direction reflects that. Caldera is well-suited for MITRE ATT&CK-aligned purple team exercises, which is precisely the use case here.

[VECTR](https://github.com/SecurityRiskAdvisors/VECTR/releases) is open source (BSD 3-Clause) and provides adversary simulation tracking and reporting. It is less opinionated than Caldera about execution and more focused on documenting what was tested and what was detected. VECTR is the planning and tracking layer; Caldera is the execution layer. They are complementary.

[Havoc](https://github.com/HavocFramework/Havoc/) is a command and control framework (GPL 3.0) developed by a German contributor (Paul Ungur, @C5pider). It is a younger project than Mythic and by the looks of it no longer actively developed. It was designed specifically to evade EDR detection. For red team engagements requiring realistic C2 tradecraft, Havoc is technically comparable to Mythic with the advantage of European authorship.

Mythic itself (developed by Cody Thomas, Apache 2.0) is US-originated but fully open source with no commercial component. The concern is that it is a powerful tool whose upstream direction is controlled by a single developer. If Mythic development stalled, Havoc would be the migration path.

For adversary emulation at the purple team level (known TTPs, detection coverage testing), [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team) from Red Canary (US, MIT licence) provides a library of simple test scripts for individual ATT&CK techniques. It is less automated than Caldera but requires no infrastructure and can run a technique test in minutes.

## Deception technology

Current: [OpenCanary](https://github.com/thinkst/opencanary/releases)

OpenCanary is maintained by Thinkst Applied Research, a South African company. It is open source under the Apache 2.0 licence. The concern is not the licence; the project is well-maintained and the commercial Thinkst Canary tokens (used for the fake AWS credentials and honeydoc component) are a separate paid service.

[TPOT](https://github.com/telekom-security/tpotce) is an open source honeypot platform from Deutsche Telekom (Germany), GPL 3.0. It is a full honeypot distribution that bundles multiple honeypot services (Cowrie for SSH, Dionaea for malware capture, Elasticpot) and ships with an ELK stack for local analysis. More comprehensive than OpenCanary but also more operationally complex; TPOT is better suited to a dedicated honeypot host than to lightweight deployment across internal network segments.

[Canarytokens.org](https://github.com/thinkst/canarytokens/) is also Thinkst, open source (Apache 2.0), and can be self-hosted. The self-hosted version provides canary tokens without the Thinkst-hosted infrastructure dependency. If the commercial token service were discontinued, self-hosted Canarytokens covers the fake credential and honeydoc use cases.

[Glutton](https://github.com/mushorg/glutton/releases) is a lightweight protocol-aware honeypot (Apache 2.0) from the Honeynet Project (German chapter). It handles TCP/UDP traffic generically and is useful for logging unexpected network connections to non-standard ports without requiring a full OpenCanary deployment.

## Runtime security

Current: [Falco](https://github.com/falcosecurity/falco/releases)

Falco is a CNCF graduated project under the Apache 2.0 licence, originally created by Sysdig (US). The project has broad community backing including Red Hat, IBM, and numerous European contributors. There is no licence concern. The eBPF probe is maintained separately as a CNCF project.

[Tetragon](https://github.com/cilium/tetragon/releases) is an eBPF-based runtime security tool from Cilium (Isovalent, acquired by Cisco in 2024), Apache 2.0. It provides similar kernel-level visibility to Falco with the advantage of in-kernel filtering and enforcement: Tetragon can block a syscall before it completes. For environments already using Cilium as CNI, Tetragon integrates naturally. The tradeoff is a less mature ruleset than Falco's extensive community rules library.

[Tracee](https://github.com/aquasecurity/tracee/releases) is from Aqua Security (Israeli company), Apache 2.0. It is an eBPF-based runtime security tool with a Rego policy engine for detection rules, making it complementary to the existing OPA investment. Less operationally mature than Falco.

[KubeArmor](https://github.com/kubearmor/KubeArmor/releases) is a CNCF incubating project (Apache 2.0) that enforces security policies at the container and node level using LSM (Linux Security Modules) and eBPF. It focuses on policy enforcement, which makes it complementary to Falco. Developed with significant contributions from AccuKnox (US) and Samsung (Korean).

Falco remains the strongest choice for detection-focused runtime monitoring. Tetragon is the preferred alternative if enforcement capability becomes a requirement.

## Chaos engineering

Current: [Litmus](https://github.com/litmuschaos/litmus/releases)

Litmus is a CNCF incubating project (Apache 2.0), originally created by MayaData (US, now acquired by DataStax). The project has a strong Indian open source community behind it. There is no licence concern; the concern is that the project's commercial backing has changed and the pace of development is less predictable than CNCF graduated projects.

[Steadybit](https://github.com/steadybit) is a German company (Hamburg). Their open source agent component is available under the Apache 2.0 licence, but the full platform requires the commercial SaaS offering. For a team with a preference for European vendors, Steadybit is the most relevant chaos engineering option on European grounds, even though it is not fully self-hostable in its commercial form.

[Chaos Mesh](https://github.com/chaos-mesh/chaos-mesh/releases) is a CNCF incubating project (Apache 2.0) from PingCAP (Taiwanese company, TiKV project). It provides a comparable feature set to Litmus with a different CRD model: experiments are ChaosObjects rather than ChaosEngines. The UI is more polished than Litmus ChaosCenter. Migration between Litmus and Chaos Mesh requires rewriting experiment definitions but not changing the target application configuration.

[Kraken](https://github.com/krkn-chaos/krkn/releases) is from Red Hat (IBM), GPL 2.0, designed specifically for OpenShift and Kubernetes chaos at the infrastructure level. More focused on node and cluster-level faults than application-level faults.

Chaos Mesh is the preferred alternative if Litmus development stalls. Steadybit is worth considering if the priority shifts to supported commercial tooling with a European contract.

## Behavioural analytics

Current: scikit-learn Isolation Forest with Kafka

[scikit-learn](https://github.com/scikit-learn/scikit-learn/releases) is a French open source project (BSD 3-Clause), maintained by INRIA (Institut national de recherche en informatique et en automatique) and a broad community. It is perhaps the most European high-profile machine learning library in use. There is no concern and no reason to replace it.

[River](https://github.com/online-ml/river/releases) is a French open source library for online machine learning (BSD 3-Clause), also INRIA-affiliated. Where scikit-learn trains on a full dataset and re-trains periodically, River learns incrementally from each incoming data point. For a UEBA pipeline that needs to adapt to new user behaviour patterns faster than weekly retraining, River's online learning approach would reduce the detection gap for new employees and role changes. It is worth considering as a complement to the batch Isolation Forest model.

[Kafka](https://github.com/apache/kafka) is an Apache Software Foundation project (Apache 2.0). There is no licence concern. The US origin of Confluent (the primary commercial Kafka company) is noted.

[Redpanda](https://github.com/redpanda-data/redpanda/releases) is Kafka-compatible (BSL licence for the commercial version, Apache 2.0 for the community edition) and eliminates the ZooKeeper dependency. The company is US-incorporated. For the single-node Kafka deployment used in the UEBA pipeline, the operational difference between Kafka and Redpanda is minimal.

[NATS](https://github.com/nats-io/nats-server/releases) is an Apache 2.0 message broker with a significantly simpler operational model than Kafka. For a pipeline that processes a few thousand events per hour, NATS would reduce operational complexity substantially. It does not have Kafka's consumer group semantics, which the UEBA pipeline relies on for parallel processing; this would require a small architectural change.

## Related

- [Alternative tools: startup phase](../startup/alternative-tools.md)
- [Alternative tools: scale-up phase](../scale-up/alternative-tools.md)
Last updated: 09 July 2026
