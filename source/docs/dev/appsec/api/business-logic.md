# API business logic

[Business logic abuse at the API layer](https://red.tymyrddin.dev/docs/in/api/notes/business-logic.html) exploits the
gap between what the API documents and what it does when operations are combined or sequenced in ways the developer
did not test. A rate limit bypass, a quota abuse, a workflow shortcut: each of these is individually a valid
authenticated request. The vulnerability is in the state machine, not in any individual call.

## Idempotency

State-changing endpoints that can be retried or replayed are a source of double-execution bugs. A payment endpoint
called twice (due to a network timeout and a client retry) may charge twice if the server processes both requests.
An idempotency key, included by the caller and stored server-side, causes the second request to return the cached
result of the first:

```python
from sqlalchemy import select

def process_payment(idempotency_key: str, amount: int, user_id: int) -> dict:
    existing = db.session.execute(
        select(IdempotencyRecord).filter_by(key=idempotency_key, user_id=user_id)
    ).scalar_one_or_none()

    if existing:
        return existing.result  # return cached result, do not re-execute

    result = charge(user_id, amount)

    record = IdempotencyRecord(key=idempotency_key, user_id=user_id, result=result)
    db.session.add(record)
    db.session.commit()

    return result
```

The idempotency key is scoped per user to prevent one user from using another's key to observe or suppress their
operations.

## Quota and credit enforcement

Application-level check-before-write is vulnerable to race conditions: two concurrent requests can both read a quota
counter below the limit and both proceed to decrement it past zero. Atomic database operations close the race window:

```python
from sqlalchemy import update

def consume_credit(user_id: int, amount: int) -> bool:
    result = db.session.execute(
        update(UserCredits)
        .where(UserCredits.user_id == user_id, UserCredits.balance >= amount)
        .values(balance=UserCredits.balance - amount)
    )
    db.session.commit()
    return result.rowcount == 1  # False if balance was insufficient
```

The `WHERE balance >= amount` clause in the UPDATE means the decrement only happens if the balance is sufficient at
the moment the database executes the statement. No separate SELECT is needed; no race window exists between the check
and the write.

## Workflow step validation

Multi-step API flows (onboarding, checkout, account upgrade) are vulnerable when a later step can be called without
completing the preceding step. The terminal step (the one that grants access, processes payment, or changes status)
verifies that the required earlier steps are complete:

```python
class UpgradeSession(db.Model):
    STATE_SEQUENCE = ["initiated", "verified", "payment_captured", "complete"]

    def advance_to(self, next_state: str) -> None:
        current_index = self.STATE_SEQUENCE.index(self.state)
        next_index = self.STATE_SEQUENCE.index(next_state)

        if next_index != current_index + 1:
            raise ValueError(f"invalid transition: {self.state!r} to {next_state!r}")

        self.state = next_state
```

The state sequence is stored server-side; the caller does not control which transitions are valid.

## Bulk and export endpoints

Export endpoints that return large result sets are a data exfiltration path when called systematically. Worth
applying: a page size cap enforced server-side (the caller cannot override it upwards), object-level authorisation
applied to every item in the result (not just the top-level request), and a separate, lower rate limit for export
operations than for ordinary reads.

Bulk-write endpoints (those that accept arrays of objects in a single request) warrant the same per-item
authorisation checks as individual write endpoints. A bulk endpoint that validates the top-level request and then
applies all items without per-item ownership checks is an IDOR at scale.
Last updated: 17 May 2026
