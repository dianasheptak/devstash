# Stripe Phase 2 — Integration & UI

## Overview

Plug the Phase 1 infrastructure into a full subscription flow: webhook-driven `isPro` sync, paywall enforcement in server actions, Checkout + Customer Portal routes, and the upgrade/manage UI on `/profile`. Requires the Stripe CLI for local webhook testing.

Reference: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md)

**Depends on:** Phase 1 (schema, `src/lib/stripe.ts`, `src/lib/billing/limits.ts`, session `isPro`, items DB refactored off the demo user).

## Goals

- Stripe webhook keeps `User.isPro` + subscription metadata in sync
- `createItem` and `createCollection` actions enforce Free-tier limits and the Pro-only `file`/`image` types
- Users can upgrade via Stripe Checkout (monthly $8 / yearly $72) and manage their subscription via Stripe Customer Portal
- Profile page renders an Upgrade card (Free) or Manage Subscription card (Pro)

## Files to Create

1. `src/lib/billing/subscription.ts` — server-only; `syncSubscriptionFromStripe(sub)` writes `isPro` + status/priceId/cancelAt/periodEnd by `stripeCustomerId`; `clearSubscription(customerId)` zeros everything out. `active` and `trialing` → `isPro: true`; anything else → `false`.
2. `src/lib/billing/subscription.test.ts` — Vitest, mocks Prisma + Stripe at the import boundary:
   - active subscription → `isPro: true`, fields populated
   - canceled → `isPro: false`
   - unknown `stripeCustomerId` → no DB write, warning logged
3. `src/app/api/stripe/checkout/route.ts` — `auth()`-gated POST; reads `{ interval: "monthly" | "yearly" }`; creates a `Stripe.Customer` if `user.stripeCustomerId` is null (persisted before the Checkout call); creates a `checkout.sessions` in `mode: "subscription"` with `success_url=/profile?checkout=success`, `cancel_url=/profile?checkout=cancel`, `allow_promotion_codes: true`, `client_reference_id: user.id`, `subscription_data.metadata.userId`; returns `{ url }`. Rejects already-Pro users with 400.
4. `src/app/api/stripe/portal/route.ts` — `auth()`-gated POST; creates `billingPortal.sessions` for `user.stripeCustomerId`; returns `{ url }`. 400 if no billing account.
5. `src/app/api/stripe/webhook/route.ts` — `runtime = "nodejs"`; verifies `stripe-signature` against `STRIPE_WEBHOOK_SECRET` using the **raw** body (`await req.text()`); dispatches:
   - `checkout.session.completed` → retrieve subscription, `syncSubscriptionFromStripe`
   - `customer.subscription.created` / `.updated` / `.trial_will_end` → `syncSubscriptionFromStripe`
   - `customer.subscription.deleted` → `clearSubscription`
   - `invoice.payment_failed` → log (state already arrives via `subscription.updated`)
   - default → 200 (no retry)
6. `src/components/billing/upgrade-card.tsx` — client component; Monthly/Yearly toggle (default Monthly); "Upgrade to Pro" button → `POST /api/stripe/checkout` → `window.location.href = data.url`; `useTransition` for pending; sonner toast on error
7. `src/components/billing/manage-subscription-card.tsx` — Pro user view; shows plan (Monthly/Yearly via `intervalForPriceId`), status badge, "Renews on …" or "Cancels on …" from `subscriptionPeriodEnd` / `subscriptionCancelAt`; "Manage billing" button → `POST /api/stripe/portal` → redirect
8. `src/components/profile/checkout-toast.tsx` — small client island that reads `?checkout=success|cancel` from the URL and fires a one-shot sonner toast (dedupe by `id: "checkout"`, same pattern as `?verify=*` on sign-in)

## Files to Modify

### `src/actions/items.ts` — enforce limits + Pro type gate

In `createItem`, after `auth()` and `safeParse`, before the DB call:

```typescript
const limit = await canCreateItem(session.user.id);
if (!limit.allowed) return { success: false, error: limit.reason };

if (isProType(parsed.data.type) && !session.user.isPro) {
  return { success: false, error: "File and image items require a Pro plan." };
}
```

### `src/actions/collections.ts` — enforce collection limit

Same pattern with `canCreateCollection` in `createCollection`.

### `src/lib/db/profile.ts` — surface subscription state

