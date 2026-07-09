# JavaScript framework security

Modern JavaScript frameworks provide XSS protection by default through template escaping and virtual DOM abstractions.
The risk is not in the frameworks themselves but in the escape hatches: directives and APIs that bypass those
protections when the developer explicitly requests it.

## React

JSX expressions are escaped before rendering. `{userContent}` in a JSX template produces a text node.

The primary risk is `dangerouslySetInnerHTML`, which bypasses JSX escaping:

```jsx
// safe: JSX escapes user content
<div>{userContent}</div>

// unsafe: rendered as HTML, including any scripts or event handlers
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

When HTML rendering is genuinely required, `DOMPurify.sanitize()` on the value before passing it to
`dangerouslySetInnerHTML` reduces the XSS surface.

CSRF protection is not built into React; it is the responsibility of the HTTP client configuration or a library layer.

## Angular

Angular sanitises bound values by default. Template expressions in `{{ }}` and most attribute bindings are sanitised for
their context. The risk is `bypassSecurityTrust*` functions, which explicitly mark a value as trusted:

```typescript
// unsafe: bypasses Angular's sanitisation
this.trustedHtml = this.sanitizer.bypassSecurityTrustHtml(userInput);
```

These functions are appropriate for HTML the application generates itself. Using them on user-controlled content
reintroduces the XSS risk that Angular's sanitiser prevents.

Angular's `HttpClient` sets `X-Requested-With` headers but does not handle CSRF token injection by default; the
`HttpClientXsrfModule` provides that.

Ahead-of-Time (AOT) compilation eliminates template injection by compiling templates at build time.

## Vue

Template expressions (`{{ value }}`) are HTML-escaped. The `v-html` directive renders raw HTML:

```html
<!-- safe: auto-escaped -->
<div>{{ userContent }}</div>

<!-- unsafe: rendered as HTML -->
<div v-html="userContent"></div>
```

The risk pattern is identical to React's `dangerouslySetInnerHTML`. Vue's smaller core reduces the framework's own
attack surface but leaves more security decisions to the application layer.

## Svelte

Svelte compiles to vanilla JavaScript at build time. The runtime footprint is minimal, which reduces the supply chain
risk from the framework itself.

Template expressions are escaped by default. The `{@html}` tag renders raw HTML:

```html
<!-- safe -->
<p>{userContent}</p>

<!-- unsafe -->
<p>{@html userContent}</p>
```

The same DOMPurify approach applies when HTML rendering from user content is required.

## Framework comparison

| Framework | XSS default       | Escape hatch              | CSRF built-in        |
|-----------|-------------------|---------------------------|----------------------|
| React     | JSX escaping      | `dangerouslySetInnerHTML` | No                   |
| Angular   | Auto-sanitise     | `bypassSecurityTrust*`    | HttpClientXsrfModule |
| Vue       | Template escaping | `v-html`                  | No                   |
| Svelte    | Template escaping | `{@html}`                 | No                   |

## Cross-framework concerns

Server-side rendering introduces a hydration phase where server-rendered HTML is attached to client-side event handlers.
Inconsistencies between server and client rendering can create injection surfaces; frameworks like Next.js, Nuxt.js, and
SvelteKit each have specific SSR security guidance worth reviewing.

Client-side routing means authentication state lives in JavaScript. Token storage in `localStorage` is readable by any
script on the page; `HttpOnly` cookies are not. The choice between token and cookie session management has different XSS
implications in each framework.

Supply chain risk applies regardless of framework: all depend on npm packages. `npm audit` identifies known
vulnerabilities; `npm ci` in CI/CD installs exactly the lockfile contents.
Last updated: 10 July 2026
