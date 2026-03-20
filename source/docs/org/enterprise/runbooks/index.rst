Runbooks
=====================================

Operational procedures for enterprise-scale systems at Golem Trust. Banking customers, advanced threats, and the
Patrician's Office all have opinions.

.. toctree::
   :maxdepth: 1
   :caption: Kubernetes and container platform:

   cluster-setup.md
   control-plane-ha.md
   calico-deployment.md
   gatekeeper-policies.md
   namespace-isolation.md
   migration-procedures.md
   kubernetes-troubleshooting.md

.. toctree::
   :maxdepth: 1
   :caption: Service mesh:

   istio-installation.md
   mtls-configuration.md
   authorisation-policies.md
   certificate-management.md
   mesh-observability.md
   mesh-performance-tuning.md

.. toctree::
   :maxdepth: 1
   :caption: Customer-controlled encryption:

   transit-engine-setup.md
   key-hierarchy-design.md
   client-side-encryption.md
   encryption-audit-logging.md
   key-rotation.md

.. toctree::
   :maxdepth: 1
   :caption: Policy as code:

   opa-deployment.md
   rego-policy-development.md
   gatekeeper-configuration.md
   policy-testing.md
   audit-reporting.md
   opa-integration-patterns.md

.. toctree::
   :maxdepth: 1
   :caption: Vulnerability management:

   defectdojo-deployment.md
   scanner-integration.md
   deduplication-configuration.md
   sla-setup.md
   workflow-automation.md
   vulnerability-reporting.md

.. toctree::
   :maxdepth: 1
   :caption: Bug bounty programme:

   bounty-environment-setup.md
   triage-procedures.md
   severity-assessment.md
   bounty-remediation.md
   researcher-communication.md
   payment-processes.md

.. toctree::
   :maxdepth: 1
   :caption: Threat intelligence:

   misp-deployment.md
   feed-configuration.md
   indicator-management.md
   security-tool-integration.md
   information-sharing.md

.. toctree::
   :maxdepth: 1
   :caption: Supply chain security:

   tekton-pipeline-setup.md
   slsa-implementation.md
   in-toto-attestation.md
   supply-chain-signing.md
   supply-chain-sbom.md
   dependency-verification.md
   internal-mirroring.md

.. toctree::
   :maxdepth: 1
   :caption: Behavioural analytics:

   ueba-pipeline.md
   baseline-calculation.md
   feature-engineering.md
   model-training.md
   alert-tuning.md
   soc-integration.md

.. toctree::
   :maxdepth: 1
   :caption: Red team operations:

   red-team-infrastructure.md
   engagement-planning.md
   purple-team-coordination.md
   attack-scenarios.md
   findings-documentation.md
   improvement-tracking.md

.. toctree::
   :maxdepth: 1
   :caption: Deception technology:

   canary-token-deployment.md
   honeypot-setup.md
   deception-alert-configuration.md
   forensic-collection.md
   deception-tool-integration.md

.. toctree::
   :maxdepth: 1
   :caption: Runtime security:

   falco-deployment.md
   ebpf-configuration.md
   falco-custom-rules.md
   falco-alert-routing.md
   falco-response-automation.md
   falco-troubleshooting.md

.. toctree::
   :maxdepth: 1
   :caption: Chaos engineering:

   litmus-deployment.md
   experiment-design.md
   hypothesis-development.md
   chaos-execution.md
   chaos-rollback.md
   result-analysis.md
