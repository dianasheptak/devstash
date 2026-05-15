# Stripe Integration Plan — DevStash Pro

> Goal: ship a working subscription paywall with monthly ($8/mo) and yearly ($72/yr) plans, Stripe Checkout for purchase, Stripe Customer Portal for self-serve management, webhook-driven `isPro` sync, and feature gating on Free-tier limits (50 items, 3 collections).

---

## 1 — Current State Analysis

### User model

`prisma/schema.prisma` already has all required columns:

```prisma
model User {
  id                   String    @id @default(cuid())
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  // ...
}
```

No migration is needed for the columns themselves. We **will** add `subscriptionStatus` and `subscriptionPeriodEnd` for richer UX (banner copy, grace period) — see §3.

### NextAuth / session

- `src/auth.ts` — JWT strategy. `jwt({ user })` runs **only on sign-in** (sets `token.id`, `token.pwAt`). `session({ session, token })` re-fetches `passwordChangedAt` on every request to invalidate stale tokens.
- `src/types/next-auth.d.ts` — `Session.user` is augmented with `id: string`. `JWT` has `id?: string` and `pwAt?: number`.
- The session callback already does a DB round-trip per request, so adding `isPro` to it is free.
- The proxy (`src/proxy.ts`) only checks `!!auth?.user` for `/dashboard`, `/items`, `/collections`. Pro gating happens server-side in actions and pages, not in the proxy.

### How user data is accessed

- **Server actions** (`src/actions/items.ts`, `src/actions/collections.ts`) use `auth()` to get `session.user.id` and gate on it.
- **DB queries** in `src/lib/db/items.ts` currently hard-code the **demo user** via `getDemoUserId()` (TODO comment present). The items module is **not yet** session-scoped. Items mutations must be migrated to the session user before paywall checks make sense — see §6 implementation order.
- `src/lib/db/collections.ts` and `src/lib/db/profile.ts` already take `userId` as a parameter (the correct pattern).

### Existing payment code

None. `.env.example` already declares `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` (all blank). `isPro` / `stripeCustomerId` / `stripeSubscriptionId` are not read or written anywhere outside the generated Prisma client.

---

## 2 — Feature Gating Analysis

### Free-tier limits (from `context/project-overview.md`)

| Resource     | Free | Pro       |
| ------------ | ---- | --------- |
| Items        | 50   | Unlimited |
| Collections  | 3    | Unlimited |
| File / Image | 🚫    | ✅         |
| Custom types | 🚫    | (future)  |
| AI features  | 🚫    | (future)  |
| Export       | 🚫    | (future)  |

### Where to enforce

| Limit              | Enforcement site                                    | Notes                                                                |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------------- |
| ≤ 50 items         | `createItem` action (`src/actions/items.ts:21`)     | Count items where `userId = session.user.id`; reject before DB write. |
| ≤ 3 collections    | `createCollection` action (`src/actions/collections.ts:18`) | Same pattern.                                                |
| FILE / IMAGE items | Future file upload route + `createItem` validation  | Reject `type === 'file' \| 'image'` for non-Pro.                      |
| AI / Export        | Routes don't exist yet — gate at route entry later. | Out of scope for this PR.                                            |

The Pro sidebar badge already exists in `src/components/layout/sidebar-nav.tsx:60` (`isPro` prop on file/image types). The badge is currently cosmetic — clicking still takes you to an empty `/items/files` page. Leave as-is; gating happens in the create dialog.

### Settings page

There is no `/settings` route. The closest is `/profile` (`src/app/profile/page.tsx`) which shows identity, usage breakdown, and `ProfileActions` (Change password / Delete account). **We will add a "Subscription" section to the profile page** rather than create a separate `/settings` page — this matches the existing pattern and keeps the surface area small.

---

## 3 — Schema Changes

One small migration to track subscription state for the UI:

```prisma
// prisma/schema.prisma — User model
subscriptionStatus      String?    // active, trialing, past_due, canceled, incomplete, …
subscriptionPriceId     String?    // STRIPE_PRICE_ID_MONTHLY or _YEARLY (drives "Monthly" / "Yearly" label)
subscriptionCancelAt    DateTime?  // set when user cancels at period end
subscriptionPeriodEnd   DateTime?  // current_period_end — for "renews on …" / "ends on …"
```

```bash
npx prisma migrate dev --name add_subscription_fields
```

> CLAUDE.md is explicit: **never** `prisma db push`, always create a migration.

---

## 4 — Files to Create

