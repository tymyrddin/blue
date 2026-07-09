# Insecure direct object references

[IDOR](https://red.tymyrddin.dev/docs/in/app/techniques/idor.html) occurs when an application uses a caller-controlled identifier to look up a resource without checking whether the caller is authorised to access that resource. The classic form is a URL like `/invoices/1042` where changing `1042` to `1043` returns another user's invoice. The vulnerability is not the exposed ID; it is the missing authorisation check.

## Authorisation at every endpoint

Authentication confirms who the caller is. [Authorisation](access-control.md) determines what that caller can access. Applications that confuse the two protect endpoints with login walls but then return any resource once logged in.

Every endpoint that reads or modifies a resource checks ownership before returning data:

```python
from flask import abort, g

def get_invoice(invoice_id: int):
    invoice = Invoice.query.get_or_404(invoice_id)

    # ownership check
    if invoice.owner_id != g.current_user.id:
        abort(403)

    return invoice
```

The check happens after fetching the record. Checking before the fetch (attempting to construct a query that only returns the user's own records) is also valid and often more efficient:

```python
def get_invoice(invoice_id: int):
    invoice = Invoice.query.filter_by(
        id=invoice_id,
        owner_id=g.current_user.id,
    ).first_or_404()

    return invoice
```

The second pattern has the advantage of returning 404 rather than 403, which avoids confirming that the resource exists at all.

## Indirect references

Sequential integer IDs expose information about the total number of records and make enumeration trivial. UUIDs and other non-sequential identifiers raise the effort required but do not substitute for authorisation checks. A UUID is harder to guess; it is not impossible to discover through other means (email, shared links, logs). The authorisation check is still needed.

```python
import uuid

class Invoice(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"))
```

An indirect reference map (a per-session table that maps opaque tokens to internal IDs) is the strongest approach for high-sensitivity resources: the internal ID is never sent to the client, so there is nothing to enumerate or predict. The overhead is a session-scoped lookup on each request.

## Role-based access and admin endpoints

Admin and management endpoints are a common IDOR location. An endpoint that accepts `user_id` as a parameter and updates that user's settings is an IDOR if regular users can access it without a role check:

```python
from functools import wraps
from flask import g, abort

def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if g.current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return wrapper
    return decorator

@app.route("/admin/users/<int:user_id>/disable", methods=["POST"])
@require_role("admin", "moderator")
def disable_user(user_id: int):
    ...
```

## Testing

Testing for IDOR requires two accounts at each privilege level. Authenticated as one account, accessing resources belonging to the other tests whether the ownership check is enforced. Any successful access is a finding.

Automated scanning tools do not reliably detect IDOR because the vulnerability requires understanding the application's intended access model.
