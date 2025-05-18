# Identity management

Identity and Access Management (IAM) refers to the concept of managing the entire user life cycle, including provisioning (that is, account creation), assigning permissions, and, finally, account deprovisioning (that is, when a person leaves the organisation, or the account is no longer needed).

Access management is made up of the following main concepts:

* Identity indicates a user, computer, service, or role that wishes to access a system or application and take actions (from accessing shared storage to querying a database and pulling information).
* Authentication is the process of proving that a specific identity (such as a user) is who they claim to be (for example, providing a username and password that match the user's records on a central user repository).
* Authorisation is the process of granting an authenticated identity (such as a user) the permissions to take actions on a resource (such as allowing a user to upload a file to shared storage).

## AD

Understanding AD is not easy, but basic knowledge is necessary when talking about IAM. An organisation should only have one central directory. Identities should only be kept in one place. That also comes with a risk: if a directory gets breached, an attacker will have access to all identities that exist within the organisation. It's crucial that the directory and the IAM system are very secure and that directory data is extremely well protected. This is an area where tools such as Saviynt and CyberArk come in; they add an extra security layer on top of IAM.

The term AD is very much associated with Microsoft, as it was developed by that company for Windows domain networks. It has become a widely accepted term for the concept itself. AD comprises basically two major components that are both relevant in cloud environments. The first component is the directory itself; the second component is the domain services.

Domain services comprise a domain controller that authorises and authenticates objects (users and computers) in a network. That network can be in a public cloud. It can also be a standalone network, but more often, the internal network of the organisation is extended to a cloud. Extended may not be the right word, though. The organisation's on-premises network and cloud network(s) are merely connected or, to put it a better way, the domains are connected.

To be able to do that, domain controllers are needed in the public cloud. The domain controller makes sure that a specific part of the public cloud is now within the domain.

Microsoft AD uses LDAP, Kerberos, and Domain Name Services for these services. LDAP enables the authentication and storing of data about objects and also applications. Kerberos is used to prove the identity of an object to another object that it communicates with. DNS enables the translation of IP addresses to domain names and vice versa.

## AAD

Azure uses Azure Active Directory (AAD). AAD is not the same as AD. AAD is an authentication service in Azure, using AD as the directory. The primary function of AAD is to synchronize identities to the cloud. For the synchronisation, it uses Azure AD Connect. With AAD, organisations will have a system that provides people of these organisations with a mechanism to log in and access resources on different platforms. That can be resources in Azure itself or resources such as applications hosted on systems in the corporate network.

AAD also provides access to SaaS solutions such as Microsoft 365 and applications that can integrate with Azure. AAD makes sure that users only have to log in once using SSO. It is secured by MFA, meaning that when a user logs in by typing in a password, it is not enough. A second validation is needed to prove their identity. This can be a PIN code through a text message or an authenticator app on a mobile device, but also a fingerprint. If the user is authenticated, access is granted to federated services.

The federation between the domains in the corporate network and the corporate domain in Azure
cloud is done with Active Directory Federation Services (ADFS). Strictly speaking, there’s no
hard requirement to use ADFS since AAD integrates with AD natively with hybrid entities, using
password hash-sync or passthrough authentication. For third-party MFA you will still need
ADFS though.

In the cloud, a corporate cloud domain is situated in the domain of the public cloud itself. In Azure, that is defined by onmicrosoft.com; this domain name address signifies that an environment resides in Azure.

In AWS, ADFS can be enabled as a component of the AWS Federated Authentication service. With ADFS, a user is authenticated against the central identity store, AD. After authentication, ADFS returns an assertion that permits login to AWS using AWS’s Security Token Service (STS). STS returns temporary credentials based on `AssumeRoleWithSAML`, which then allows access to the AWS Management Console of the enterprise environments in AWS.

`AssumeRoleWithSAML` is something specific to AWS. This function in STS provides a way to authenticate against the identity store with role-based AWS access. It uses Security Assertion Markup Language (SAML), an open standard for exchanging authentication and authorisation data between parties, such as the identity store at a corporate level and the cloud provider. It is comparable to LDAP, but SAML is more commonly used in the cloud.

Also, GCP embraces SAML to do AD federation. At GCP, it starts with Google Cloud Identity, the service that GCP uses for IAM. But Google also understands that enterprises typically already have an identity store with AD. We can set up federation between GCP’s Cloud Identity or G Suite and enable user provisioning from AD, including SSO. SSO is done through SAML.

A lot of companies still use ADFS, but it is no longer a hard requirement to use AD in AWS or GCP. It is possible to integrate AD directly into other clouds.
