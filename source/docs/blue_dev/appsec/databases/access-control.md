# Strict Access Control

## Principle of Least Privilege (PoLP)

Grant only the minimum permissions required for each user/application.

Example:

```
-- Bad: Full admin access  
GRANT ALL ON *.* TO 'app_user'@'%';  

-- Good: Restrict to specific DB and operations  
GRANT SELECT, INSERT ON `app_db`.* TO 'app_user'@'10.0.1.%';  
```

## Key actions

Role-Based Access Control (RBAC): Define roles (read_only, read_write, admin) and assign permissions accordingly.

Avoid shared accounts: Each service should have its own DB credentials.

## Audit permissions regularly

```
-- MySQL  
SHOW GRANTS FOR 'app_user'@'%';  

-- PostgreSQL  
\du+  
```
