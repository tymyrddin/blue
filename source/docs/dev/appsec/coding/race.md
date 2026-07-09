# Race conditions

A race condition occurs when an application reads a value, makes a decision based on it, and then writes a result, but two concurrent requests each read the same unchanged state and both proceed as if they were the only operation. The classic form is a balance check: both requests see "balance: 100", both deduct 100, and the account ends at -100. The [race condition attack techniques](https://red.tymyrddin.dev/docs/in/app/techniques/race.html) page covers how HTTP/2 multiplexing has made these reproducible with single-packet timing.

## Database-level atomicity

The most reliable fix is to move the check and the update into a single atomic operation. SQL `UPDATE ... WHERE` with a condition combines both into one statement:

```sql
-- deduct balance only if sufficient funds exist
UPDATE accounts
SET balance = balance - 100
WHERE user_id = 42 AND balance >= 100;
```

If zero rows are affected, the check failed and the operation was rejected. Two concurrent requests cannot both pass: the database processes them serially at the row level, and the second one finds `balance = 0`.

In SQLAlchemy:

```python
from sqlalchemy import update
from sqlalchemy.orm import Session

def deduct_balance(session: Session, user_id: int, amount: int) -> bool:
    result = session.execute(
        update(Account)
        .where(Account.user_id == user_id, Account.balance >= amount)
        .values(balance=Account.balance - amount)
    )
    session.commit()
    return result.rowcount == 1  # True if deduction succeeded
```

The WHERE clause on `balance >= amount` prevents overdraft without a separate SELECT.

## Pessimistic locking

When the logic between the read and the write is complex and cannot be collapsed into a single statement, `SELECT ... FOR UPDATE` locks the row for the duration of the transaction:

```python
from sqlalchemy import select

with session.begin():
    account = session.execute(
        select(Account)
        .where(Account.user_id == user_id)
        .with_for_update()     # acquires a row-level lock
    ).scalar_one()

    if account.balance < amount:
        raise InsufficientFunds()

    account.balance -= amount
    # lock is released on commit
```

The second concurrent request blocks at `SELECT ... FOR UPDATE` until the first transaction commits. It then reads the updated balance and proceeds with the correct state.

## Optimistic locking

Optimistic locking avoids holding locks by adding a version column. The update includes the version in its WHERE clause; if the row was modified since the read, the update matches zero rows:

```python
class Account(Base):
    version = Column(Integer, nullable=False, default=0)

def deduct_balance(session, user_id, amount):
    account = session.get(Account, user_id)
    current_version = account.version

    if account.balance < amount:
        raise InsufficientFunds()

    result = session.execute(
        update(Account)
        .where(Account.user_id == user_id, Account.version == current_version)
        .values(balance=account.balance - amount, version=current_version + 1)
    )

    if result.rowcount == 0:
        raise ConcurrentModification()  # concurrent write; caller retries
```

Optimistic locking is appropriate for low-contention scenarios; under high contention, retry loops increase load. Pessimistic locking is more predictable when contention is expected.

## Idempotency tokens

For single-use operations (payment, invitation acceptance, token redemption), an idempotency token prevents duplicate execution regardless of race conditions:

```python
def redeem_token(session, token_value: str, user_id: int) -> None:
    # atomic UPDATE: only matches if not yet redeemed; concurrent duplicate sees rowcount=0
    rowcount = session.execute(
        update(RedemptionToken)
        .where(RedemptionToken.value == token_value, RedemptionToken.redeemed == False)
        .values(redeemed=True, redeemed_by=user_id)
    ).rowcount

    if rowcount == 0:
        raise TokenAlreadyUsed()
```

The WHERE clause on `redeemed == False` is what prevents double-redemption: the second concurrent request finds the row already marked `True` and matches nothing. A UNIQUE constraint on `token_value` at the table level prevents the same token being issued twice; that is a separate concern from the redemption logic shown here.
Last updated: 17 May 2026
