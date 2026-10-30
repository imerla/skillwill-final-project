# ADR 004 — Checkout Order ID Storage

## Status
Accepted

## Context
After placing an order, the user is taken to a code confirmation screen.
If the user refreshes the page (F5) on the confirmation screen, the orderId
must not be lost — otherwise the user cannot confirm their order.

## Decision
Store the orderId and order details in `sessionStorage` under:
- `pending_checkout_order_id` — the orderId string
- `pending_checkout_order_details` — JSON with total, currency, devCode

On page load, CheckoutPage checks sessionStorage and restores the confirm step
if both keys are present.

## Why sessionStorage and not localStorage
- The order is session-specific — closing the tab should discard it
- localStorage would persist across browser restarts which is unnecessary
- sessionStorage is cleared automatically when the tab closes

## Why not URL params
- The orderId is sensitive data — it should not appear in the address bar
- The URL is shareable; order IDs should not be shareable

## Cleanup
sessionStorage keys are removed when:
- The order is successfully confirmed
- The user clicks "Back" to return to the checkout form
- The tab is closed (sessionStorage is automatically cleared)

## Consequences
- F5 on the confirm screen correctly restores the confirm step ✅
- Card data is never stored — only orderId and checkout details (total, currency, devCode) are stored ✅
- Closing the tab discards the pending order (user must start over) ✅
