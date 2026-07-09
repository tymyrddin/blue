# Infrastructure as code scanning

Infrastructure as code (IaC) tools (Terraform, CloudFormation, Kubernetes manifests, Helm charts) define cloud and container infrastructure in configuration files. Those files carry the same security risks as application code: a misconfiguration checked into source control is deployed consistently across every environment.

IaC scanning applies policy checks to configuration files before they are applied, catching misconfigurations at the source level. The [attack infrastructure](https://red.tymyrddin.dev/docs/scarlet/iac/) section covers the adversarial use of the same tooling: IaC applied deliberately to build ephemeral offensive infrastructure, with operational discipline that avoids precisely the patterns (hardcoded credentials, permissive IAM, traceable state backends) that IaC scanning looks for on the defensive side.

## Common findings

Common findings include: S3 buckets without access logging or public access blocks, security groups allowing inbound traffic from `0.0.0.0/0` on sensitive ports, IAM policies with `*` resources or actions, RDS instances with publicly accessible endpoints, unencrypted EBS volumes, Kubernetes pods running as root or with privileged containers.

## Tools

Checkov: open-source; supports Terraform, CloudFormation, Kubernetes, Helm, Dockerfile, and others; runs locally and in CI; large built-in policy library covering AWS, GCP, and Azure resources.

```bash
checkov -d /path/to/terraform
```

Terrascan: open-source; similar coverage to Checkov; policy written in Rego (the same language as OPA).

KICS (Keeping Infrastructure as Code Secure): open-source from Checkmarx; supports a broad range of IaC formats; produces findings with remediation guidance.

## Integration

IaC scanning integrates into CI at the point where Terraform plans or Kubernetes manifests are generated. Failing the pipeline on high-severity findings prevents misconfigured infrastructure from reaching production. As with SAST, the practical approach is to start with a focused set of high-confidence rules, to avoid training the team to ignore the scanner output.

Drift detection (comparing live infrastructure against the IaC definition) is a related concern: resources created outside the IaC process bypass the scanning gate. Tools like AWS Config, Terraform Cloud, and Pulumi provide drift detection capabilities.
