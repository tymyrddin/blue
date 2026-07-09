# Parameterised queries

SQL injection is possible when user-supplied values are concatenated into a query string. The [SQL injection attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/sqli.html) cover how this is exploited when parameterisation is absent. The database cannot distinguish the intended SQL from the injected payload because both arrive as part of the same string. Parameterised queries (prepared statements) separate the query structure from the data values: the database receives the query template and the values separately, and treats the values as data regardless of their contents.

| Language                 | Safe parameterisation                                                                 |
|--------------------------|---------------------------------------------------------------------------------------|
| Python (SQLite/psycopg2) | `cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))`                     |
| Java (JDBC)              | `PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");` |
| Go (database/sql)        | `db.QueryRow("SELECT * FROM users WHERE id = $1", userID)`                            |
| PHP (PDO)                | `$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");`                        |

String concatenation into a query string carries SQL injection risk regardless of what validation precedes it:

```python
# unsafe: user_id injected into the query string
query = f"SELECT * FROM users WHERE id = {user_id}"

# safe: user_id passed as a parameter
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

Dynamic SQL constructed at runtime (`EXECUTE IMMEDIATE` in PL/SQL, `EXEC` in T-SQL) presents the same risk when the dynamic string includes user input. ORMs use parameterised queries internally for most operations, but raw query escape hatches (`.raw()`, `execute()`) bypass that protection if used with string interpolation.

## ORM examples

SQLAlchemy (Python):

```python
from sqlalchemy import text

# safe: bound parameter
result = session.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": user_email}
)

# safe: ORM query (parameterised internally)
user = session.query(User).filter(User.email == user_email).first()
```

Django ORM:

```python
# safe: ORM query
user = User.objects.get(email=user_email)

# safe: raw with parameters
User.objects.raw("SELECT * FROM users WHERE email = %s", [user_email])
```

The Django `extra()` and `RawSQL()` methods accept raw SQL strings and carry injection risk if user input reaches the SQL argument rather than the params argument.
Last updated: 17 May 2026