### 4.1 `src/lib/stripe.ts` — Server-only client + price config

```typescript
import "server-only";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Pin to a known API version so Stripe-side updates can't silently change behavior.
  apiVersion: "2025-09-30.acacia",
  typescript: true,
});

export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY ?? "";
export const STRIPE_PRICE_YEARLY = process.env.STRIPE_PRICE_ID_YEARLY ?? "";

export type Interval = "monthly" | "yearly";

export function priceIdFor(interval: Interval): string {
  return interval === "yearly" ? STRIPE_PRICE_YEARLY : STRIPE_PRICE_MONTHLY;
}

export function intervalForPriceId(priceId: string | null | undefined): Interval | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICE_YEARLY) return "yearly";
  if (priceId === STRIPE_PRICE_MONTHLY) return "monthly";
  return null;
}
```

### 4.2 `src/lib/billing/limits.ts` — Free-tier policy

```typescript
import "server-only";
import { prisma } from "@/lib/prisma";

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const;

export type LimitCheck = { allowed: true } | { allowed: false; reason: string };

export async function canCreateItem(userId: string): Promise<LimitCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  if (user?.isPro) return { allowed: true };

  const count = await prisma.item.count({ where: { userId } });
  if (count >= FREE_LIMITS.items) {
    return {
      allowed: false,
      reason: `Free plan is limited to ${FREE_LIMITS.items} items. Upgrade to Pro for unlimited.`,
    };
  }
  return { allowed: true };
}

export async function canCreateCollection(userId: string): Promise<LimitCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  if (user?.isPro) return { allowed: true };

  const count = await prisma.collection.count({ where: { userId } });
  if (count >= FREE_LIMITS.collections) {
    return {
      allowed: false,
      reason: `Free plan is limited to ${FREE_LIMITS.collections} collections. Upgrade to Pro for unlimited.`,
    };
  }
  return { allowed: true };
}

export function isProType(type: string): boolean {
  return type === "file" || type === "image";
}
```

### 4.3 `src/lib/billing/subscription.ts` — DB sync helper for webhook

```typescript
import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing"];

export async function syncSubscriptionFromStripe(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) {
    console.warn("[stripe] subscription event for unknown customer", customerId);
    return;
  }

  const priceId = sub.items.data[0]?.price.id ?? null;
  const isPro = ACTIVE_STATUSES.includes(sub.status);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionPriceId: priceId,
      subscriptionCancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
      subscriptionPeriodEnd: new Date(sub.current_period_end * 1000),
    },
  });
}

export async function clearSubscription(customerId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: false,
      stripeSubscriptionId: null,
      subscriptionStatus: "canceled",
      subscriptionPriceId: null,
      subscriptionCancelAt: null,
      subscriptionPeriodEnd: null,
    },
  });
}
```

### 4.4 `src/app/api/stripe/checkout/route.ts` — Create Checkout Session

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, priceIdFor, type Interval } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { interval } = (await req.json().catch(() => ({}))) as { interval?: Interval };
  if (interval !== "monthly" && interval !== "yearly") {
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
  }

  const price = priceIdFor(interval);
  if (!price) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true, isPro: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.isPro) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  // Reuse the customer if we've seen this user before; otherwise let Checkout create one
  // and capture it in the customer.created/subscription.created webhooks.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/profile?checkout=success`,
    cancel_url: `${appUrl}/profile?checkout=cancel`,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  return NextResponse.json({ url: checkout.url });
}
```

### 4.5 `src/app/api/stripe/portal/route.ts` — Customer Portal

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/profile`,
  });
  return NextResponse.json({ url: portal.url });
}
```

### 4.6 `src/app/api/stripe/webhook/route.ts` — Webhook handler

```typescript
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionFromStripe, clearSubscription } from "@/lib/billing/subscription";

