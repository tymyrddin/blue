# Authorisation policy examples

Mutual TLS tells a service who is calling it; authorisation policies tell it whether that caller is allowed. Carrot explained it to a new engineer as the difference between showing your Guild card at the door (authentication) and the doorman checking whether your name is on the list (authorisation). Istio `AuthorizationPolicy` resources implement this second layer. Golem Trust runs a deny-all default in every customer namespace, with explicit allow rules for each legitimate service-to-service path. This runbook documents the standard patterns, including the banking-api policy that Mr. Bent uses as his example of acceptable zero-trust implementation.

## Deny-all default policy

Apply this to every customer namespace before any workloads are deployed. It denies all traffic by default; subsequent allow rules open only the paths that are needed:

```
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-all
  namespace: royal-bank
spec: {}
```

An empty `spec` with no `action` field defaults to `DENY` and matches all traffic. Verify it is in place:

```
kubectl get authorizationpolicy -n royal-bank
```

## Allow rule: service-to-service with mTLS principal matching

The `banking-api` service should only accept connections from the `web-frontend` service. Both services are in the `royal-bank` namespace. The SPIFFE principal is derived from the service account:

```
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: banking-api-allow-web-frontend
  namespace: royal-bank
spec:
  action: ALLOW
  selector:
    matchLabels:
      app: banking-api
  rules:
    - from:
        - source:
            principals:
              - "cluster.local/ns/royal-bank/sa/web-frontend"
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/v1/*"]
```

Any service not matching the `principals` list that attempts to reach `banking-api` will receive a 403 response. This includes other services within the same namespace.

## Allow rule: JWT claim matching

For requests originating from outside the cluster (via the ingress gateway), the identity is carried in a JWT rather than a SPIFFE certificate. Combine `RequestAuthentication` with `AuthorizationPolicy` to require both a valid JWT and a specific claim:

```
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: banking-api-jwt
  namespace: royal-bank
spec:
  selector:
    matchLabels:
      app: banking-api
  jwtRules:
    - issuer: "https://auth.golemtrust.am"
      jwksUri: "https://auth.golemtrust.am/.well-known/jwks.json"
      audiences:
        - "banking-api"
```

```
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: banking-api-allow-jwt-customer
  namespace: royal-bank
spec:
  action: ALLOW
  selector:
    matchLabels:
      app: banking-api
  rules:
    - from:
        - source:
            requestPrincipals: ["https://auth.golemtrust.am/*"]
      when:
        - key: request.auth.claims[role]
          values: ["customer", "auditor"]
        - key: request.auth.claims[tenant]
          values: ["royal-bank"]
```

A request with a valid JWT but a `tenant` claim of `merchants-guild` attempting to reach the `royal-bank` banking-api will be denied. This is the policy that Mr. Bent scrutinises most closely at quarterly audits.

## Combining mTLS and JWT

For internal services that forward JWT tokens on behalf of users (for example, `web-frontend` acting as a proxy), combine peer authentication (mTLS) and request authentication (JWT) in a single rule:

```
rules:
  - from:
      - source:
          principals:
            - "cluster.local/ns/royal-bank/sa/web-frontend"
      - source:
          requestPrincipals:
            - "https://auth.golemtrust.am/*"
    when:
      - key: request.auth.claims[role]
        values: ["customer"]
```

This requires that the request comes from the `web-frontend` service account over mTLS AND carries a valid JWT with the `customer` role claim.

## Testing policies with curl through the sidecar

To test whether an `AuthorizationPolicy` is working correctly before relying on integration tests:

```
# Get a shell inside a pod that has a sidecar
kubectl exec -it <SOURCE_POD> -n royal-bank -c <APP_CONTAINER> -- /bin/sh

# Attempt a request to the target service (will use the sidecar proxy)
curl -v http://banking-api.royal-bank.svc.cluster.local/api/v1/accounts

# To test with a JWT
curl -v -H "Authorization: Bearer <TOKEN>" \
  http://banking-api.royal-bank.svc.cluster.local/api/v1/accounts
```

A 403 response with body `RBAC: access denied` means the `AuthorizationPolicy` is blocking the request. A connection timeout suggests a `NetworkPolicy` issue rather than an Istio policy issue. The distinction matters for debugging: Istio policies operate at layer 7, while Calico NetworkPolicies operate at layer 4.

## Auditing policy coverage

Ludmilla's weekly check: every workload in a customer namespace must be the subject of at least one explicit ALLOW policy (in addition to the deny-all default). Workloads with no allow rules are inaccessible, which may indicate a missing policy rather than intentional isolation:

```
# List all AuthorizationPolicies in a namespace
kubectl get authorizationpolicy -n royal-bank -o yaml

# Check which workloads have no matching ALLOW policy (requires manual cross-reference with deployments)
kubectl get deployments -n royal-bank -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
```

Any deployment without a corresponding AuthorizationPolicy ALLOW rule should be flagged in the weekly security review meeting. Cheery tracks these in a spreadsheet that feeds into Mr. Bent's quarterly compliance report.
