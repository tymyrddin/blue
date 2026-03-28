Runbooks
=====================================

Operational procedures for the systems built to meet the Royal Bank of Ankh-Morpork's requirements.

.. toctree::
   :maxdepth: 1
   :caption: Zero-trust network:

   headscale-deployment.md
   derp-server-setup.md
   headscale-acl-configuration.md
   headscale-device-posture.md

.. toctree::
   :maxdepth: 1
   :caption: Database access control:

   strongdm-deployment.md
   strongdm-database-access.md
   approval-automation.md

.. toctree::
   :maxdepth: 1
   :caption: Identity federation:

   keycloak-saml-federation.md

.. toctree::
   :maxdepth: 1
   :caption: Container security:

   harbor-deployment.md
   trivy-integration.md
   cosign-signing.md
   admission-controller.md
   sbom-generation.md

.. toctree::
   :maxdepth: 1
   :caption: Pipeline security:

   gitlab-deployment.md
   runner-configuration.md
   sast-dast-setup.md
   security-scanning-integration.md
   renovate-bot-configuration.md
   pre-commit-hooks.md

.. toctree::
   :maxdepth: 1
   :caption: Configuration management:

   ansible-control-node.md
   playbook-development.md
   cis-hardening.md
   openscap-scanning.md
   patch-management.md

.. toctree::
   :maxdepth: 1
   :caption: Disaster recovery:

   database-replication.md
   failover-automation.md
   geodns-configuration.md
   dr-testing-procedures.md
   recovery-procedures.md

.. toctree::
   :maxdepth: 1
   :caption: Host security monitoring:

   wazuh-manager-deployment.md
   wazuh-agent-deployment.md
   wazuh-fim-configuration.md
   wazuh-active-response.md
   wazuh-vulnerability-scanning.md
   wazuh-graylog-integration.md
