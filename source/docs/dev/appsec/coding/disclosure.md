# Information disclosure

[Information disclosure](https://red.tymyrddin.dev/docs/in/app/techniques/disclosure.html) vulnerabilities range from version numbers in response headers (which help an attacker identify known CVEs) to stack traces that reveal internal file paths, database schemas, and query structures. None of these are individually catastrophic, but each piece reduces the reconnaissance effort required to chain to a more serious vulnerability.

## Error handling

Production error responses convey only what the caller needs to act on the error. Stack traces, exception messages, query strings, and internal path information are for logs:

```python
# Flask example
from flask import jsonify
import logging

logger = logging.getLogger(__name__)

@app.errorhandler(Exception)
def handle_error(e):
    logger.exception("unhandled exception")
    return jsonify({"error": "an unexpected error occurred"}), 500
```

The exception detail goes to the structured log, where it is available to operators. The caller receives a generic message. Logging the raw exception separately from the response is what allows both outcomes.

Django's `DEBUG = True` setting is specifically for development: it renders detailed exception pages with local variables, request data, and settings values. Deploying with `DEBUG = True` exposes all of that to anyone who can trigger an error.

## Server and framework version headers

Web servers and frameworks often add headers that identify the software and version:

```text
Server: Apache/2.4.51 (Ubuntu)
X-Powered-By: PHP/8.1.0
```

Suppressing these removes a trivial reconnaissance path. In nginx:

```nginx
server_tokens off;
```

In Apache:

```apache
ServerTokens Prod
ServerSignature Off
```

For application-level headers like `X-Powered-By`, the framework configuration or a middleware layer can remove them. In Express:

```javascript
app.disable("x-powered-by");
```

Version information in response headers is a low-severity finding on its own but contributes to vulnerability chaining when a known CVE exists for the disclosed version.

## Source code and configuration exposure

`.git` directories left in web roots expose version history, commit messages, and often credentials that have since been rotated. Automated tools reconstruct the source tree from the git object store. Web server configuration blocks access to these paths:

```nginx
location ~ /\. {
    deny all;
}
```

Backup files created by editors (`file.php~`, `config.bak`, `database.sql`) are a similar risk. Automated scanners check for these paths; the server configuration returns 404 for file extensions that the application does not serve.

## Debug endpoints and admin interfaces

Debug endpoints, profiling routes, and admin panels exposed without authentication are a consistent source of critical findings. `/admin`, `/debug`, `/metrics`, `/health` are all indexed by search engines and scanners. Each deserves explicit access control, network-level restriction to internal addresses, or removal from production deployments.

## Developer comments in source

HTML comments that reveal server-side logic, database structure, or testing notes are indexed by search engines and visible to anyone who views the page source. Production build pipelines strip comments from rendered HTML and minified JavaScript as a matter of course. For templates that are rendered server-side, a linting step that flags `<!-- TODO` or similar patterns catches these before deployment.
