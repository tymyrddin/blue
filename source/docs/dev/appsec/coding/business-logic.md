# Application logic security

[Business logic vulnerabilities](https://red.tymyrddin.dev/docs/in/app/techniques/business.html) exploit what an
application is designed to do, not a flaw in how it does it. Each individual request may be authenticated, authorised,
and within documented parameter ranges. The vulnerability lives in the state machine: in the gap between the workflow
the developer tested and what the application does when steps are skipped, parameters are modified between steps, or
operations are combined in sequences the developer did not anticipate. Scanners do not find these because they look like
normal usage.

## Server-side re-validation at every step

Multistep workflows that validate eligibility or conditions at step one and not at subsequent steps allow an attacker
to reach the terminal state by skipping to the end. The condition is re-checked at every step that acts on it:

```python
# checkout step 2: re-verify eligibility, do not trust step 1's conclusion
def confirm_purchase(session_id: str, user: User) -> None:
    cart = get_cart(session_id)

    # re-validate discount eligibility at the point of applying it
    if cart.discount_code:
        validate_discount(cart.discount_code, user)

    # re-validate stock availability at the point of reservation
    for item in cart.items:
        reserve_stock(item.product_id, item.quantity)

    charge_payment(user, cart.total)
```

Eligibility checked once and stored in a session variable is a writable value. Eligibility checked at each consequential
step is a constraint.

## Client-side values are attacker-controlled

Prices, quantities, and discount amounts carried in hidden form fields, cookies, or URL parameters are modifiable by the
client. Server-side code recalculates them from authoritative sources:

```python
@app.route("/checkout/confirm", methods=["POST"])
def confirm():
    cart_id = request.form["cart_id"]
    cart = Cart.query.get_or_404(cart_id)

    # recalculate from the database, not from the submitted form
    total = sum(
        item.product.current_price * item.quantity
        for item in cart.items
    )

    charge(g.current_user, total)
```

A price submitted in the request is ignored; it is recalculated from the database records for each item.

## Enforcing step sequence

Workflows with a required sequence check that the preceding step was completed before accepting the current step's
request:

```python
class CheckoutSession:
    STATE_SEQUENCE = ["cart", "address", "payment", "confirmed"]

    def advance_to(self, next_state: str) -> None:
        current_index = self.STATE_SEQUENCE.index(self.current_state)
        next_index = self.STATE_SEQUENCE.index(next_state)

        if next_index != current_index + 1:
            raise ValueError(f"cannot advance from {self.current_state!r} to {next_state!r}")

        self.current_state = next_state
```

Storing state transitions in the server-side session and validating the sequence prevents direct jumps to the
confirmation step.

## Limit enforcement at the data layer

Application-level rate and quota checks are vulnerable to race conditions: two concurrent requests can both pass the
check before either writes the result. Database constraints and atomic update statements enforce limits without a
separate check step:

```sql
-- single-use coupon: UNIQUE constraint prevents two redemptions
INSERT INTO coupon_redemptions (coupon_id, user_id, redeemed_at)
VALUES (:coupon_id, :user_id, now())
-- if this raises IntegrityError, the coupon was already redeemed
```

The database constraint is the enforcement point. An application-level check that runs first is useful for returning a
helpful error message early, but the constraint is what actually prevents the double-spend.

## Threat modelling workflows

Security review that tests endpoints in isolation misses workflow-level vulnerabilities. Mapping the application's state
machine before testing reveals the paths that receive less attention: the edge cases, the cancel-then-refund path, the
admin feature accessible to users with a half-complete account upgrade. The questions worth asking for each workflow
are: what is the most valuable outcome, and which steps on the path to it are less carefully guarded than the intended
path?