Extend `ProfileData.user` with `isPro`, `subscriptionStatus`, `subscriptionPriceId`, `subscriptionPeriodEnd`, `subscriptionCancelAt`. Add the fields to the existing `findUnique` `select` — no extra round-trip.

### `src/app/profile/page.tsx`

Add a "Subscription" section between "Usage" and "Account":

- `user.isPro` → `<ManageSubscriptionCard … />`
- else → `<UpgradeCard />`

Mount `<CheckoutToast />` once on the page.

### `.env.example`

Add inline comments documenting where each value comes from and the `stripe listen --forward-to localhost:3000/api/stripe/webhook` command for `STRIPE_WEBHOOK_SECRET`.

## Stripe Dashboard Setup

1. Products → **+ Add product** — name `DevStash Pro`
2. Two recurring prices on that product:
   - $8.00 USD / month → `STRIPE_PRICE_ID_MONTHLY`
   - $72.00 USD / year → `STRIPE_PRICE_ID_YEARLY`
3. Settings → Billing → Customer portal — enable cancellation, plan switching between the two prices, payment-method updates; save the configuration
4. Webhook:
   - Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` → paste printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`
   - Hosted: Developers → Webhooks → endpoint at `https://<domain>/api/stripe/webhook` subscribed to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `invoice.payment_failed`
5. API keys → `sk_test_…` into `STRIPE_SECRET_KEY`

## Environment Variables

```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
APP_URL=http://localhost:3000
```

## Testing

### Unit (Vitest)

- `subscription.test.ts` — active / canceled / unknown-customer cases
- All existing tests still pass

### Manual (test mode, Stripe CLI running)

- Free user at 50 items → `createItem` blocked, error toast surfaces the limit message
- Free user at 3 collections → `createCollection` blocked
- Upgrade flow (monthly): `/profile` → Upgrade → Checkout with `4242 4242 4242 4242` → `/profile?checkout=success` → `isPro: true` after page reload, limits gone
- Same for yearly
- Manage Subscription → Portal → "Cancel at period end" → `customer.subscription.updated` → profile shows "Cancels on …"
- Portal → "Cancel immediately" → `customer.subscription.deleted` → `isPro: false`, card flips back to Upgrade
- `4000 0000 0000 9995` (charge fails) → `invoice.payment_failed` logged; subsequent `subscription.updated` sets `status: past_due` → `isPro: false`
- Tamper with `stripe-signature` header → webhook returns 400
- Replay any handled event from the Dashboard → final DB state unchanged (handlers are idempotent because they overwrite the same row)

### Build & lint

- `npm run test:run` green
- `npm run build` green
- `npm run lint` clean

## Key Gotchas

- **Raw body for webhooks.** Use `await req.text()` and pass the string straight to `stripe.webhooks.constructEvent`. Do not `req.json()` — Next.js will JSON.parse and the signature won't verify.
- **Force the node runtime** on the webhook route (`export const runtime = "nodejs"`). The edge runtime can't accept the raw body the way `constructEvent` needs.
- **Persist `stripeCustomerId` before opening Checkout**, not after. Otherwise a refresh during checkout will create a second customer.
- **Session needs a reload after checkout.** We do not call `useSession().update()`; the session callback already re-reads `isPro` from the DB on every request, so a hard navigation to `/profile?checkout=success` is sufficient. Don't add JWT `update()` plumbing.
- **Idempotency.** All handlers overwrite the same `User` row by `stripeCustomerId` — replaying any event is safe. No `StripeEvent` dedupe table needed for v1.
- **Return 200 on unhandled events.** Stripe retries on non-2xx; silent ignore keeps the dashboard's event log clean.
- The Pro sidebar badge on file/image already exists ([sidebar-nav.tsx:60](../../src/components/layout/sidebar-nav.tsx#L60)). Leave it; the gate is in the action.

## Out of Scope (Follow-ups)

- File uploads (R2) — `isProType` gate is wired but no upload UI yet
- AI features and export — gating placeholder only
- Annual ↔ monthly proration UX beyond Customer Portal defaults
- `StripeEvent` dedupe table for replay tracing
- Rate limiting on `/api/stripe/checkout` and `/api/stripe/portal` — both are `auth()`-gated and Stripe enforces its own quotas; revisit if abuse appears
