# Secure servercommunication: Isolation and controlled exposure

Unrestricted communication between servers increases the attack surface. A compromised instance can pivot laterally, 
escalating access to sensitive systems. Proper network segmentation limits blast radius and enforces least-privilege 
principles.

## Network isolation

Private Subnets:

* Deploy backend services (e.g., databases, APIs) in private subnets with no public IPs.
* Use NAT gateways for outbound traffic if needed.

VPC/VNet Peering: For cross-account/team communication, use private peering (AWS VPC, Azure VNet) instead of public routes.

Example (AWS):

```bash
aws ec2 create-vpc-peering-connection --vpc-id vpc-123 --peer-vpc-id vpc-456
```

## Service-specific exposure

Public-Facing Services Only:

* Expose only load balancers (ALB/NLB) or API gateways publicly.
* Backend servers (e.g., app logic, databases) should never be directly internet-accessible.

Security Groups & NACLs: Restrict ingress/egress to specific IPs and ports.

Example (AWS SG rule):

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-123 \
  --protocol tcp \
  --port 443 \
  --cidr 203.0.113.0/24
```

##  Zero Trust for internal traffic

Mutual TLS (mTLS): Require certificate-based auth between services (e.g., Istio, Linkerd).

Service Meshes: Enforce policies like "Service A can only talk to Service B on port 8080" (Cilium, Calico).

## Monitoring & enforcement

Flow Logs: Log all traffic (AWS VPC Flow Logs, Azure NSG Flow Logs) to detect anomalies.

Automated Policy Checks: Tools like AWS Config or Azure Policy can flag overly permissive rules.

## Implementation checklist

* Isolate internal services in private subnets.
* Expose minimally: Only public endpoints get internet access.
* Encrypt internal traffic (TLS, mTLS).
* Monitor traffic patterns for deviations.

Example Architecture:

    Public Internet → [Load Balancer] → [Private Subnet: App Servers] → [Private Subnet: Database]  

## When to break isolation (carefully)

* DevOps access: Use SSM Session Manager (AWS) or Bastion Hosts (with MFA) for admin access.
* Hybrid clouds: Site-to-site VPNs or Direct Connect for on-premises links.

## More

* [AWS Well-Architected: Networking](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/networking.html)
* [Azure Network Security Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/network-best-practices)
