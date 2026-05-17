# Mutual TLS

Standard TLS authenticates the server to the client: the client verifies that the server's certificate is
signed by a trusted CA and that the certificate's domain matches the one being connected to. The client sends
no certificate of its own. Mutual TLS (mTLS) extends this: both parties present certificates, and both verify
each other.

For browser-to-server connections this is impractical, but for service-to-service communication (microservices
calling each other, [internal APIs](../api/authentication.md), clients that are not humans), mTLS is a natural fit. It replaces the
question "is this a valid session token?" with "does this client hold a certificate issued by our internal CA?"
In a zero-trust network where services cannot safely assume that anything on the internal network is trustworthy,
mTLS provides cryptographic identity rather than relying on network position.

## Nginx configuration

The server side requires three additions to a standard TLS configuration:

```nginx
ssl_client_certificate /etc/nginx/client-ca.crt;  # CA cert for verifying client certs
ssl_verify_client on;                              # require a valid client certificate
ssl_verify_depth 2;                                # how deep in the chain to verify
```

`ssl_client_certificate` points to the CA certificate (or bundle) whose signatures are trusted for client
certificates. This is typically not a public CA; it is an internal CA whose certificates are only trusted by
services that need to verify clients.

`ssl_verify_client on` causes nginx to reject connections from clients that do not present a valid certificate.
`ssl_verify_depth 2` allows for a root CA signing an intermediate CA signing the client certificate.

For endpoints where client certificates are optional (serving both browser and service clients), `ssl_verify_client optional` accepts connections without a client certificate but makes the certificate available to the
application when one is presented.

## Internal CA management

For mTLS to work, there needs to be a CA whose certificates clients carry. A public CA (Let's Encrypt, DigiCert)
is not appropriate here: public CAs issue certificates to anyone who can demonstrate domain control, not to
internal services. An internal CA, controlled by the organisation, issues certificates only to systems that are
supposed to hold them.

Lightweight internal CA options:

- [step-ca](https://smallstep.com/docs/step-ca/) (from Smallstep): full ACME support, short-lived certificates,
  an HTTP API for automated issuance.
- [HashiCorp Vault PKI secrets engine](https://www.vaultproject.io/docs/secrets/pki): CA management integrated
  with secrets management; certificates issued programmatically with short TTLs.
- OpenSSL directly: sufficient for small deployments, but no automation or API.

## Short-lived certificates and revocation

Revoking a client certificate before it expires requires either CRL distribution or an OCSP responder. Both are
operational overhead. Short-lived client certificates (24 hours to 7 days) shift the burden: a compromised
certificate expires quickly without requiring active revocation.

For longer-lived certificates, nginx supports CRL-based revocation:

```nginx
ssl_crl /etc/nginx/client-revoked.crl;
```

The CRL file needs periodic updating as certificates are revoked; if the CRL is not refreshed, revoked
certificates will eventually pass validation when the CRL expires. An OCSP responder avoids this by providing
real-time status.

## Service mesh

In Kubernetes deployments with many services, per-service mTLS configuration becomes impractical to manage
manually. Service meshes handle it automatically:

- Istio: Citadel (the Istio CA) issues short-lived certificates to each pod via the SPIFFE/SPIRE identity
  framework. Envoy sidecars handle the mTLS handshake transparently, without changes to the application.
- Linkerd: a lighter-weight alternative with automatic mTLS via its own certificate authority.

Both provide per-service identity, automatic certificate rotation, and mutual verification without application-
level changes. The tradeoff is the operational complexity of the mesh itself.

## Extracting client identity in the application

When nginx terminates mTLS and proxies to an application, the client certificate's identity (common name,
SANs, serial number) can be forwarded as request headers:

```nginx
proxy_set_header X-Client-Cert-Subject $ssl_client_s_dn;
proxy_set_header X-Client-Cert-Serial  $ssl_client_serial;
proxy_set_header X-Client-Verify       $ssl_client_verify;
```

The application reads these headers to determine which service is calling. This pattern only works securely
when the application is not directly accessible without going through nginx: a caller that can bypass nginx
can set these headers arbitrarily.
