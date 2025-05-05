# Output validation

Context-Specific Encoding

* HTML: Escape `<` as `&lt;`
* URLs: Encode spaces as `%20`
* SQL: Use parameterized queries

Example (Python - Jinja2 Auto-Escape):

```html
<!-- Safe by default in Jinja2 -->  
<p>{{ user_content }}</p>  
```
