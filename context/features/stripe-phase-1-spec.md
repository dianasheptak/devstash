# Stripe Phase 1 — Core Infrastructure

## Overview

Lay the groundwork for Stripe subscriptions: schema, Stripe client, usage-limit helpers (with unit tests), session-level `isPro`, and the long-overdue items DB refactor off the demo user. No webhooks, no checkout, no UI — Phase 2 covers those.

Reference: [docs/stripe-integration-plan.md](../../docs/stripe-integration-plan.md)

## Goals

- Persist subscription state on the `User` model
- Single `Stripe` client + price helpers usable by every server module
- `canCreateItem` / `canCreateCollection` policy functions, unit-tested
- `session.user.isPro` available everywhere `session.user.id` is, with zero extra DB round-trips
- All items queries scoped to the signed-in user (not `demo@devstash.io`)

## Schema Changes

Add to `User` in `prisma/schema.prisma`:

```prisma
subscriptionStatus      String?
subscriptionPriceId     String?
subscriptionCancelAt    DateTime?
subscriptionPeriodEnd   DateTime?
```

Migration: `npx prisma migrate dev --name add_subscription_fields`

> CLAUDE.md is explicit: **never** `prisma db push`.

## Files to Create

1. `src/lib/stripe.ts` — server-only `Stripe` client; pinned `apiVersion`; `priceIdFor(interval)` and `intervalForPriceId(priceId)` helpers reading `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`
2. `src/lib/billing/limits.ts` — server-only; exports `FREE_LIMITS = { items: 50, collections: 3 }`, `canCreateItem(userId)`, `canCreateCollection(userId)`, `isProType(type)`; returns `{ allowed: true } | { allowed: false; reason: string }`
3. `src/lib/billing/limits.test.ts` — Vitest, mocks `@/lib/prisma` at the import boundary (matches `src/actions/items.test.ts`):
   - Pro user → allowed (no count query needed)
   - Free user under limit → allowed
   - Free user at limit → blocked with correct reason string
   - Same three cases for collections
   - `isProType` — true for `file`/`image`, false otherwise

## Files to Modify

### `src/auth.ts` — fold `isPro` into existing session `findUnique`

The session callback already selects `passwordChangedAt`. Add `isPro: true` to the same `select` and assign `session.user.isPro = u.isPro`. No new round-trip.

### `src/types/next-auth.d.ts`

Add `isPro: boolean` to the augmented `Session.user`.

### `src/lib/db/items.ts` — migrate off the demo user

Every query in this module currently calls `getDemoUserId()`. Replace with a `userId: string` parameter from the action layer. This matches the pattern already used in `src/lib/db/collections.ts` and `src/lib/db/profile.ts`. Update all call sites in `src/actions/items.ts`, `src/app/dashboard/page.tsx`, `src/app/items/[type]/page.tsx`, the sidebar layout, and `src/app/api/items/[id]/route.ts` to pass `session.user.id`.

> This is the highest-leverage change in Phase 1. Without it, every limit check in Phase 2 counts against the demo user, not the signed-in user.

### `prisma/seed.ts`

Set `demo@devstash.io` to `isPro: true` so seeded demo work isn't gated once Phase 2 lands.

## Environment Variables

Already declared in `.env.example`. Phase 1 only requires `STRIPE_SECRET_KEY` for the client to instantiate (it throws at import if missing). Leave price IDs / webhook secret blank until Phase 2.

```
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
```

## Testing

- `npm run test:run` — new `limits.test.ts` passes; all existing tests still green after the items DB refactor
- `npm run build` — green
- Manual smoke: sign in, visit `/dashboard` and `/items/snippets` — pages render against the **signed-in user's** data (not the demo user's). Existing accounts that aren't `demo@devstash.io` will see empty grids; that's correct.
- `session.user.isPro` is `true` for the demo user, `false` for new accounts (verify via a temporary console.log or React DevTools)

## Key Gotchas

- `src/lib/stripe.ts` and `src/lib/billing/*` must start with `import "server-only"` — they read `process.env.STRIPE_SECRET_KEY` and must never end up in a client bundle
- Don't call `priceIdFor()` at module top-level in Phase 1 code — the env var is fine for client construction but the price IDs aren't set yet
- The items refactor will touch ~6 files. Do it in one focused commit before adding any limit checks
- Session callback runs on every request; keep the `select` narrow (`id` is keyed, `passwordChangedAt` + `isPro` are scalar)

## Out of Scope (Phase 2)

- Stripe Checkout / Customer Portal routes
- Webhook handler + `syncSubscriptionFromStripe`
- Enforcing limits in `createItem` / `createCollection` actions
- Upgrade / Manage Subscription UI on `/profile`
- Stripe Dashboard product + price + webhook setup
