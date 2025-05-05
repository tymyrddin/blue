# Authentication

Best practices

* Multi-Factor Authentication (MFA) – Require for all privileged actions.
* Strong Password Policies – Enforce complexity + rate limiting (e.g., bcrypt with 12+ rounds).
* Session Management – Use short-lived JWT tokens with HttpOnly/Secure flags.

Risks

* Hardcoded credentials
* Weak password reset flows

Example (Python - Flask):

```python
from werkzeug.security import generate_password_hash, check_password_hash 

# Store hashed passwords  
hashed_pw = generate_password_hash(password, method='bcrypt', salt_rounds=12)  
check_password_hash(hashed_pw, input_password)  # Verify 
```