# ADR 003 — Cart Stepper Rapid Click Strategy

## Status
Accepted

## Context
The QuantityStepper in CartPage allows quantity changes via + and - buttons.
If the user clicks rapidly, multiple PATCH /cart/items/:id requests may be sent
concurrently and return out of order, leaving the UI showing an incorrect quantity.

## Decision
Disable the stepper while any mutation is pending (`isAnyMutationPending`).

This means:
- The stepper buttons and input are disabled during the network request
- No concurrent requests are possible
- The UI always reflects the server's confirmed state

## Alternatives Considered
- **Debounce**: delay sending the request by 300ms. Pros: feels faster for the user.
  Cons: adds complexity (need to track pending local value), still requires abort/cancel
  of previous request on rapid clicks.
- **Optimistic update**: update UI immediately, roll back on error. Pros: instant feedback.
  Cons: requires careful rollback logic, higher complexity.

## Consequences
- Simple and reliable — no race conditions possible
- Slightly slower perceived UX since user must wait for server response between clicks
- Already implemented via `disabled={isAnyMutationPending}` prop on QuantityStepper
