# Input validation

The boundary between untrusted and trusted data is the edge of the application: HTTP
requests, file uploads, queue messages, webhook payloads, inter-service API calls. Internal
functions can assume their arguments are already validated; entry points cannot.

Validation has two goals: confirm the value is structurally what the application expects,
and convert it to the type that subsequent code will use. The conversion step is itself a
form of validation: `int(value)` raises on non-numeric input without requiring a regex.

## Python: Pydantic

Pydantic validates structured inputs at parse time and raises with field-level error
messages on failure. It is suited to API request bodies, configuration files, and any
context where a dict needs to be converted to typed fields:

```python
from pydantic import BaseModel, Field, field_validator
from datetime import date

class BookingRequest(BaseModel):
    guest_name: str = Field(min_length=1, max_length=100)
    check_in: date
    nights: int = Field(ge=1, le=365)

    @field_validator("guest_name")
    @classmethod
    def no_control_characters(cls, v: str) -> str:
        if any(c < " " for c in v):
            raise ValueError("control characters not permitted")
        return v.strip()

# raises pydantic.ValidationError if the data does not conform
booking = BookingRequest.model_validate(request.json())
```

The validated `booking` object carries typed fields: `booking.check_in` is a `date`.
Downstream code does not need to revalidate.

## JavaScript/TypeScript: Zod

Zod provides the same pattern for JavaScript runtimes, with TypeScript inference:

```typescript
import { z } from "zod";

const BookingSchema = z.object({
    guestName: z.string().min(1).max(100),
    checkIn: z.string().date(),
    nights: z.number().int().min(1).max(365),
});

// throws ZodError if input does not match
const booking = BookingSchema.parse(req.body);
// booking is typed: booking.nights is number, booking.checkIn is string (ISO date)
```

For Express-style handlers where throwing is inconvenient:

```typescript
const result = BookingSchema.safeParse(req.body);
if (!result.success) {
    res.status(400).json({ errors: result.error.flatten() });
    return;
}
const booking = result.data;
```

## Primitive coercion

For single values, stdlib coercion is sufficient and raises on invalid input:

```python
# raises ValueError on non-integer input
user_id = int(request.args["id"])

# raises ValueError on invalid date format
from datetime import date
check_in = date.fromisoformat(request.args["check_in"])
```

## Regex validation

Regex is appropriate for formats with no stdlib parser: postcodes, product codes,
identifiers. Allowlist patterns (permit known-good characters) are more reliable than
denylist patterns (reject known-bad ones):

```python
import re

POSTCODE_RE = re.compile(r"^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$")

def validate_postcode(value: str) -> str:
    value = value.strip().upper()
    if not POSTCODE_RE.match(value):
        raise ValueError(f"invalid postcode: {value!r}")
    return value
```

Denylist patterns that try to reject `<`, `>`, `script`, `'` etc. are routinely bypassed
through encoding, case variation, and unicode equivalences. They offer a false sense of
coverage; the [SQL injection attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/sqli.html) page shows how this plays out
against SQL injection specifically.
Last updated: 10 July 2026