export const runtime = "nodejs"; // webhooks must use the node runtime for raw body

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  // Stripe needs the *raw* body for signature verification.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Subscription is created by this point — pull it and sync.
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) {
          const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscriptionFromStripe(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.trial_will_end": {
        await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await clearSubscription(customerId);
        break;
      }
      case "invoice.payment_failed": {
        // Stripe will also fire subscription.updated with status=past_due — we rely on that.
        // Log here for visibility.
        const inv = event.data.object as Stripe.Invoice;
        console.warn("[stripe] payment failed", inv.id, inv.customer);
        break;
      }
      default:
        // Unhandled — return 200 so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    console.error("[stripe] webhook handler error", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

### 4.7 `src/components/billing/upgrade-card.tsx` — Profile-page CTA

Client component with:

- Monthly / Yearly toggle (matches the homepage pricing card)
- "Upgrade to Pro" button → `POST /api/stripe/checkout` → redirect to `data.url`
- Pending state via `useTransition`, toast on error

### 4.8 `src/components/billing/manage-subscription-card.tsx` — Pro user view

- Shows current plan (Monthly / Yearly), `subscriptionStatus` badge
- "Manage billing" button → `POST /api/stripe/portal` → redirect to `data.url`
- "Renews on …" / "Cancels on …" copy from `subscriptionPeriodEnd` / `subscriptionCancelAt`

### 4.9 `src/lib/billing/limits.test.ts` — Vitest

Unit-test `canCreateItem` / `canCreateCollection` for: Pro user passes, Free user under limit passes, Free user at limit blocks. Mock Prisma at the import boundary (matches `src/actions/items.test.ts` pattern).

### 4.10 `src/lib/billing/subscription.test.ts` — Vitest

Unit-test `syncSubscriptionFromStripe` with mocked Stripe objects: active → `isPro: true`, canceled → `isPro: false`, unknown customer → no-op + warn.

---

## 5 — Files to Modify

### 5.1 `prisma/schema.prisma`

Add the four subscription fields listed in §3.

### 5.2 `src/auth.ts` — Sync `isPro` into the session

Per the prompt's workaround, add a DB read for `isPro` in the **session** callback (which already does a `findUnique` for `passwordChangedAt`). Combine into a single query — zero extra round-trips.

```typescript
async session({ session, token }) {
  if (typeof token.id !== "string" || !session.user) return session;

  const u = await prisma.user.findUnique({
    where: { id: token.id },
    select: { passwordChangedAt: true, isPro: true },
  });

  if (
    !u ||
    typeof token.pwAt !== "number" ||
    u.passwordChangedAt.getTime() > token.pwAt
  ) {
    return { ...session, user: { ...session.user, id: undefined as unknown as string } };
  }

  session.user.id = token.id;
  session.user.isPro = u.isPro;
  return session;
},
```

### 5.3 `src/types/next-auth.d.ts` — Augment session type

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}
```

### 5.4 `src/actions/items.ts` — Enforce limits + Pro types

In `createItem` (after auth, before DB write):

```typescript
import { canCreateItem, isProType } from "@/lib/billing/limits";
// ...
const limit = await canCreateItem(session.user.id);
if (!limit.allowed) return { success: false, error: limit.reason };

if (isProType(parsed.data.type) && !session.user.isPro) {
  return { success: false, error: "File and image items require a Pro plan." };
}
```

> Note: `createItemSchema` currently rejects `file` / `image` anyway (only 5 creatable types). Once file uploads ship, the `isProType` check becomes the canonical gate.

### 5.5 `src/lib/db/items.ts` — Migrate off the demo user

Replace every `getDemoUserId()` call site with a `userId` parameter from the action layer (matches how `src/lib/db/collections.ts` already works). Without this, the paywall gates the **demo user's** counts, not the signed-in user's. This is the highest-leverage change in the PR.

### 5.6 `src/actions/collections.ts` — Enforce collection limit

```typescript
import { canCreateCollection } from "@/lib/billing/limits";
// ...
const limit = await canCreateCollection(session.user.id);
if (!limit.allowed) return { success: false, error: limit.reason };
```

### 5.7 `src/lib/db/profile.ts` — Expose subscription state

Extend `ProfileData.user` with `isPro`, `subscriptionStatus`, `subscriptionPriceId`, `subscriptionPeriodEnd`, `subscriptionCancelAt`. One more `select` in the existing `findUnique` — no extra round-trip.

### 5.8 `src/app/profile/page.tsx` — Render billing section

Add a new "Subscription" section between "Usage" and "Account":

- If `user.isPro`: render `<ManageSubscriptionCard … />`
- Else: render `<UpgradeCard … />`

Also handle `?checkout=success|cancel` via a sonner toast in a small client island (same pattern as `?verify=success` on sign-in).

### 5.9 `.env.example`

Already declares the five Stripe vars. Add inline comments documenting where to find each value (dashboard URLs + how to run `stripe listen`).

### 5.10 `prisma/seed.ts`

Set the demo user (`demo@devstash.io`) to `isPro: true` so existing dev demos aren't suddenly gated.

---

## 6 — Stripe Dashboard Setup Steps

1. **Create the Product** — Stripe Dashboard → Products → **+ Add product**
   - Name: `DevStash Pro`
   - Description: `Unlimited items, file uploads, AI features, and more.`
2. **Add two recurring prices** under that product
   - `$8.00 USD / month` → copy ID into `STRIPE_PRICE_ID_MONTHLY`
   - `$72.00 USD / year` → copy ID into `STRIPE_PRICE_ID_YEARLY`
3. **Enable the Customer Portal** — Dashboard → Settings → Billing → Customer portal
   - Allow cancellation, plan switching between the two prices, payment method updates
   - Save the URL configuration
4. **Webhook (test mode)**
   - Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook` → copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` for local dev
   - Hosted: Developers → Webhooks → **+ Add endpoint** at `https://<your-domain>/api/stripe/webhook`
   - Events to send: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `invoice.payment_failed`
