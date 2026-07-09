# JavaScript security

Most JavaScript security issues fall into a small number of patterns. The mechanisms differ, but the common thread is
that JavaScript will execute nearly anything it is given, and browser security models assume the page is trustworthy
once loaded.

## DOM manipulation sinks

`innerHTML` parses its argument as HTML. That means any string containing `<script>`, event handler attributes, or
`javascript:` URLs will execute if the string comes from user input:

```javascript
// unsafe: innerHTML parses and executes HTML
document.getElementById("output").innerHTML = userInput;

// safe: textContent treats the value as a text node
document.getElementById("output").textContent = userInput;
```

`outerHTML`, `insertAdjacentHTML()`, and `document.write()` are in the same category as `innerHTML`. When HTML
formatting is genuinely needed in user-supplied content, `DOMPurify` sanitises before insertion:

```javascript
import DOMPurify from "dompurify";

const clean = DOMPurify.sanitize(userInput);
document.getElementById("output").innerHTML = clean;
```

## Prototype pollution

[Prototype pollution](https://red.tymyrddin.dev/docs/in/app/techniques/pollution.html) has become a significant attack
category; the red page covers the attack patterns in detail. The core issue: JavaScript objects inherit from
`Object.prototype`. If user-supplied data reaches an assignment that sets `__proto__`, `constructor`, or `prototype` on
a plain object, those properties propagate to all objects created via `Object.prototype`:

```javascript
// attacker-controlled input
const userInput = JSON.parse('{"__proto__": {"admin": true}}');

// this assignment poisons Object.prototype
Object.assign({}, userInput);

// now every plain object in the application has .admin === true
const obj = {};
console.log(obj.admin); // true
```

The fix is to avoid `Object.assign` and spread with untrusted input when the result is used for property access. Use
`Object.create(null)` to create dictionaries with no prototype, or validate keys before processing:

```javascript
// safe: null prototype, no inherited properties
const dict = Object.create(null);

// or: validate that keys are expected
const ALLOWED_KEYS = new Set(["name", "email", "role"]);
for (const [key, value] of Object.entries(userInput)) {
    if (ALLOWED_KEYS.has(key)) {
        dict[key] = value;
    }
}
```

Libraries such as Lodash exposed this vulnerability in well-known CVEs. Any library that merges or extends objects with
user data is a potential surface.

## String evaluation

`eval()`, `new Function(string)`, and `setTimeout(string)` all evaluate their string argument as JavaScript. None of
these are appropriate when the string originates from user input or an untrusted external source:

```javascript
// unsafe: evaluates the string as JavaScript
eval(userInput);
setTimeout(userInput, 100);
const fn = new Function("return " + userInput);

// safe alternatives: use structured data or explicit parsing
const value = JSON.parse(userInput);           // for data
const fn = (x) => x * 2;                      // define functions statically
```

Template literal injection is a related pattern: if a tagged template function passes the template string through `eval`
or `Function`, user-controlled template content executes.

## Content Security Policy

A `Content-Security-Policy` header limits which scripts the browser will execute. A restrictive policy catches injected
scripts even when output encoding fails:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```

`script-src 'self'` blocks inline scripts and external scripts from other origins. `object-src 'none'` disables Flash
and plugin-based execution. Adding `'unsafe-inline'` to `script-src` removes most of the XSS protection.

CSP is a defence-in-depth measure. It reduces the blast radius of an XSS vulnerability; it does not replace output
encoding or input validation.

## Dependency integrity

Third-party scripts loaded from CDNs can change without notice. Subresource Integrity (SRI) pins the expected hash:

```html

<script
        src="https://cdn.example.com/library.min.js"
        integrity="sha384-abc123..."
        crossorigin="anonymous">
</script>
```

The browser verifies the hash before executing the script. If the CDN serves a modified version, the script is blocked.

For npm dependencies, `npm ci` in CI/CD installs exactly what the lockfile specifies and fails if the lockfile is
inconsistent with `package.json`. Running `npm install` in CI allows implicit version upgrades and is a supply chain
risk.
Last updated: 17 May 2026
