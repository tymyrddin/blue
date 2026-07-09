# Secure server communication

Unrestricted communication between servers expands the attack surface. A compromised instance can move
laterally, reaching systems that would otherwise be inaccessible. Network segmentation limits that radius
and applies least-privilege principles to the network layer.

## Network isolation

Backend services (databases, internal APIs, message queues) belong in private subnets with no public IP
addresses. Inbound traffic from the internet reaches a load balancer or API gateway; backend services are
not exposed directly. Outbound traffic from private subnets passes through a NAT gateway when external
access is needed.

For communication across account or team boundaries, private peering (AWS VPC peering, Azure VNet peering)
keeps traffic off public routes:

```bash
aws ec2 create-vpc-peering-connection --vpc-id vpc-123 --peer-vpc-id vpc-456
```

Security groups and network ACLs restrict ingress and egress to the specific IPs and ports that each
service actually uses:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-123 \
  --protocol tcp \
  --port 443 \
  --cidr 203.0.113.0/24
```

## Internal traffic encryption

mTLS (mutual TLS) authenticates both sides of a service-to-service connection and encrypts it in transit.
Service meshes like Istio and Linkerd handle certificate issuance and rotation automatically, and can
enforce policies such as restricting service A to a specific port on service B. Cilium and Calico provide
network-layer policy enforcement for the same purpose.

## Traffic monitoring

VPC flow logs (AWS VPC Flow Logs, Azure NSG Flow Logs) record traffic at the network level. Aggregating
these into a monitoring system makes anomaly detection practical: a backend service that begins initiating
unexpected outbound connections is worth examining. Automated policy checks through AWS Config or Azure
Policy can flag security group rules that have drifted toward permissiveness.

## Administrative access

Direct server access for operations passes through controlled channels. AWS Systems Manager Session Manager
removes the need for an exposed SSH port; bastion hosts with MFA provide an auditable alternative where SSM
is not available. Hybrid environments connect on-premises networks to cloud resources through site-to-site
VPNs or direct connections.
Last updated: 10 July 2026
