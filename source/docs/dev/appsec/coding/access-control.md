# Broken access control

[Broken access control](https://red.tymyrddin.dev/docs/in/app/techniques/acl.html) is consistently the most frequently 
confirmed finding in web application testing. The two failure modes are horizontal (accessing another user's resources 
at the same privilege level) and vertical (accessing functions or data that require higher privilege). Object-level 
failures are covered separately in [IDOR](idor.md); this page covers structural access control: where it is applied, 
what it is applied to, and what bypasses it when applied at the wrong layer.

## Authorisation at the endpoint, not the UI

Hiding a link or a button based on a user's role is a UI convenience. Any user with a valid session who knows the endpoint path can call it directly. The control is applied at the endpoint:

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

@app.route("/admin/users/<int:user_id>/delete", methods=["POST"])
@require_role("admin")
def delete_user(user_id: int):
    ...
```

Frontend-only checks, client-side route guards, and UI element visibility are removed by any user with a proxy.

## Access control across HTTP methods

A route that enforces access control on `GET` but not on `POST`, `PUT`, or `DELETE` allows privilege escalation by changing the method. In Flask, route decorators apply to all listed methods; each method is protected by the same decorator:

```python
@app.route("/settings/email", methods=["GET", "POST"])
@require_role("user")
def settings_email():
    if request.method == "POST":
        # the same role check applies here, no need to re-check
        update_email(g.current_user, request.form["email"])
    return render_template("settings/email.html")
```

For REST APIs where different methods on the same path require different roles (GET is public, DELETE requires admin), each is a separate route handler:

```python
@app.route("/api/articles/<int:article_id>", methods=["GET"])
def get_article(article_id):
    ...

@app.route("/api/articles/<int:article_id>", methods=["DELETE"])
@require_role("admin", "editor")
def delete_article(article_id):
    ...
```

## X-HTTP-Method-Override

Some frameworks and proxies honour the `X-HTTP-Method-Override` header, which allows a POST request to impersonate a DELETE or PUT. Access control that inspects `request.method` after override resolution sees the overridden method; access control applied at the routing layer before override sees `POST`. Disabling `X-HTTP-Method-Override` support in frameworks that enable it by default removes the bypass surface.

In Flask, method override via this header is not enabled by default. In frameworks where it is (some Ruby/Rails configurations), it is worth confirming the middleware order places authentication and authorisation before the override handling.

## Multi-step workflows

Vertical access control failures commonly appear in multi-step workflows where role checks happen at step one (page load) but not at the form submission. Each state-changing step in a workflow carries its own check:

```python
@app.route("/admin/promote-user", methods=["GET"])
@require_role("admin")
def promote_user_form():
    return render_template("admin/promote.html")

@app.route("/admin/promote-user", methods=["POST"])
@require_role("admin")   # repeated: page load check is not sufficient
def promote_user():
    user_id = request.form.get("user_id")
    promote(user_id)
```

The role check on the GET handler does not protect the POST handler. Each handler is secured independently.
