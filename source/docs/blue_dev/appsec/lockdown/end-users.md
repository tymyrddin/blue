# Graceful degradation for security-conscious users

## The Security vs. Accessibility paradox

Many security-conscious users disable JavaScript (JS) or use restrictive browser settings (e.g., NoScript, 
Tor Browser's Safest mode) to mitigate risks like Cross-Site Scripting (XSS),  Malvertising/WebTrackers, and 
Browser Zero-Day Exploits.

However, modern web apps often require JS for core functionality, creating a dilemma:

* Blocking JS-less users entirely forces them to choose between security and access.
* Requiring JS unconditionally exposes users to drive-by attacks from other tabs/sites.

## Why forcing JS can be dangerous

1. Journalists, activists, and IT admins often browse with JS disabled to avoids session hijacking (e.g., via malicious JS in ads) and fingerprinting (e.g., WebGL, Canvas API abuse). Forcing JS may push them to whitelist your site, inadvertently enabling threats elsewhere.
2. Malware propagation risk: If your app is critical (e.g., banking, healthcare), users might relax security globally to access it. This increases their exposure to watering hole attacks or malicious redirects.

## Best practices for secure degradation

1. Progressive enhancement: Core functionality should work without JS (e.g., static forms, server-side rendering).
   * Example: A login form should:
     * Work with plain HTML/CSS (no JS).
     * Enhance with JS for features like password managers or 2FA.

2. Feature detection, Not browser sniffing
   * Avoid blocking based on User-Agent (easily spoofed).
   * Use `<noscript>` or JS checks to detect capabilities:
    
```html
<noscript>
  <div class="warning">
    For full functionality, enable JS. <a href="/lite">Basic version</a> available.
  </div>
</noscript>
```

3. Offer a "Lite" version
    * Provide a JS-free subset of features (e.g., read-only mode, basic forms).
    * Example:
      * Full version: Dynamic dashboard with WebSockets.
      * Lite version: Static HTML tables with server-polling.

4. Educate users on risks
    * Explain why certain features need JS: "This feature requires JavaScript for encryption. Learn why."
    * Link to guides on safe JS whitelisting (e.g., uMatrix rules).

5. Security headers as safeguards

Even if JS is required, mitigate risks with:

* Content Security Policy (CSP):

```
Content-Security-Policy: script-src 'self' 'unsafe-inline' https://trusted-cdn.com;
```

* Strict Referrer Policies:

```
Referrer-Policy: same-origin
```

## When to Require JavaScript (and How to Do It Safely)

For high-security apps (e.g., banking), JS may be unavoidable. In these cases:

1. Isolate the Session:
    * Use `rel="noopener"` on external links to prevent tab hijacking.
2. Sandbox Critical Features:
    * Serve sensitive actions (e.g., transfers) from a separate, locked-down subdomain.
3. Audit third-party scripts:

* Use Subresource Integrity (SRI) for CDN scripts:

```html
<script src="https://cdn.example/jquery.js" 
      integrity="sha384-...">```
```

## In short

- Don’t punish security-conscious users—design for graceful degradation.
- JS-free alternatives protect high-risk users and slow malware spread.
- If JS is mandatory, isolate it with CSP, SRI, and sandboxing.