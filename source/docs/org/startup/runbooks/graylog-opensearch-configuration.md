# OpenSearch configuration

Runbook for installing and configuring the OpenSearch cluster that backs Graylog's log storage. OpenSearch runs on the same three nodes as Graylog and MongoDB. Install it before Graylog; Graylog will not start without a reachable OpenSearch cluster.

## Installation

On all three nodes:

```
curl -o- https://artifacts.opensearch.org/publickeys/opensearch.pgp | \
  gpg --dearmor --batch --yes -o /usr/share/keyrings/opensearch-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/opensearch-keyring.gpg] \
  https://artifacts.opensearch.org/releases/bundle/opensearch/2.x/apt stable main" \
  | tee /etc/apt/sources.list.d/opensearch-2.x.list
apt update
```

Install OpenSearch with the performance analyser disabled (it is not needed and consumes resources):

```
OPENSEARCH_INITIAL_ADMIN_PASSWORD=$(openssl rand -base64 24) \
  apt install -y opensearch
```

The initial admin password is required for installation but will not be used directly; Graylog connects to OpenSearch without authentication (access is restricted by firewall to the private network only). Note it temporarily and discard it.

## Configuration

Edit `/etc/opensearch/opensearch.yml` on each node. The settings below are for `graylog-1`; adjust `node.name` and `network.host` per node:

```
cluster.name: golemtrust-logs
node.name: graylog-1
node.roles: [cluster_manager, data, ingest]

network.host: 10.0.2.1
http.port: 9200
transport.port: 9300

discovery.seed_hosts:
  - 10.0.2.1:9300
  - 10.0.2.2:9300
  - 10.0.2.3:9300

cluster.initial_cluster_manager_nodes:
  - graylog-1
  - graylog-2
  - graylog-3

plugins.security.disabled: true

path.data: /var/lib/opensearch
path.logs: /var/log/opensearch
```

The `plugins.security.disabled: true` setting disables OpenSearch's built-in security plugin. This is acceptable because OpenSearch is only reachable on the private network; there is no path from the public internet to port 9200 or 9300. Enabling the security plugin requires certificate management for inter-node communication and complicates the Graylog integration without meaningful security benefit in this topology.

Configure the JVM heap in `/etc/opensearch/jvm.options`. Set heap to half of available RAM, maximum 32GB. On a CX31 with 8GB RAM:

```
-Xms4g
-Xmx4g
```

Do not set the heap larger than available RAM minus 2GB for the OS. OpenSearch will be killed by the OOM killer if the heap is too large and log ingestion spikes.

## Starting the cluster

Start OpenSearch on all three nodes simultaneously or in quick succession:

```
systemctl enable opensearch
systemctl start opensearch
```

The cluster will not elect a manager until a quorum of `cluster.initial_cluster_manager_nodes` is available. If one node is slow to start, the others will wait. Allow up to two minutes for the cluster to form.

## Verification

Check cluster health from any node:

```
curl -s http://10.0.2.1:9200/_cluster/health | python3 -m json.tool
```

The response should show `status: green` and `number_of_nodes: 3`. A status of `yellow` means the cluster is functional but some replica shards are unassigned, which can happen briefly after a fresh start. If it remains yellow after five minutes, check `_cluster/allocation/explain` for the reason.

Check that all nodes are visible:

```
curl -s http://10.0.2.1:9200/_cat/nodes?v
```

All three nodes should appear with their roles (cluster_manager, data, ingest).

## Index settings for Graylog

Graylog manages its own index lifecycle, but OpenSearch needs appropriate index settings to handle log volume efficiently. These are configured in Graylog's index set settings (System, Indices).

Recommended index set settings for the default Graylog index:

- Index shards: 3 (one per node)
- Index replicas: 1 (each shard has one replica on a different node)
- Maximum index size: 10GB or 20 million messages, whichever is reached first
- Maximum number of indices: 20 (200GB total retention before the oldest index is deleted)

These values assume the current log volume of approximately 50,000 messages per day across all monitored systems. Revise upward if the Seamstresses' Guild expands their use or additional customers are onboarded.

## Performance tuning

For the current log volume, the default settings are adequate. If indexing latency increases or search times degrade, check the following in order:

Heap pressure: `curl -s http://10.0.2.1:9200/_nodes/stats/jvm | python3 -m json.tool | grep heap`. If heap usage consistently exceeds 75%, increase the heap size or move OpenSearch to dedicated nodes.

Shard count: too many small shards degrades performance. If the index count grows beyond 20 active indices, reduce the maximum number or increase the rotation size.

Disk throughput: OpenSearch is I/O intensive during indexing. On Hetzner CX31 instances, the local NVMe storage is adequate for current volumes. If disk wait times are high (`iostat -x 1`), consider moving the OpenSearch data directory to a Hetzner volume with higher I/O limits.

## Cluster recovery

If the cluster cannot elect a manager (all three nodes show as red or the cluster health endpoint is unreachable), check that at least two nodes are running and reachable on port 9300. The cluster requires a quorum of two of three nodes.

If only one node is running and the cluster will not recover, do not attempt to force an election by setting `cluster.initial_cluster_manager_nodes` to a single node. This risks split-brain on recovery. Restore the second node from backup or bring it back online first.
