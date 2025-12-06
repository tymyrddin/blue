# Service mesh and mutual TLS

Mr. Bent returns for a quarterly audit. He's reviewing network architecture diagrams when he stops, finger pointing 
at service-to-service communication.

"These microservices," he says, "they communicate over the network. How do they authenticate each other?"

Silence.

"They're in the same cluster," Ponder offers. "Private network."

"So if I compromise one service, I can impersonate any other service?"

More silence.

"This is unacceptable. Every service must authenticate. Cryptographically. The bank's requirement for zero-trust 
extends to service-to-service communication."

Carrot nods. "He's right. We've focused on perimeter security. Inside the cluster, we're too trusting."

## What they built

Ludmilla and Dr. Crucible deploy [Istio](https://github.com/istio/istio/releases/) as a service mesh across all 
Kubernetes clusters. Every pod gets an [Envoy sidecar proxy](https://github.com/envoyproxy/envoy/releases). All 
traffic between services goes through the proxies.

Mutual TLS everywhere. Automatic. Services authenticate to each other using X.509 certificates issued by Istio's CA. 
Certificate rotation every 24 hours. No manual certificate management.

Authorisation policy resources define fine-grained access control. Example: `banking-api` can only be called by 
`web-frontend` service with specific JWT claims. No other service can access it.

Traffic encryption in transit. Even inside the cluster. Even between pods on the same node. Zero trust means 
zero assumptions.

Observability improves dramatically. Istio provides distributed tracing, service-level metrics, access logs. 
Grafana dashboards show request rates, error rates, latency percentiles per service.

The performance overhead is measurable but acceptable: 2-3ms added latency per hop. The security gain is worth it.

Mr. Bent's next audit: "Acceptable. This is proper zero-trust implementation."

## Runbooks

* Istio installation
* mTLS configuration
* Authorisation policy examples
* Certificate management
* Observability setup
* Performance tuning

## Related

[Secure servercommunication: Isolation and controlled exposure](https://blue.tymyrddin.dev/docs/dev/appsec/lockdown/communications.html)

