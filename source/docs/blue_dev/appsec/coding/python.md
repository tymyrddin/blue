# Python security

Top defenses

* SQLi: Use SQLAlchemy/ORM (never string formatting).
* RCE: Avoid `pickle`, `os.system()`.

Risks

* `yaml.load()` → RCE
* Template injection (Jinja2)

Example (Safe YAML Parsing):

```python
import yaml  

# BAD: Unsafe  
data = yaml.load(user_input)  

# GOOD: Safe  
data = yaml.safe_load(user_input)  
```
