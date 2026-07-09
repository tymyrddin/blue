# API authorisation

[API authorisation failures](https://red.tymyrddin.dev/docs/in/api/notes/authorisation.html) fall into two categories:
broken object-level authorisation (BOLA, the API form of [IDOR](../coding/idor.md)) and broken function-level authorisation (BFLA). Both appear consistently at
the top of API vulnerability rankings, and both stem from the same confusion: authentication confirms who is calling;
[authorisation](../coding/access-control.md) determines what that caller is permitted to do.

## Broken object-level authorisation

BOLA occurs when an endpoint fetches a resource by ID without checking whether the caller is entitled to that
resource. Incrementing or guessing an ID returns another user's data.

Route-level authentication middleware confirms that the caller is logged in. It does not confirm that this caller
owns the resource at `/orders/4721`. The ownership check happens at the query level:

```python
from sqlalchemy import select
from flask import g, abort

def get_order(order_id: int):
    order = db.session.execute(
        select(Order).filter_by(id=order_id, customer_id=g.current_user.id)
    ).scalar_one_or_none()

    if order is None:
        abort(404)  # 404: avoid confirming the resource exists

    return order
```

Returning 404 rather than 403 is a deliberate choice: a 403 confirms the resource exists and the caller simply lacks
access, which is information in itself. A 404 gives the enumerator no confirmation either way.

UUID primary keys raise the difficulty of enumeration but do not eliminate the need for the ownership check. A UUID
can be discovered through other means: shared links, logs, email, or a different endpoint that leaks it.

## Broken function-level authorisation

BFLA occurs when a caller performs an operation they are not permitted to perform, typically by using an HTTP method
that the authorisation check does not cover. Middleware that checks authentication on GET requests to
`/api/admin/users` does not automatically protect POST, PUT, or DELETE on the same path.

Every method that modifies state warrants an explicit permission check:

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

@app.route("/api/admin/users/<int:user_id>", methods=["GET", "POST", "DELETE"])
@require_role("admin")
def admin_user(user_id: int):
    ...
```

The decorator applies to all methods on the route. A common failure is applying role checks only to the specific
method tested during development, leaving other methods unguarded.

`X-HTTP-Method-Override` headers allow some clients to tunnel methods through POST. An endpoint that processes this
header without applying the same authorisation logic as the overridden method is a BFLA vector.

## Microservice trust

In a microservice architecture, requests from an internal upstream service may carry no credential, relying on
network-level trust (private subnet, service mesh). A compromised upstream service then has the same access as the
API itself.

Downstream services validating the identity of their callers (via [mTLS](../protocols/mtls.md), a signed service token, or a
gateway-issued caller claim) provide a layer that network position alone does not. This is particularly relevant for
high-privilege internal endpoints that are never intended to be reachable from outside the network but are reachable
from within it. Gateway-level authentication does not substitute for per-service authorisation.
Last updated: 10 July 2026
