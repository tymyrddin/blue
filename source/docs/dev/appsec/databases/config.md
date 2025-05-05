# Secure database configuration

## Critical settings

| Database	   | Hardening Steps                                  |
|-------------|--------------------------------------------------|
| MySQL	      | `SET GLOBAL local_infile=OFF;` (disable file read) |
| PostgreSQL	 | `ALTER SYSTEM SET ssl = 'on';` (enforce TLS)       |
| MongoDB	    | `enableLocalhostAuthBypass: false`                 |

## Additional protections

* Encrypt data at rest (TDE, LUKS).
* Disable unused features (e.g., MySQL LOAD DATA LOCAL).
