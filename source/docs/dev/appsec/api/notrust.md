# Zero Trust for user data

Never Trust, Always Verify:

Input validation:

```python
# BAD: No validation
user_id = request.json['id']  

# GOOD: Whitelist + type check
if not isinstance(request.json['id'], int):
    raise ValueError("Invalid ID")
```

Output encoding:

```javascript

    // BAD: XSS risk
    res.send(`<div>${userContent}</div>`);

    // GOOD: Auto-escaped
    res.render('template', { content: userContent });
```
