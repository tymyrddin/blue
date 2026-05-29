# Public exposure review

## Cadence

Quarterly. After any significant infrastructure change. After a new service is deployed.

## The configuration drift problem

Services accumulate internet exposure by accident. A firewall rule opened for a debugging session and never closed. A cloud security group with a broad inbound rule inherited from a template. A staging environment deployed with production-level access. An object storage bucket made public to share a file and never locked back down. None of these are intentional. All of them persist until someone actively looks.

## From outside the network

Run this step from a host outside the organisation's own network: a personal device on mobile data, or a VPS. The point is to see what an attacker sees.

1. Port scan the organisation's primary IP addresses and domain names:
   ```
   nmap -sV -p 1-65535 target.ip.address
   ```
   Note any open ports that are unexpected. Common surprises: database ports (5432, 3306, 27017, 6379), admin panels (8080, 8443, 9200, 9090), internal APIs, monitoring tools (Grafana on 3000, Prometheus on 9090).

2. For each unexpected open port: identify the service and confirm whether it has any business being reachable from the internet. If not, close it.

3. Check for exposed configuration files on web servers:
   ```
   curl -I https://domain/.env
   curl -I https://domain/.git/config
   curl -I https://domain/wp-config.php
   curl -I https://domain/backup.zip
   ```
   A 200 response on any of these is a finding requiring immediate action, not just a note.

## In the cloud console

4. Review security groups and firewall rules. Export or view all rules with source `0.0.0.0/0` or `::/0`. For each one: confirm it is intentional and documented.
5. Check object storage (S3, GCS, Azure Blob) for buckets or containers with public read or write access. Most cloud providers have a dedicated report for this:
   - AWS: S3, check "Block Public Access" settings at account and bucket level
   - GCP: Cloud Storage, check for buckets with "allUsers" or "allAuthenticatedUsers"
   - Azure: Storage accounts, check public access level
6. Review load balancer and API gateway configurations for routes that expose internal services externally.

## On the web layer

7. Enumerate subdomains to check for forgotten services:
   ```
   subfinder -d example.com
   ```
   Or review DNS records in the registrar for subdomains pointing to old services or test environments.

8. For any subdomains found: check whether they still serve active, maintained content. A subdomain pointing to a long-abandoned staging environment or a third-party service no longer in use is worth closing or reclaiming.

## Recording the results

Document each finding: what it is, severity, whether it was closed immediately or scheduled for remediation. A finding marked as accepted (intentional, known, low risk) is still a finding, so document the rationale.

## All clear when

All externally reachable services are intentional and documented. No unexpected open ports. No public storage with sensitive data. No exposed configuration files.

## Follow-up

- Compare findings against the previous quarter's review to confirm prior issues were resolved.
- Update the list of intentionally exposed services.
- Schedule the next review.
