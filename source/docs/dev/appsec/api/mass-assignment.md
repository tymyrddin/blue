# Mass assignment

[Mass assignment](https://red.tymyrddin.dev/docs/in/api/notes/mass-assignment.html) occurs when request body fields
are bound directly to a data model without an explicit allowlist of which fields a caller is permitted to set. The
result is that a caller who knows (or guesses) an internal field name can write to it.

The fields most commonly exploited are privilege fields (`role`, `is_admin`, `is_verified`), financial fields
(`balance`, `credits`, `plan`), and status fields (`email_verified`, `account_locked`). None of these are fields a
regular caller would be documented as being able to set, but if the binding is unrestricted, the documentation and
the behaviour disagree.

## Separate input models from data models

The most reliable defence is a Pydantic model that declares exactly which fields the caller is permitted to provide.
Any field not in the model is either rejected or silently ignored, depending on configuration:

```python
from pydantic import BaseModel, ConfigDict, EmailStr

class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")  # reject unknown fields rather than ignoring

    name: str
    email: EmailStr
```

`extra="forbid"` causes Pydantic to raise a `ValidationError` if the request body includes any field not declared in
the model. The alternative, `extra="ignore"` (the default), silently drops unknown fields — safer than an unrestricted
ORM bind, but the rejection behaviour is worth preferring: a legitimate client that sends unexpected fields gets
actionable feedback, and an attacker gets no more information than from a silent ignore.

A separate model for admin operations can include additional fields, applied only after a role check:

```python
class AdminUserUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    email: EmailStr
    role: str
    is_verified: bool
```

The endpoint selects which model to apply based on the caller's role, not on the contents of the request.

## Django REST Framework

DRF serialisers provide equivalent control via `fields` and `read_only_fields`:

```python
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "email"]
        read_only_fields = ["role", "balance", "is_verified"]
```

Fields not in `fields` are not processed from input. `read_only_fields` provides a secondary signal: those fields
appear in serialised output but are ignored on write. The tighter control is `fields`: restricting to an explicit
list is clearer than a combination of inclusion and read-only exclusion.

## SQLAlchemy direct update

If updating model attributes directly rather than via an input model, update only the specific fields rather than
merging the request body dictionary onto the model:

```python
# unsafe: any key in the dict is applied to the model
for key, value in request.get_json().items():
    setattr(user, key, value)

# safe: explicit per-field assignment
user.name = body.name
user.email = body.email
db.session.commit()
```

The loop pattern is the direct ORM equivalent of mass assignment: it applies whatever the caller sends.

## Testing

Sending a request with additional fields (`role`, `is_admin`, `balance`) and then reading the resource confirms
whether the endpoint enforces field restrictions. A 200 response where the sensitive field value changed is the
finding; a 400 or a 200 that left the field unchanged are both acceptable outcomes.
