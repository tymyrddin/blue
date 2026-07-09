# Migration procedures

The migration from virtual machines to Kubernetes took Ludmilla's team four months. The first application took three weeks; the seventeenth took two days. This runbook captures the procedure that was refined through those seventeen migrations, including the mistakes that turned a three-week job into a two-day one. Angua led the cutover coordination for the later migrations, and her blue-green DNS switch procedure is documented here. Every migration follows the same structure: containerise the application, validate it in a staging namespace, rehearse the cutover, then execute with a tested rollback procedure standing by.

## Containerisation checklist

Before writing a single Dockerfile, work through this checklist for the application:

```
[ ] Application reads configuration from environment variables (not hardcoded files)
[ ] Application writes logs to stdout/stderr, not to local files
[ ] Application does not store session state on local disk
[ ] Application has a health endpoint (/healthz or /readyz) returning HTTP 200
[ ] Application handles SIGTERM gracefully (drains in-flight requests before exit)
[ ] All secrets identified and moved to Kubernetes Secrets or Vault
[ ] Persistent data identified: is it on a database? If so, is the DB outside Kubernetes?
[ ] Required CPU and memory profiled under load (needed for resource limits)
[ ] Base image selected from registry.golemtrust.am/base (not Docker Hub)
```

An application that fails any of the first five points will behave incorrectly under Kubernetes even if it appears to run. Ponder learned this the hard way when the billing service lost in-flight transactions during a rolling update because it stored state in a local file.

## StatefulSet versus Deployment decision guide

Use a `Deployment` when the application is stateless or stores state externally (database, object storage). Use a `StatefulSet` when:

- The application requires stable, persistent storage per pod (each pod has its own PVC)
- The application requires a stable network identity (pod names like `app-0`, `app-1` are predictable)
- The application is a database, message queue, or distributed cache that requires ordered startup

The rule of thumb: if replacing one pod with an identical pod from a different node would cause data loss or require manual intervention, it is a StatefulSet. Everything else is a Deployment.

## Migrating ConfigMaps and Secrets from legacy configuration files

Legacy applications typically read configuration from files in `/etc/appname/`. Convert these to ConfigMaps and Secrets:

```
# Create a ConfigMap from an existing config directory
kubectl create configmap royal-bank-api-config \
  -n royal-bank \
  --from-file=/etc/royal-bank-api/

# Create a Secret from individual values
kubectl create secret generic royal-bank-api-secrets \
  -n royal-bank \
  --from-literal=db_password=<VALUE> \
  --from-literal=api_key=<VALUE>
```

Mount them into the pod at the path the application expects:

```
volumeMounts:
  - name: config
    mountPath: /etc/royal-bank-api
    readOnly: true
volumes:
  - name: config
    configMap:
      name: royal-bank-api-config
```

Do not put actual secret values in ConfigMaps, and do not commit them to the infrastructure repository. Use `kubectl create secret` from the command line or from a CI/CD pipeline that reads from Vault.

## Blue-green cutover with DNS switch

Angua's procedure. Run the application in both environments simultaneously during the cutover window, with live traffic going to the VM until the Kubernetes deployment is validated:

1. Deploy the application to Kubernetes with zero external traffic (no Ingress or load balancer yet).
2. Run the smoke test suite against the Kubernetes pods via `kubectl port-forward`.
3. Create the Ingress or LoadBalancer service, but do not update DNS yet.
4. Lower the DNS TTL for the service record to 60 seconds at least 24 hours before the cutover window.
5. At the cutover window start: update the DNS record to point to the Kubernetes load balancer IP.
6. Monitor error rates and latency for 15 minutes using the Grafana dashboard.
7. If metrics are within normal bounds, proceed to post-cutover validation. If not, roll back immediately.

## Rollback procedure

If the DNS switch reveals a problem that cannot be fixed in under 15 minutes:

```
# Point DNS back to the VM load balancer IP
# (This is done in the DNS provider's console, not via kubectl)

# Scale down the Kubernetes deployment to avoid split traffic
kubectl scale deployment <APP_NAME> -n <NAMESPACE> --replicas=0
```

Document the failure in the incident log before doing anything else. Angua's standing rule: no second cutover attempt without a written root cause analysis from the first.

## Post-migration validation checklist

```
[ ] All pods in Running state with no restarts in the first 10 minutes
[ ] Health check endpoints returning 200
[ ] Error rate in Grafana within 0.1% of pre-migration baseline
[ ] p99 latency within 20% of pre-migration baseline
[ ] No new errors in Graylog that were not present before migration
[ ] PersistentVolumeClaims bound (if applicable)
[ ] Istio sidecar injected (check pod annotation inject.istio.io/status)
[ ] ResourceQuota not exceeded
[ ] Smoke tests passing against production endpoint
[ ] VM decommissioning ticket raised (do not decommission until 72 hours of stable operation)
```

The 72-hour hold on VM decommissioning has saved two rollbacks. Sam Vimes Jr. is credited with insisting on it after the first close call.
Last updated: 20 March 2026
