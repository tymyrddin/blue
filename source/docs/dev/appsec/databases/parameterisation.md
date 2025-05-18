# Parameterized Queries (SQL Injection defence)

Always use prepared statements because it prevents SQL injection by separating code from data.

| Language	        | Safe Parameterisation                                                                 |
|------------------|---------------------------------------------------------------------------------------|
| Python (SQLite)	 | `cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))`                      |
| Java (JDBC)	     | `PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");` |
| PHP (PDO)	       | `$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");`                        |

## Never use

* String concatenation (`"SELECT * FROM users WHERE id = " + user_id`).
* Dynamic SQL (`EXECUTE IMMEDIATE` in PL/SQL).

