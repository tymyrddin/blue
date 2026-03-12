# Securing virtual machines

Each cloud provider has its own implementation of VMs (or virtual servers). The basic idea remains the same:

1. Select a machine type (or size).
2. Select a preinstalled image of an operating system.
3. Configure storage.
4. Configure network settings.
5. Configure permissions to access cloud resources.
6. Deploy an application.
7. Use the service.
8. Carry out ongoing maintenance of the operating system.

With the [shared responsibility model](shared.md), when using IaaS, we (as the customers) are responsible for the 
deployment and maintenance of virtual servers.

## Related

- [AWS: Basis for a secure AWS deployment pipeline](../aws/pipeline.md)
- [AWS: AWS: The bill that never ends](../aws/estimated-costs.md)
- [Azure: Foundation for a secure Azure deployment pipeline](../azure/pipeline.md)
- [Azure: Azure: Nice dashboard, shame about the costs](../azure/estimated-costs.md)
- [GCP: Foundation for a secure GCP deployment pipeline](../gcp/pipeline.md)
- [GCP: GCP: Free-tier until it is not](../gcp/estimated-costs.md)
- [On-prem: Secure on-premises CI/CD pipeline (Hetzner, Finland)](../on-prem/pipeline.md)
- [On-prem: On-Prem @ Hetzner cloud costs "DIY, but actually sane"](../on-prem/estimated-costs.md)
