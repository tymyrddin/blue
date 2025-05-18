# Database security checklist

Access Control:

* Assign minimal permissions (SELECT only if read-only needed).
* Use dedicated accounts per service.

Input Handling: Whitelist validation + parameterised queries.

Configuration: Disable risky features (local file access, weak auth).

Monitoring: Log all admin actions and failed queries.

## More

* [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
