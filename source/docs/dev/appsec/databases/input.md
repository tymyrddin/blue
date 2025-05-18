# Input Validation & Sanitisation

## Whitelist-based validation

Reject all input by default, only allow known-safe patterns.

Example (Python + SQL):
    
```python
# BAD: String concatenation (SQLi risk)  
query = f"SELECT * FROM users WHERE username = '{user_input}'"  

# GOOD: Whitelist validation + parameterisation  
if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', username):  
    raise ValueError("Invalid username")  
cursor.execute("SELECT * FROM users WHERE username = %s", (username,))  
```

## Common mistakes

* Allowing special chars (`'`, `"`, `;`, `--`) without escaping.
* Using `JSON.parse()/eval()` on untrusted data (NoSQL injection).
