# npm dependency security

The npm registry hosts millions of packages. The supply chain risk is not hypothetical: typosquatted packages, compromised maintainer accounts, and packages with deliberately malicious postinstall scripts have all caused real incidents. The mitigations are structural rather than vigilance-based.

## Lockfile integrity

`npm install` resolves versions according to semver ranges and installs whatever the current registry returns. `npm ci` installs exactly what the lockfile specifies and fails if the lockfile is inconsistent with `package.json`. In CI/CD environments, `npm ci` is the appropriate command:

```bash
npm ci
```

`yarn install --frozen-lockfile` is the equivalent for Yarn. The lockfile in version control is the source of truth for what the application depends on.

## Audit scanning

```bash
npm audit
```

`npm audit` checks installed packages against a database of known vulnerabilities and reports CVE IDs, severity, and the dependency path. `npx snyk test` provides an alternative with broader coverage and continuous monitoring if integrated into CI.

Running audit as part of the CI pipeline means vulnerable dependencies are caught before they reach production rather than after.

## Postinstall scripts

npm packages can declare scripts that run automatically on install (`postinstall`, `preinstall`). These scripts execute with the permissions of the user running npm, which is commonly a CI service account with broad access. A compromised package can exfiltrate environment variables, credentials, or source code via a postinstall script.

Installing without executing scripts reduces this risk:

```bash
npm install --ignore-scripts
```

The trade-off is that some packages genuinely require postinstall scripts (native modules that compile on installation). Selective use, or auditing which packages need scripts, is more targeted than blocking all of them.

## Secret leakage in published packages

Publishing a package with `npm publish` includes all files not excluded by `.npmignore` or the `files` field in `package.json`. The `files` field acts as an allowlist:

```json
{
  "files": ["dist/", "lib/", "index.js"]
}
```

A dry run before publishing shows exactly what will be included:

```bash
npm publish --dry-run
```

`.env` files, credentials, and private keys have been published to npm by accident. The npm registry supports package deprecation and unpublishing within a short window, but the appropriate response is to treat the secret as exposed and rotate it immediately.

## Typosquatting

Package names that differ by one or two characters from popular packages are a known attack vector. Verifying the package name before installation is straightforward; checking the GitHub repository, the maintainer list, and the publish history on the registry provides additional signal for unfamiliar packages.

## Keeping dependencies current

Outdated packages accumulate known vulnerabilities. `npm outdated` lists packages with newer versions available:

```bash
npm outdated
```

Waiting a short period before adopting new major versions of large packages gives the ecosystem time to identify and report any issues introduced in the release.
