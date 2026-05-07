---
name: DevStash Architecture Patterns
description: Recurring patterns and architectural conventions discovered during first audit (2026-05-06)
type: project
---

All DB queries are scoped to a hardcoded demo user email (`demo@devstash.io`) via `getDemoUserId()`. This is intentional and documented — real auth via NextAuth v5 is not yet wired. Do NOT flag this as a security issue.

**Why:** Project is early-stage; auth is planned but not implemented. The TODO comments in `src/lib/db/items.ts` (line 54) and `src/lib/db/collections.ts` (line 13) confirm this.

**How to apply:** When auditing DB query authorization, note that the demo-user scoping is a placeholder, not a vulnerability. Flag it only if the `getDemoUserId()` pattern is duplicated inconsistently or if it disappears when auth IS implemented.

Key facts from first audit:
- `getDemoUserId()` is duplicated identically in both `src/lib/db/items.ts` and `src/lib/db/collections.ts`
- `mockUser` from `src/lib/mock-data.ts` is still imported and used in `sidebar-nav.tsx` for the user avatar/name display — real user data not yet wired there
- Dashboard layout calls `getDemoUserId()` indirectly through 4 separate DB helper functions, each making their own DB lookup for the same user
- `getRecentCollections` and `getSidebarCollections` both fetch ALL items per collection (via nested include) just to compute dominant type color — expensive for collections with many items
- No API routes exist yet — this is a server-component-only codebase at this stage
- `src/lib/mock-data.ts` still has `mockItemTypes`, `mockCollections`, and `mockItems` that are no longer used by the dashboard but `mockUser` is still consumed by `sidebar-nav.tsx`
