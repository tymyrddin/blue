# Input validation

Whitelisting approach

* Regex Validation – Allow only expected characters (e.g., ^[a-zA-Z0-9_-]+$).
* Type Casting – Convert strings to integers/dates early.

Risks

* SQLi, XSS, command injection

Example (JavaScript - Whitelist):

```javascript

// Allow only alphanumeric usernames  
if (!/^[a-z0-9]+$/i.test(username)) {  
    throw new Error("Invalid input");  
}
```