5. **API keys** — Developers → API keys
   - `pk_test_…` → `STRIPE_PUBLISHABLE_KEY` (currently unused in code — keep declared for parity)
   - `sk_test_…` → `STRIPE_SECRET_KEY`

---

## 7 — Testing Checklist

### Unit tests (Vitest)

- [ ] `limits.test.ts` — Pro pass, Free under-limit pass, Free at-limit block (×2 for items + collections)
- [ ] `subscription.test.ts` — active → isPro true, canceled → isPro false, unknown customer logs and no-ops
- [ ] Existing `items.test.ts` / `collections.test.ts` still pass after the demo-user → session-user migration

### Manual flow (test mode)

- [ ] As Free user, hit the 50-item limit → create blocked with toast; upgrade card visible on profile
- [ ] As Free user, hit the 3-collection limit → create blocked
- [ ] Click "Upgrade to Pro (monthly)" → land on Stripe Checkout → complete with `4242 4242 4242 4242` → redirect to `/profile?checkout=success` → "Subscription active" toast; reload and `isPro=true`, limits no longer block
- [ ] Same flow for yearly
- [ ] Cancel from Customer Portal → webhook fires `customer.subscription.updated` with `cancel_at_period_end=true` → profile shows "Cancels on …"
- [ ] Cancel immediately from Portal → `customer.subscription.deleted` → `isPro=false`
- [ ] `4000 0000 0000 9995` (charge fails) → `invoice.payment_failed` logged; status → `past_due` → `isPro=false`
- [ ] Webhook signature failure → 400 response
- [ ] Replay a webhook from Dashboard → handler is idempotent (same final state)

### Build & lint

- [ ] `npm run test:run` green
- [ ] `npm run build` green
- [ ] `npm run lint` clean

---

## 8 — Implementation Order

Each numbered step is a meaningful checkpoint where the build and tests should pass.

1. **Migrate items DB layer off the demo user** (§5.5). Without this, every limit check below is wrong. This is its own commit — pure refactor, no behavior change for the demo user (we'll flip `demo.isPro = true` in §3 of step 5).
2. **Schema migration** (§3) + regenerate Prisma client.
3. **Stripe client + helpers** (§4.1–4.3) + `limits.test.ts` + `subscription.test.ts`.
4. **Session sync** (§5.2, §5.3) — `isPro` now available everywhere `session.user.id` is.
5. **Seed update** (§5.10) — demo user becomes Pro so dev work isn't gated.
6. **Enforce limits** in actions (§5.4, §5.6). At this point the app is paywalled but offers no upgrade path.
7. **Checkout + Portal routes** (§4.4, §4.5).
8. **Webhook route** (§4.6) — wire `stripe listen` locally before merging.
9. **Profile UI** (§5.7, §5.8, §4.7, §4.8) — Upgrade card / Manage subscription card.
10. **Stripe Dashboard setup** (§6) — fill `.env.local`, smoke-test the full happy path end-to-end.

---

## 9 — Out of Scope (Follow-ups)

- File uploads (R2) — Pro gate is wired but no upload UI yet
- AI features — gating placeholder only
- Export — same
- Annual-to-monthly proration UX beyond Customer Portal defaults
- Webhook event-id dedupe table (Stripe already retries on non-2xx; our handlers are idempotent because they overwrite the same row, but a `StripeEvent` table would let us trace replays)
- Server-side rate limiting on `/api/stripe/checkout` and `/api/stripe/portal` (reuse `src/lib/rate-limit.ts` pattern; low priority since both endpoints require auth and Stripe enforces its own quotas)
