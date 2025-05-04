# Defend Against XSS

Use Context-Sensitive Output Encoding

* Escape → Convert `<>` to `&lt;&gt;` in HTML.
* Filter → Remove `javascript:` from URLs.
* Validate → Reject inputs with unexpected patterns.

Example (JavaScript - Frontend):

```javascript

// BAD: InnerHTML enables XSS  
element.innerHTML = userInput;  

// GOOD: TextContent escapes by default  
element.textContent = userInput;  
```

Example (Python - Django Template):

```html
<!-- Auto-escaped in Django -->  
<p>{{ user_comment }}</p>  

<!-- Manual escaping if needed -->  
<p>{% escapejs user_comment %}</p>  
```
