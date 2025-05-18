# Secure by Design: Choosing libraries and frameworks to minimise risk

Modern software relies on a deep tree of dependencies, where a single vulnerable submodule can compromise an entire application. The risk isn’t just the flaws in your code—it’s the recursive sum of all security bugs in every library, framework, and transitive dependency you pull in.

## Why it matters

* Supply Chain Attacks: Malicious packages (e.g., `event-stream` in `npm`) can hijack your build process.
* Unmaintained Dependencies: Abandoned projects with unpatched CVEs become ticking time bombs.
* Exploit Amplification: A single weak link (e.g., `log4j`) can expose your entire stack.

## Best practices for dependency safety

1. Choose Wisely

Adoption & Maintenance:

* Prefer libraries with active maintainers, regular updates, and a large user base (e.g., requests over an obscure HTTP client).
* Check last release date and issue resolution time.

Security Track Record:

* Audit historical CVEs (e.g., CVE Details).
* Avoid projects with patterns of breaking changes or rushed fixes.

2. Minimise attack surface

Fewer Dependencies = Fewer Risks:

* Use lightweight frameworks (e.g., Starlette or FastAPI over Django for microservices).
* Avoid "kitchen sink" libraries that pull in unnecessary sub-dependencies.

Vendor-Approved Packages: Prefer official SDKs (e.g., AWS SDK, @azure/ packages) over community forks.

3. Lock and verify

Pin versions: Use exact versions (==2.4.0) or hash-locking (npm package-lock.json, Python pip-tools).

Example (npm):

```json

"dependencies": {
  "lodash": "4.17.21"  // Not "^4.17.0"
}
```

Verify integrity: Use SRI (Subresource Integrity) for web libraries:

```html
<script src="https://cdn.example/react.js" 
        integrity="sha384-...">
```

4. Automate vigilance

Dependency scanning:

* Tools: Dependabot, Renovate, OWASP Dependency-Check.
* Block builds if critical CVEs are detected.

SBOMs (Software Bill of Materials): Generate and audit dependency trees (cyclonedx, syft).

5. Isolate and Contain

* Sandboxing: Run third-party code in restricted environments (Web Workers, gVisor).
* Zero Trust for Dependencies: Assume libraries will be compromised; limit filesystem/network access.

Language-Specific Guidance:

| Ecosystem	  | Secure Defaults	       | Tools                         |
|-------------|------------------------|-------------------------------|
| Python	     | pip-audit, safety	     | pip-tools, poetry             |
| JavaScript	 | npm audit, yarn audit	 | socket.dev, pnpm              |
| Go	         | govulncheck	           | go mod vendor + manual review |
| Rust	       | cargo audit	           | cargo-deny                    |

## When dependencies go bad

Have a Playbook: Example: If lodash reports a critical CVE:
* Immediate action: Patch or fork.
* Long-term: Evaluate alternatives (e.g., ramda).

Monitor for Anomalies:
* Unexpected network calls from libraries (e.g., node-fetch phoning home).

## In short

* Dependencies are liabilities. Treat them like uninvited guests in your codebase.
* Automate hygiene: Scan, lock, and update relentlessly.
* Design for failure: Assume your weakest dependency will be exploited.

## More

* [OWASP Dependency Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Dependency_Security_Cheat_Sheet.html)
* [PyPA Security Practices](https://packaging.python.org/en/latest/guides/security/)
