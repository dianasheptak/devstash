---
name: DevStash Architecture Patterns
description: Key architectural patterns, known gaps, and recurring issues in DevStash codebase — updated 2026-05-18 audit
type: project
---

## Auth Wiring State (as of 2026-05-18 audit)

Auth is fully implemented via NextAuth v5. Items DB queries are fully migrated to accept `userId` param. Collections read queries (`getRecentCollections`, `getSidebarCollections`, `getAllCollections`, `getCollectionsForPicker`, `getCollectionBySlug`, `getCollectionStats`) still use internal `getDemoUserId()` — this is a known/tracked gap documented in CLAUDE.md history. Do NOT re-flag it.

## Known Authorization Gap (HIGH severity — open as of 2026-05-18)

`updateItem` in `src/lib/db/items.ts` line 204: when replacing collection memberships, `data.collectionIds` are written directly to the join table without verifying those collection IDs belong to the current user. A user could add their item to another user's collection by guessing the collection ID (cuid).

## Performance: getCollectionBySlug is a Full Table Scan

`getCollectionBySlug(slug)` fetches ALL of the demo user's collections with all their items, then filters in JS. Slug is not stored in the DB — it's derived from the name. This is O(N) in collections * items and gets expensive fast.

## Performance: getRecentCollections / getSidebarCollections — Nested N+Items Load

Both functions include all items per collection just to compute dominant type color. Should use a subquery or grouped aggregate instead.

## Performance: canCreateItem Makes Two Sequential DB Calls

`src/lib/billing/limits.ts` `canCreateItem` and `canCreateCollection` each make two separate Prisma queries (fetch user isPro, then count items/collections). Could be one query with `_count`.

## Duplicate formatBytes Utility

`formatBytes` function is copy-pasted in `src/components/items/item-drawer.tsx` (line 562), `src/components/items/file-upload.tsx` (line 202), and `src/components/items/file-row.tsx`. Should be extracted to `src/lib/format.ts`.

## Large Files to Watch

- `src/components/items/item-drawer.tsx` — 567 lines with multiple subcomponents. Candidate for splitting.
- `src/lib/db/collections.ts` — 333 lines, inflated by demo-user migration debt.

## getCollectionsForPicker Uses Wrong User

`GET /api/collections` is auth-gated but calls `getCollectionsForPicker()` which internally calls `getDemoUserId()` — so authenticated non-demo users get the demo user's collections in the create/edit item pickers, not their own.

## Stripe

- No idempotency keys on checkout/portal session creation.
- No webhook event dedup table (noted as out of scope in project history).
- Session callback does a `prisma.user.findUnique` on every authenticated request (correct for security, adds latency).

## Auth Session Callback

`src/auth.ts` session callback hits the DB on every request to validate `passwordChangedAt` and read `isPro`. This is correct and intentional — not a bug.
