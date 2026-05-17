# Input handling for database operations

[Parameterised queries](parameterisation.md) prevent SQL injection at the query level. [Input validation at the application level](../coding/input.md) is a separate control that catches malformed data before it reaches the database, and reduces the opportunity for second-order injection (where data stored via a parameterised query is later concatenated into another query).

## Allowlist patterns

Allowlist validation permits known-good values and rejects everything else. For fields with constrained formats (usernames, identifiers, product codes), a pattern match against expected characters is more reliable than trying to enumerate what to block:

```python
import re

USERNAME_RE = re.compile(r'^[a-zA-Z0-9_-]{3,20}$')

def validate_username(value: str) -> str:
    if not USERNAME_RE.fullmatch(value):
        raise ValueError(f"invalid username: {value!r}")
    return value
```

Even with allowlist validation in place, the query itself uses parameterisation:

```python
cursor.execute(
    "SELECT * FROM users WHERE username = %s",
    (validate_username(user_input),)
)
```

The two controls are complementary: parameterisation prevents injection from whatever value reaches the query; allowlist validation rejects values that are structurally wrong before they get that far.

## NoSQL injection

Document databases are not immune to injection. MongoDB queries are JSON objects, and if user input is merged directly into a query document, an attacker can supply operators:

```python
# unsafe: user_input could be {"$gt": ""} to match all users
db.users.find({"username": user_input})

# safe: validate type and structure before using as a query value
if not isinstance(user_input, str):
    raise ValueError("username must be a string")
db.users.find({"username": user_input})
```

`$where` clause evaluation (which executes JavaScript) is a higher-risk surface and is disabled by default in MongoDB 4.4+. Applications using older versions, or those that explicitly enable it, benefit from treating all input to `$where` as untrusted.

## Special characters and encoding

Databases accept some characters that have meaning in specific contexts. Null bytes (`\x00`) can terminate strings at the OS level. Unicode normalisation forms can produce characters that look identical but have different byte representations. For text stored in a database and later rendered as HTML or used in a shell command, the rendering context determines what characters are dangerous.

Encoding concerns are best handled at the output layer (HTML encoding, shell quoting) rather than by stripping characters from stored values. Stripping `<` and `>` from a stored value mangles legitimate content; encoding them at render time produces the same safety without altering the stored data.
