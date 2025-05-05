# JavaScript security

Best Practices

* Avoid eval()/innerHTML – Use textContent or DOMPurify.
* CSP Headers – Block inline scripts (script-src 'self').

Risks

* DOM XSS
* Prototype pollution

Example (Safe DOM Manipulation):

```javascript

// BAD: XSS risk  
document.getElementById("output").innerHTML = userInput;  

// GOOD: Auto-escaped  
document.getElementById("output").textContent = userInput;  
```