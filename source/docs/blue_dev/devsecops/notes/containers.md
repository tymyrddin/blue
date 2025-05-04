# Securing containers

[Containers](https://www.docker.com/resources/what-container) have the following benefits over [VMs](vms.md):

* Small footprint: Only required libraries and binaries are stored inside a container.
* Portability: An application can be developed inside a container on a laptop and run at a large scale in a production environment with hundreds or thousands of container instances.
* Fast deployment and updates compared to VMs.

Moving to production and running hundreds of container instances, an orchestrator (mechanism or managed service) is needed for managing container deployment, health check monitoring, container recycling, etc.

Docker was adopted by the industry as a de facto standard for wrapping containers, and cloud vendors support a new initiative for wrapping containers called the [Open Container Initiative (OCI)](https://opencontainers.org/). AWS offers [OCI artifact support in Amazon ECR](https://aws.amazon.com/blogs/containers/oci-artifact-support-in-amazon-ecr/), Azure [OCI images](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-image-formats#oci-images), and Google Cloud an [OCI image format](https://cloud.google.com/artifact-registry/docs/supported-formats#oci).

[Kubernetes](https://kubernetes.io/) is an open source project (developed initially by Google) and is now considered the industry de facto standard for orchestrating, deploying, scaling, and managing containers.
