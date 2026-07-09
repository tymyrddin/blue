# GeoDNS configuration

Runbook for configuring GeoDNS routing via Cloudflare to direct traffic to the nearest healthy region. In normal operation, European traffic reaches Helsinki; if Helsinki is unavailable, DNS resolves to Nuremberg instead. Cloudflare handles both the geographic routing and the health-check-based failover DNS records.

## DNS provider

Golem Trust uses Cloudflare for DNS. The `golemtrust.am` zone is managed in Cloudflare. All records are proxied through Cloudflare (orange cloud), which provides DDoS mitigation and allows Cloudflare to act on health check results without waiting for DNS TTL expiry.

The Cloudflare account is shared between Carrot (account owner) and Ludmilla (administrator). API tokens are stored in Vault at `kv/golemtrust/cloudflare`. The failover monitor uses a scoped API token with only DNS edit permissions on the `golemtrust.am` zone.

## Load balancer configuration

Cloudflare Load Balancing is used for the primary traffic routing. Load Balancing allows Cloudflare to perform its own health checks and switch between origins without requiring the Frankfurt monitor to act.

Create two origin pools in Cloudflare Load Balancing:

Pool `hel1-primary`:

```
Origin: Helsinki load balancer IP (95.216.x.x)
Weight: 1
Enabled: true
```

Pool `nbg1-fallback`:

```
Origin: Nuremberg load balancer IP (116.203.x.x)
Weight: 1
Enabled: true
```

Configure health checks for each pool. Navigate to Load Balancing, then Health Checks, then Create:

```
Name: Helsinki health check
Type: HTTPS
URL: /health
Expected codes: 200
Interval: 30 seconds
Retries: 2
Healthy threshold: 1
Unhealthy threshold: 3
```

Apply the same health check configuration to the Nuremberg pool.

Create a load balancer for each production hostname. Navigate to Load Balancing, then Load Balancers, then Create:

```
Hostname: api.golemtrust.am
Steering policy: Off (failover order)
Fallback pool: nbg1-fallback

Traffic steering:
  1. hel1-primary (active)
  2. nbg1-fallback (fallback if hel1-primary is unhealthy)
```

Repeat for `auth.golemtrust.am` and `app.golemtrust.am`.

The "Off (failover order)" steering policy sends all traffic to the first healthy pool in the list. This is preferred over geographic steering for Golem Trust's current scale; geographic steering would require traffic from Germany to hit Nuremberg even when Helsinki is healthy, complicating the routing logic.

## DNS TTL settings

Records managed by Cloudflare Load Balancing ignore the TTL set on the DNS record itself; Cloudflare controls the TTL it advertises to resolvers. Set it to 60 seconds:

```
curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/load_balancers/${LB_ID}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"ttl": 60}'
```

A 60-second TTL means that when Cloudflare's health check marks Helsinki as unavailable, DNS updates propagate to resolvers within 60 seconds. Most modern resolvers respect low TTLs faithfully; some stub resolvers cache for longer, but 60 seconds covers the majority of clients.

## Records not behind the load balancer

Internal hostnames and service-specific records that are not customer-facing use simple A records without load balancing:

```
gitlab.golemtrust.am        A  <Helsinki GitLab IP>  TTL 300
registry.golemtrust.am      A  <Helsinki Harbor IP>  TTL 300
vault.hel1.golemtrust.am    A  <Helsinki Vault LB>   TTL 60
vault.nbg1.golemtrust.am    A  <Nuremberg Vault LB>  TTL 60
```

These records are updated manually during a failover if the services they point to are moved. The failover automation script handles `api`, `auth`, and `app`. All other records are updated by the on-call engineer following the recovery procedures runbook.

## Cloudflare Page Rules

Configure a Page Rule to redirect HTTP to HTTPS for all hostnames:

```
URL pattern: http://golemtrust.am/*
Setting: Always Use HTTPS
```

Configure cache rules to prevent Cloudflare from caching API responses:

```
URL pattern: api.golemtrust.am/*
Setting: Cache Level: Bypass
```

## Monitoring DNS resolution

Verify that DNS resolves to the correct IP from multiple vantage points after any change:

```
for resolver in 1.1.1.1 8.8.8.8 9.9.9.9; do
  echo -n "$resolver: "
  dig +short api.golemtrust.am @$resolver
done
```

During normal operation, all resolvers should return the Helsinki load balancer IP. After a failover, they should return the Nuremberg load balancer IP within 60-120 seconds.

Prometheus monitors DNS resolution via the `blackbox_exporter` dns probe:

```
- job_name: dns_resolution
  metrics_path: /probe
  params:
    module: [dns_golemtrust]
  static_configs:
    - targets:
      - api.golemtrust.am
      - auth.golemtrust.am
  relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - target_label: instance
      source_labels: [__param_target]
    - target_label: __address__
      replacement: blackbox-exporter:9115
```

An alert fires if DNS resolution fails or returns an unexpected IP for more than 5 minutes.
Last updated: 10 July 2026
