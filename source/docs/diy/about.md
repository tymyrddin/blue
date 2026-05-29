# About

Most incidents affecting startups and small engineering teams happen because of known, preventable things: credentials
in configuration files, password authentication left enabled on SSH, software unpatched for months, services reachable
from the internet that have no business being there.

This section covers the self-hosted infrastructure layer: servers, web applications, mail, and containers. The controls
described here address the exposures that account for most of what will actually happen to a small organisation running
its own infrastructure without a dedicated security function.

## Coverage

These pages are organised around surfaces. Each surface has a stack page describing how the controls fit together and a
failures page describing what breaks when they are absent. Those are the most useful starting points for any surface
currently in operation.

Beyond the stack and failures pages: a priority-ordered hardening sequence for new servers; how to read logs and what
patterns indicate a problem; credential management for small teams; and what to do in the first hour after a suspected
compromise.

## Adjacent surfaces

Application-layer vulnerabilities (SQL injection, insecure dependencies, business logic flaws) require controls inside
the application itself. Cloud provider configuration, SaaS tools, and developer endpoints are outside scope.

These are real attack surfaces. They are a different problem from server and service configuration.

## Limits

These controls raise the cost for an attacker and lower the cost of detection and recovery. Some attackers targeting
small organisations are opportunistic, running automated scans for easy targets. Closing the easy wins removes an
organisation from most of those target lists.
