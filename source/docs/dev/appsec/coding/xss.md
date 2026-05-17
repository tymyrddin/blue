# Cross-site scripting (XSS)

XSS occurs when user-controlled content is rendered as executable HTML or JavaScript in a
browser. The mechanism varies by context, but the consequence is consistent: an attacker
can execute JavaScript in the victim's browser session, which gives access to cookies,
session tokens, and anything the page can do.

Three distinct patterns, each with a different mitigation. The [adversary view of XSS](https://red.tymyrddin.dev/docs/in/app/techniques/xss.html) covers the exploitation side of the same patterns.

## Reflected XSS

The payload is in the request and reflected back in the response without being stored.
Prevented by output encoding in templates (see below).

## Stored XSS

The payload is stored (in a database, a comment field, a log view) and rendered to other
users later. Requires both input handling and [output encoding](output.md); output encoding is the more
reliable control since it acts at the point of rendering.

## DOM XSS

The payload never touches the server. JavaScript on the page reads from a source
(`location.hash`, `document.referrer`, `localStorage`) and writes to a sink
(`innerHTML`, `document.write`, `eval`). Template auto-escaping does not help here
because the vulnerability is in client-side code.

## Frontend

The primary DOM XSS vector is `innerHTML`. Setting it to anything that includes user
content is dangerous even when the content looks clean:

```javascript
// unsafe: innerHTML parses and executes HTML, including <script> and event handlers
document.getElementById("output").innerHTML = userInput;

// safe: textContent treats the value as a text node, not markup
document.getElementById("output").textContent = userInput;
```

When HTML formatting is genuinely required in user content (rich text editors, comment
fields with formatting), use [DOMPurify](https://github.com/cure53/DOMPurify) to sanitise
before insertion:

```javascript
import DOMPurify from "dompurify";

const clean = DOMPurify.sanitize(userInput);
document.getElementById("output").innerHTML = clean;
```

`javascript:` URLs are a second common vector. Attributes like `href` and `src` accept
`javascript:` values that execute on click or load:

```javascript
// unsafe: if href comes from user input, "javascript:alert(1)" works
anchor.href = userInput;

// safe: validate the scheme before assigning
const parsed = new URL(userInput, window.location.origin);
if (parsed.protocol === "https:" || parsed.protocol === "http:") {
    anchor.href = parsed.href;
}
```

## Backend templates

Django, Jinja2, Handlebars, and most modern template engines auto-escape HTML by default.
The risk is explicitly disabling that escaping.

Django:

```html
<!-- auto-escaped: < and > become &lt; and &gt; -->
<p>{{ user_comment }}</p>

<!-- explicitly unescaped: only use this for content you control -->
<p>{{ trusted_html|safe }}</p>

<!-- to escape a value for use in a JavaScript string context -->
<script>
    var value = "{{ user_value|escapejs }}";
</script>
```

The Django filter for JavaScript context is `|escapejs` (a filter on the value, not a
template tag). It escapes characters that would break out of a JavaScript string literal.

Jinja2:

```python
from jinja2 import Environment

# autoescape=True is the safe default for HTML templates
env = Environment(autoescape=True)

# render_template_string with user-controlled template text is dangerous
# even with autoescape=True: Jinja2 expressions execute before escaping
env.from_string(user_supplied_template)  # unsafe if user controls the template
```

## Content Security Policy

CSP is a defence-in-depth measure, not a primary control. A well-configured CSP header
reduces the impact of XSS that bypasses output encoding, but encoding is the primary
defence.

A minimal starting point:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```

`script-src 'self'` blocks inline scripts and scripts from other origins. `object-src 'none'`
prevents Flash and plugin-based execution. Adding `'unsafe-inline'` to `script-src`
largely negates the XSS protection.
