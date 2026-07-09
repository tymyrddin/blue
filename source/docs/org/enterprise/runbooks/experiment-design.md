# Experiment design

Dr. Crucible's approach to designing chaos experiments is the same as his approach to designing any experiment: start with what you want to learn, choose the simplest intervention that will teach you that thing, and make sure you can stop it. He is particularly insistent on the third point. Ponder, who was initially sceptical of the entire chaos engineering programme, became its most enthusiastic practitioner after the first node-drain experiment revealed that the cluster's pod disruption budgets were configured incorrectly, causing a brief service outage in staging rather than the expected graceful degradation. The experiment worked: it taught them something important. But it was the ability to stop it cleanly that made the lesson educational rather than catastrophic.

## Experiment types

Golem Trust uses eight Litmus experiment types.

`pod-delete`: randomly deletes one or more pods from a targeted Deployment. Tests whether Kubernetes restarts the pod correctly and whether the application handles the brief unavailability. This is the most commonly used experiment type.

`node-drain`: cordons a worker node and evicts all pods. Simulates a node going offline for maintenance or unexpectedly. Tests whether workloads reschedule correctly and whether PodDisruptionBudgets maintain minimum availability.

`network-loss`: drops a configurable percentage of network packets to or from a pod. Tests whether the application handles partial network connectivity gracefully, whether circuit breakers trigger, and whether timeouts are set appropriately.

`network-latency`: injects a configurable millisecond delay on network traffic. Tests whether applications degrade gracefully under latency (returning slow responses).

`cpu-hog`: consumes a configurable percentage of CPU on a target node. Tests whether resource limits prevent the CPU-starved pod from affecting neighbours, and whether the application continues to function (possibly slowly) under CPU pressure.

`memory-hog`: consumes a configurable amount of memory on a target node. Tests whether OOMKill and resource limits behave as configured, and whether memory pressure on one pod does not cascade to others.

`container-kill`: kills a specific container within a pod without deleting the pod itself. Tests whether the pod's restart policy correctly restarts the killed container and whether the application handles an unexpected container restart (as opposed to a full pod restart).

`node-restart`: reboots a worker node. The most disruptive single-node experiment; tests whether workloads survive a complete node failure with data integrity intact.

## ChaosEngine YAML structure

A ChaosEngine resource defines the target application, the experiment to run, and the experiment parameters:

```
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: payments-service-pod-delete
  namespace: payments
spec:
  appinfo:
    appns: payments
    applabel: "app=payments-service"
    appkind: deployment
  annotationCheck: "true"
  engineState: "active"
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: CHAOS_INTERVAL
              value: "10"
            - name: FORCE
              value: "false"
            - name: PODS_AFFECTED_PERC
              value: "33"
```

The `PODS_AFFECTED_PERC` parameter limits the blast radius: only one third of the pods in the deployment are deleted at a time. Combined with the PodDisruptionBudget that requires at least two of three replicas to be available, this ensures that the experiment cannot simultaneously delete more pods than the service can tolerate.

## Chained experiments

Multiple experiments can be sequenced in a single ChaosEngine to simulate compound failures:

```
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: payments-compound-test
  namespace: payments
spec:
  appinfo:
    appns: payments
    applabel: "app=payments-service"
    appkind: deployment
  engineState: "active"
  experiments:
    - name: network-latency
      spec:
        components:
          env:
            - name: NETWORK_LATENCY
              value: "500"
            - name: TOTAL_CHAOS_DURATION
              value: "120"
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "30"
            - name: CHAOS_INTERVAL
              value: "30"
```

This compound experiment first injects 500ms network latency for two minutes, then deletes a pod. It tests whether the application can handle losing a pod when it is already under latency stress.

## Experiment schedule

```
Staging experiments:
  Daily (02:00 UTC, Mon-Fri):
    - pod-delete on all stateless deployments in *-staging namespaces
  Weekly (Sunday 03:00 UTC):
    - node-drain (one node from the staging node pool)
    - network-latency (500ms, 5 minutes, payments-service-staging)
    - cpu-hog (50%, 5 minutes, random staging node)

Production experiments:
  Weekly (Sunday 01:00 UTC, low-traffic window):
    - pod-delete on payments-service (PODS_AFFECTED_PERC=33, 60-second duration)
  Monthly (first Sunday, 01:00 UTC):
    - node-restart (one node from production node pool, chosen by Dr. Crucible)
  Quarterly:
    - Region failure simulation (separate coordinated procedure)
```

## Service-specific experiment design

For each critical Golem Trust service, the failure modes are identified and the appropriate experiment types selected.

Payments service: must survive pod deletion (tested weekly), database connection loss (tested monthly via network-loss to the database pod), and node failure (tested quarterly as part of region simulation).

Royal Bank integration service: must handle its upstream becoming slow (network-latency to the external Royal Bank API endpoint) and must not retry indefinitely (circuit breaker test). API response latency is tested monthly in staging only; production testing of the Royal Bank integration requires 24-hour notice to the Royal Bank liaison.

Harbor registry: must survive a pod deletion without disrupting running pipelines. Harbor's high-availability configuration is tested quarterly with a pod-delete on the Harbor core and registry components simultaneously.

Keycloak: tested with pod-delete monthly. Must not log users out during a pod deletion (session storage must survive). The session storage test (pod-delete while a user is actively authenticated) is run in staging; production tests are limited to off-peak hours.
Last updated: 10 July 2026
