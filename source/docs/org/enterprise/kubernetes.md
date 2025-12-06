# The Kubernetes migration

Ludmilla has been advocating for months. "We're running applications on virtual machines like it's ancient times. We 
need proper orchestration. We need Kubernetes."

Ponder resists. "Kubernetes is complex. We don't need complexity."

"We have 147 microservices now," Ludmilla counters. "Seventeen different applications. Five different customers 
with different isolation requirements. Manual deployment takes three hours. We had an outage last week because 
someone deployed to the wrong server. We need complexity that reduces complexity."

Adora Belle sides with Ludmilla. "The Royal Bank wants multi-tenancy guarantees. The Patrician's Office wants 
complete isolation from other customers. Our current VM-based approach doesn't scale. Make it happen."

## What they built

Ludmilla architects a multi-cluster Kubernetes deployment. Three clusters, one per region: Finland (fsn1), 
Germany (nbg1), Helsinki (hel1).

Control plane: 3x cloud server instances per cluster (4 vCPU, 8GB RAM each) in HA configuration. Worker nodes: 10x 
cloud server instances per cluster (8 vCPU, 16GB RAM), auto-scaling between 5 and 20 nodes.

Hetzner CSI driver provides persistent storage. Volumes backed by Hetzner Cloud Volumes, automatically provisioned 
as needed.

[Calico CNI](https://github.com/projectcalico/calico/releases) handles networking with full network policy support. 
Every namespace isolated by default. Traffic between namespaces requires explicit NetworkPolicy allowing it.

OPA Gatekeeper enforces security policies at admission: all containers must run non-root, must have resource 
limits, must pull from approved registries only, must have security context defined.

Pod Security Standards at enforced level. No privileged containers without security exception.

Namespaces per customer: royal-bank, patricians-office, merchants-guild, each with ResourceQuotas and LimitRanges.

Migration takes four months. Applications refactored to cloud-native patterns. Deployment time drops from three 
hours to eight minutes. Zero-downtime deployments become standard.

## Runbooks

* Kubernetes cluster setup
* Control plane HA configuration
* Calico deployment
* OPA Gatekeeper policies 
* Namespace isolation
* Migration procedures
* Troubleshooting


