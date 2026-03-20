Runbooks
=====================================

Operational procedures for the systems built after the sticky note incident and the Git history audit. Each runbook covers one component. Read them in order the first time; after that, go straight to the one you need.

.. toctree::
   :maxdepth: 1
   :caption: Identity and access:

   keycloak-deployment.md
   postgresql-backend.md
   golem-authentication.md
   vaultwarden-setup.md
   backup-procedures.md

.. toctree::
   :maxdepth: 1
   :caption: Secrets management:

   vault-ha-deployment.md
   vault-raft-configuration.md
   vault-database-secrets.md
   vault-approle-auth.md
   vault-dynamic-credentials.md
   git-secrets-implementation.md

.. toctree::
   :maxdepth: 1
   :caption: Observability and alerting:

   graylog-cluster-deployment.md
   graylog-opensearch-configuration.md
   graylog-input-setup.md
   graylog-stream-rules.md
   graylog-alert-configuration.md
   prometheus-deployment.md
   grafana-dashboards.md
   graylog-alert-tuning.md

.. toctree::
   :maxdepth: 1
   :caption: Network security monitoring:

   zeek-deployment.md
   suricata-configuration.md
   port-mirroring-setup.md
   zeek-custom-scripts.md
   zeek-graylog-integration.md
   zeek-rule-tuning.md
   zeek-pcap-analysis.md

.. toctree::
   :maxdepth: 1
   :caption: Infrastructure access control:

   teleport-deployment.md
   vault-ssh-secrets.md
   teleport-certificate-auth.md
   teleport-approval-workflows.md
   teleport-session-recording.md
   teleport-rbac.md
   teleport-migration.md

.. toctree::
   :maxdepth: 1
   :caption: Backup and disaster recovery:

   restic-deployment.md
   restic-encryption.md
   restic-scheduling.md
   restic-monitoring.md
   restic-restore.md
   restic-testing.md
   disaster-recovery.md