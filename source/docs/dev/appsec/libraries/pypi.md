# PyPI dependency security

PyPI is the primary source of Python packages and a recurring target for supply chain attacks. Malicious packages, typosquatted names, and compromised maintainer accounts have all appeared on the registry. The mitigations are mostly structural.

## Typosquatting

Package names that differ by one character from popular packages are a known attack pattern. `requets` instead of `requests`, `djnago` instead of `django`. Verifying the spelling before installation, checking the package on PyPI for a plausible maintainer history and download count, and reviewing the GitHub repository link (if present) reduces the risk.

```bash
pip install requests   # correct
pip install requets    # may be malicious
```

## Vulnerability scanning

`pip-audit` checks installed packages against known CVE databases:

```bash
pip install pip-audit
pip-audit
```

`bandit` performs static analysis of Python source code, identifying patterns like hardcoded secrets, `eval()` use, `subprocess.run(shell=True)`, and `yaml.load()` without a safe loader:

```bash
pip install bandit
bandit -r src/
```

Running both in CI/CD catches issues before they reach production.

## Reproducible environments

`pip install` resolves to the latest compatible version unless pinned. `pip install -r requirements.txt` with pinned versions (`requests==2.31.0`) is deterministic. Poetry and Pipenv maintain lock files that pin both direct and transitive dependencies:

```bash
# Pipenv: install from lockfile only
pipenv sync

# Poetry: install from lockfile only
poetry install --no-root
```

In CI/CD, installing from the lockfile means the build uses the same dependency tree that was tested.

## TLS verification

Disabling TLS certificate verification removes the security guarantee that the remote end is who it claims to be:

```python
# unsafe: accepts any certificate, including from a man-in-the-middle
requests.get("https://example.com", verify=False)

# safe: default behaviour verifies the certificate chain
requests.get("https://example.com")
```

If the issue is a self-signed or internal CA certificate, passing the CA bundle path as `verify="/path/to/ca.pem"` is the appropriate fix.

The `certifi` package provides the CA bundle that `requests` uses by default. Keeping it updated (via normal dependency updates) ensures the CA store reflects current trust anchors.

## Deserialization

Imports execute package code. A malicious package can run arbitrary code at import time via module-level statements or `__init__.py` contents.

Beyond import-time risks, certain deserialization patterns in installed packages carry ongoing risk. `yaml.safe_load()` rather than `yaml.load()` for YAML from external sources; JSON for data crossing trust boundaries rather than pickle. See [python.md](../coding/python.md) for detail on these patterns.

## Licence compliance

Some licences (GPL, AGPL) impose conditions on redistribution and derived works. `pip-licenses` audits the licences of all installed packages:

```bash
pip install pip-licenses
pip-licenses --format=table
```

Licence compliance is a legal consideration that often surfaces in enterprise environments and open-source projects with explicit licence policies.
Last updated: 10 July 2026
