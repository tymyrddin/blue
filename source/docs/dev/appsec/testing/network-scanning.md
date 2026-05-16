# Network vulnerability scanning

Network scanning identifies open ports, running services, and configuration weaknesses at the network level. It provides a view of what is reachable from a given network position, which is often different from what was intended.

## What network scanning finds

Open ports and services: services running on unexpected ports, or services that are accessible from network segments they are not intended to serve. A database port reachable from a DMZ, an administrative interface reachable from a public subnet, or development services left running on production hosts.

TLS and SSL misconfigurations: expired certificates, support for deprecated protocol versions (TLS 1.0, 1.1, SSL 3.0), weak cipher suites, missing HSTS headers. TLS scanning tools (testssl.sh, SSLyze) provide detailed output on certificate validity, protocol support, and cipher negotiation.

Network segmentation: confirming that the segmentation intended by network architects is enforced. A firewall rule that is supposed to block traffic between segments may not be effective if traffic can route through an intermediate host.

## Tools

Nmap: the standard for network scanning. Host discovery, port scanning, service version detection, and OS fingerprinting. The NSE (Nmap Scripting Engine) provides scripts for specific checks including TLS configuration, database authentication, and service-specific vulnerability detection:

```bash
nmap -sV --script ssl-enum-ciphers -p 443 target.example.com
```

Nessus: commercial; comprehensive vulnerability database; well-suited to periodic network-wide scans.

OpenVAS (Greenbone): open-source equivalent to Nessus; large vulnerability plugin library.

testssl.sh: focused specifically on TLS/SSL configuration testing:

```bash
testssl.sh https://target.example.com
```

## Authorisation

Network scanning can disrupt services if not managed carefully. Aggressive scanning against live services can trigger rate limiting, consume resources, or generate enough log noise to mask other events. Scans against systems the tester does not own or have explicit authorisation to scan are unauthorised access regardless of intent or tool.

In production environments, scanning is typically scheduled during maintenance windows or run from a management network rather than a customer-facing network position.
