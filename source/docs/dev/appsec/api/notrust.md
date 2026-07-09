# Validating API inputs

An API endpoint receives data from callers it cannot fully control. Even authenticated callers may send malformed, malicious, or unexpected inputs. Internal services calling each other are sometimes treated as implicitly trusted, but a compromised service in that chain sends whatever the attacker wants it to send.

The practical position is to validate inputs at every API boundary, regardless of who the caller appears to be.

## Type checking is not validation

Checking that a value is an integer confirms the type. It does not confirm the value is within an expected range, that it refers to a resource the caller is permitted to access, or that it makes sense in context. A user ID of `-1` or `99999999` passes an integer check. The [IDOR attack page](https://red.tymyrddin.dev/docs/in/app/techniques/idor.html) covers how this class of failure is exploited.

Validation combines type coercion with range, length, format, and authorisation checks:

```python
from pydantic import BaseModel, Field

class UpdateRequest(BaseModel):
    user_id: int = Field(gt=0)
    display_name: str = Field(min_length=1, max_length=100)

def handle_update(request):
    body = UpdateRequest.model_validate(request.get_json())
    # body.user_id is an int and > 0
    # body.display_name is a non-empty string of at most 100 characters
```

`model_validate()` raises `ValidationError` if any field fails. The calling code receives a typed, validated object.

## Validation failures

A validation failure is not an application error. It is a signal that the caller sent something the API does not accept. The appropriate response is a 4xx status code with enough detail for a legitimate caller to correct the request, but not so much detail that it helps an attacker map the API:

```python
from pydantic import ValidationError
from flask import jsonify

@app.route("/api/update", methods=["POST"])
def update():
    try:
        body = UpdateRequest.model_validate(request.get_json())
    except ValidationError as e:
        return jsonify({"errors": e.errors()}), 400
    # proceed with validated body
```

Returning a 500 for a validation failure conflates a caller error with an application fault and makes monitoring noisier.

Logging the validation failure (at an appropriate level, without echoing the raw payload) provides visibility into repeated malformed requests, which can indicate probing or a misconfigured client.

## Output encoding

Template engines that auto-escape by default (Jinja2, Django templates, most modern JavaScript frameworks) handle HTML encoding in rendered responses. The risk is bypassing that escaping:

```javascript
// unsafe: string interpolation into HTML without encoding
res.send(`<div>${userContent}</div>`);

// safe: template rendering with auto-escaping
res.render("template", { content: userContent });
```

For JSON responses, `res.json()` (Express) or `jsonify()` (Flask) handle serialisation. The risk in JSON APIs is not HTML injection in responses but in downstream handling: if the JSON value is later interpolated into HTML by a frontend without encoding, the API response becomes the injection vector.

The encoding responsibility follows the output context, not the transport. An API that returns data which a browser will render as HTML is part of the XSS surface.

## Mass assignment

[Mass assignment](mass-assignment.md) occurs when request body fields are bound directly to a model without
restricting which fields the caller is permitted to set. A caller who knows the name of an internal field (`role`,
`balance`, `is_admin`) can write to it if the binding is unrestricted. The fix is a separate input model that
declares exactly the fields a caller may provide, with `extra="forbid"` to reject anything else:

```python
from pydantic import BaseModel, ConfigDict, EmailStr

class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    email: EmailStr
```

The [mass assignment page](mass-assignment.md) covers Pydantic, Django REST Framework, and SQLAlchemy patterns in
more detail.

## Parameter pollution and type confusion

Attackers submitting the same query parameter twice (`?id=1&id=2`) or sending a string where an integer is expected
can slip past naïve validators. [Evasion techniques](https://red.tymyrddin.dev/docs/in/api/notes/evade.html) at the
API layer cover this systematically. Pydantic's strict mode and explicit field definitions handle most of these
cases, but allowlisting accepted content types adds a useful outer layer: an endpoint that expects JSON and receives
`application/x-www-form-urlencoded` can reject the request before parsing begins:

```python
from flask import abort, request

def require_json():
    if not request.is_json:
        abort(415)  # Unsupported Media Type
```
Last updated: 10 July 2026
