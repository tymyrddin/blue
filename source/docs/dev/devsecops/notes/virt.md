# Securing virtual networking

Each cloud provider has its own implementation of virtual networking. According to the [shared responsibility model](shared.md), responsibility for the network is split between the cloud provider and the customer. The physical network layer (that is, access between the physical network equipment and physical host servers and storage inside the cloud provider's data centers) is the cloud provider's responsibility.

Virtual networking (such as Amazon VPC, Azure VNet, or Google Cloud Platform (GCP) VPC) is a network layer that is the responsibility of the customers (this layer enables access between virtual servers, managed storage services, managed databases, and more). Traditional on-premises networking deals with the physical connections between devices in a system: for example, concepts such as virtual local area networks (VLANs) or subnetting, to split a network (with the devices connected to a network) and create network security barriers.

In the cloud, a network is software-based (software-defined networking (SDN)). In the cloud, you have micro-segmentation, which means you can configure allow and deny access control rules between two instances (even if they are located on the same subnet). You will also be able to audit and control access to a resource such as an API.

A virtual network is a network area inside a cloud environment where most of the common cloud resources reside (such as virtual servers, managed databases, and so on). These resources are split into multiple network segments called subnets. There can be one or more virtual networks in each customer's cloud environment, but at the end of the day, the basic idea is the same:

* Access to subnets is controlled by access controls (such as Layer 4 firewalls).
* Subnets can be private (no direct access from the internet) or public (access from the internet is allowed).
* If you need to allow access to the internet for private subnet resources, you need to configure a NAT gateway.
* Virtual networks can be connected with each other via peer connections.


