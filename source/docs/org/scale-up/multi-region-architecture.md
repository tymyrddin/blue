# Multi-region architecture

Runbook for the multi-region infrastructure design that enables disaster recovery at Golem Trust. The primary region is Hetzner Helsinki (hel1) in Finland. The DR region is Hetzner Nuremberg (nbg1) in Germany. Both regions run identical infrastructure. In normal operation, all traffic serves from Helsinki. When Helsinki is unavailable, Nuremberg takes over within minutes.

## Region overview

Helsinki (hel1) is the active region. All production writes go here. It runs:

- Three Vault nodes (HA Raft cluster)
- PostgreSQL primary instance (db-01.hel1.golemtrust.am)
- Keycloak application cluster (two instances behind a load balancer)
- GitLab CE
- Harbor registry
- Kubernetes cluster (three nodes)
- Headscale control plane
- Graylog and OpenSearch
- Prometheus, Alertmanager, Grafana

Nuremberg (nbg1) is the passive DR region. It mirrors Helsinki's infrastructure at reduced capacity during normal operation. It runs:

- Three Vault nodes (HA Raft cluster, separate but unsealed independently)
- PostgreSQL replica (db-01.nbg1.golemtrust.am, streaming from Helsinki primary)
- Keycloak application cluster (two instances, read-only during normal operation)
- Harbor registry (pull-through cache of Helsinki; full registry promoted during failover)
- Kubernetes cluster (three nodes, workloads paused during normal operation)
- Prometheus (scraping Nuremberg hosts; federated from Helsinki Prometheus)

GitLab, Graylog, and OpenSearch are Helsinki-only services. During a failover, GitLab CI pipelines are unavailable; this is an accepted operational constraint. Log data is not replicated to Nuremberg; historical logs from Helsinki are available once Helsinki recovers.

## Network connectivity between regions

Both regions connect via Headscale. Each region has its own Headscale-registered subnet, and the ACL policy permits cross-region traffic for specific services: database replication, Vault raft gossip, and Prometheus federation.

Hetzner private networks do not span regions, so cross-region connectivity uses the Headscale overlay. The database replication stream between Helsinki and Nuremberg traverses the WireGuard tunnel provided by Headscale, which encrypts the replication traffic in transit.

Latency between hel1 and nbg1 is typically 25-35ms. This is acceptable for asynchronous replication with a 1-second lag threshold.

## Infrastructure as code

Both regions are provisioned from the same Ansible playbooks with region-specific inventory groups. The `inventory/hosts.yml` distinguishes region by group:

```
all:
  children:
    hel1:
      children:
        hel1_infrastructure:
          hosts:
            vault-01.hel1.golemtrust.am:
            vault-02.hel1.golemtrust.am:
            vault-03.hel1.golemtrust.am:
            db-01.hel1.golemtrust.am:
            keycloak-01.hel1.golemtrust.am:
            keycloak-02.hel1.golemtrust.am:
    nbg1:
      children:
        nbg1_infrastructure:
          hosts:
            vault-01.nbg1.golemtrust.am:
            vault-02.nbg1.golemtrust.am:
            vault-03.nbg1.golemtrust.am:
            db-01.nbg1.golemtrust.am:
            keycloak-01.nbg1.golemtrust.am:
            keycloak-02.nbg1.golemtrust.am:
```

Region-specific variables (IP ranges, hostnames, replication role) are set in `inventory/group_vars/hel1/` and `inventory/group_vars/nbg1/`. All other variables are shared in `inventory/group_vars/all/`.

## Capacity sizing

Helsinki hosts use full-size instances. Nuremberg hosts use one tier smaller during normal operation to reduce cost; they are resized upward as part of the failover procedure when sustained traffic is expected.

```
Helsinki                 Nuremberg (standby)    Nuremberg (active)
db-01:  CX52 (16/32)    db-01: CX42 (8/16)     CX52 (resize on failover)
kc-0x:  CX32 (8/16)     kc-0x: CX22 (4/8)      CX32 (resize on failover)
k8s:    CX42 x3          k8s:   CX32 x3          CX42 x3 (resize on failover)
```

Resizing a Hetzner instance requires a brief shutdown (typically 2-3 minutes). The failover automation triggers the resize after DNS has been cut over so the resize window does not contribute to customer-facing downtime.

## Monitoring cross-region health

Prometheus in Helsinki scrapes both regions. A separate Prometheus instance in Nuremberg scrapes Nuremberg hosts independently, so monitoring survives a Helsinki outage.

The failover health check (see the failover automation runbook) runs from a third location: a small Hetzner CX11 instance in Frankfurt (fra1) that is not involved in serving production traffic. The Frankfurt instance is the authoritative judge of whether Helsinki is available. Using a geographically separate vantage point prevents split-brain scenarios where Helsinki's own monitoring cannot see that it is down.
Last updated: 28 March 2026
