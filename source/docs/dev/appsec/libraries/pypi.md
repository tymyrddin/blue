# Securing Python dependencies: PyPI best practices

Python’s Package Index (PyPI) is a treasure trove of open-source libraries—but it’s also a prime target for attackers. 
Malicious packages, typosquatting, and vulnerable dependencies can introduce severe risks. Here’s how to use PyPI safely.

## Key practices for secure Python development

1. Avoid Malicious Packages

Typosquatting is real: Attackers upload packages with names like requets (instead of requests) to trick developers.

Always double-check spellings before installing:

```bash
pip install requests  # Correct  
pip install requets   # Malicious?  
```

Research unfamiliar packages (check GitHub stars, maintainers, release history).

2. licence Compliance

Know what you’re using: Some licences (e.g., GPL) impose strict redistribution rules. Tools like pip-licences or fossa can audit licence risks.

3. Scan for vulnerabilities

Bandit: A static analysis tool to find security flaws in Python code:

```bash
pip install bandit  
bandit -r your_project/  
```

Ochrona: Scans dependencies for known CVEs:

```bash
pip install ochrona  
ochrona check -r requirements.txt  
```

4. Use Pipenv (or Poetry) for Dependency Management

Why? Combines pip and virtualenv with:

* A Pipfile (abstract dependencies).
* A `Pipfile.lock` (pinned, tested versions).

Installation:

```bash
pip install pipenv  
pipenv install requests  # Adds to Pipfile  
pipenv lock             # Generates Pipfile.lock  
```

5. Security pitfalls in Python

Only import trusted packages. Imports execute code:

```python
import malicious_module  # Runs code on import!  
```

Keep certifi updated: Never pin its version—always use the latest. Never disable cert verification:

```python
# NEVER DO THIS 
requests.get("https://example.com", verify=False)  
```

6. Safe data handling

Avoid unsafe deserialization:

* PyYAML: Use `yaml.safe_load()` instead of `yaml.load()`.
* Pickle: Never load pickled data from untrusted sources.

## Dependency security checklist

* Verify package names before installing.
* Audit licences for compliance risks.
* Scan code with Bandit; scan dependencies with Ochrona.
* Use Pipenv for reproducible environments.
* Never bypass SSL checks or pin certifi.
* Prefer safe_load for YAML/JSON parsing.

## When things go wrong

* Found a malicious package? Report it to PyPI’s security team.
* Vulnerable dependency? Update immediately or fork/fix.

## More

* [PyPI Security Advisory](https://pypi.org/security/)
* [Python Security Best Practices](https://docs.python-guide.org/security/)
