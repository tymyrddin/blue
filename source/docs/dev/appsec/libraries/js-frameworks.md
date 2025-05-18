# JavaScript framework security comparison

1. React

Security strengths:

* JSX automatically escapes content, preventing XSS by default
* Large ecosystem with security-focused tools (ESLint plugins, React-specific CSP)
* Virtual DOM reduces direct DOM manipulation risks

Weaknesses & considerations:

* DangerouslySetInnerHTML can reintroduce XSS if misused
* Client-side state management requires anti-CSRF measures
* Server-side rendering (Next.js) needs careful XSS/CSRF hardening

Key security features:

* Strict Content Security Policy (CSP) support
* Context API for secure prop drilling

2. Angular

Security strengths:

* Built-in XSS protection (automatic sanitisation of bindings)
* TypeScript-first reduces injection risks
* Ahead-of-Time (AOT) compilation eliminates template injection risks

Weaknesses & considerations:

* Larger attack surface (complex framework, more built-in features)
* Dependency injection system requires careful configuration

Key security features:

* DOM sanitiser with customisable whitelists
* Built-in CSRF protection (HttpClient)

3. Vue

Security strengths:

* Templates auto-escape HTML (similar to React's JSX)
* Smaller core = reduced attack surface
* Excellent security documentation with explicit warnings

Weaknesses & considerations:

* v-html directive can introduce XSS (like React's dangerouslySetInnerHTML)
* Less opinionated than Angular → more security configuration left to developers

Key security features:

* Scoped styles prevent CSS injection
* Composition API encourages secure state management

4. Svelte

Security strengths:

* No virtual DOM → fewer runtime attack vectors
* Compiles to vanilla JS → minimal framework footprint
* Automatic CSS scoping

Weaknesses & considerations:

* Young ecosystem → fewer battle-tested security tools
* {@html} tag requires manual XSS prevention

Key security features:

* Built-in CSP compatibility
* Minimal runtime reduces supply chain risks

## Critical security comparison table

| Framework	 | XSS Protection             | CSRF Defaults        | SSR Risks                 | Supply Chain Risk       | Learning Curve |
|------------|----------------------------|----------------------|---------------------------|-------------------------|----------------|
| React	     | Good (JSX escape)	         | Manual setup	        | High (Next.js hydration)	 | High (large ecosystem)	 | Moderate       | 
| Angular	   | Excellent (auto-sanitise)	 | Built-in HttpClient	 | Medium	                   | Medium	                 | Steep          | 
| Vue	       | Good (template escape)	    | Manual setup	        | Medium (Nuxt.js)	         | Medium	                 | Gentle         | 
| Svelte	    | Manual ({@html} risk)	     | Manual setup	        | Low (SvelteKit)	          | Low (small core)	       | Easy           | 

## Framework-specific threats

React:

* Prop drilling → accidental secret leakage
* Client-side routing → auth state synchronisation

Angular:

* Template injection via unsanitised user input
* Dependency injection abuse

Vue:

* v-html misuse → DOM XSS
* Pinia/Vuex state sanitisation

Svelte:

* {@html} tag → requires manual sanitisation
* Store mutations → lack of type enforcement

## Universal JavaScript security risks

* NPM dependencies (all frameworks are vulnerable to supply chain attacks)
* Server-side rendering (hydration attacks in Next/Nuxt/SvelteKit)
* Authentication state management (JWT storage, CSRF tokens)

## Recommendations by Use Case

* Enterprise apps → Angular (built-in protections)
* Startups/rapid dev → Vue (good balance)
* Complex SPAs → React (with strict CSP)
* Performance-critical → Svelte (low attack surface)

All frameworks require:

* Regular npm audit + Snyk scans
* Security headers (CSP, X-Frame-Options)
* Input validation/sanitisation

## Tools for framework security

* React: eslint-plugin-react-security
* Angular: @angular/cli built-in audits
* Vue: vue-security ESLint plugin
* Svelte: svelte-check with security rules

## More

* [NodeJS Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
* [State of Open Source Security 2023](https://snyk.io/reports/open-source-security/)