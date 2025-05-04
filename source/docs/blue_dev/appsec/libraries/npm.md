# Securing npm dependencies: Best practices for Safe JavaScript development

The npm registry hosts millions of packages, making it both incredibly useful and potentially dangerous. Malicious packages, accidental secret leaks, and vulnerable dependencies can compromise your entire application. Here's how to use npm safely.

## Key practices for secure npm usage

1. Prevent secret leaks

Double-check ignore files:

* Keep `.npmignore` in sync with .gitignore
* Better yet, use the files property in `package.json` as a whitelist (The files property takes precedence over `.npmignore`):

```json
{
  "files": ["dist/", "lib/", "index.js"]
}
```

Always do a dry run before publishing:

```bash
npm publish --dry-run
```

2. Lock down dependencies

Enforce deterministic installs to ensure everyone gets the exact same dependency tree:

```bash
npm ci         # For npm (uses package-lock.json)
yarn install --frozen-lockfile  # For Yarn
```

3. Reduce Attack Surface

Be cautious with updates:

* Wait a few days before adopting new major versions
* Always review changelogs and GitHub issues first

Disable potentially dangerous scripts:

```bash
npm install --ignore-scripts
```

Or add to .npmrc: `ignore-scripts=true`

4. Maintain project health

Check for outdated packages:

```bash
npm outdated
```

Verify your npm environment:

```bash
npm doctor
```

This checks:

* Registry connectivity
* Git availability
* Version compatibility
* Filesystem permissions

5. Audit Dependencies Regularly

Use built-in tools:

```bash
npm audit
```

For deeper scanning:

```bash
  npx snyk test
```

Snyk provides:

* More comprehensive vulnerability detection
* Continuous monitoring
* Better remediation guidance

## npm Security Checklist

* Prevent leaks: Use files whitelist + dry runs
* Lock dependencies: Use npm ci or --frozen-lockfile
* Update carefully: Review changelogs before upgrading
* Disable scripts: --ignore-scripts in installs
* Check health: Regular npm outdated and npm doctor runs
* Audit dependencies: Combine npm audit with Snyk

## When things go wrong

* Found a malicious package? Report to npm security: security@npmjs.com
* Vulnerable dependency? Check Snyk's remediation advice

## More

* [npm Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html)
* [Snyk vs npm audit Comparison](https://nearform.com/insights/comparing-npm-audit-with-snyk/)