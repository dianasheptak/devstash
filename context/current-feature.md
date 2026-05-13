# Current Feature

## Status

Not Started

## Goals

## Notes

## History

<!-- Keep this updated. Earliest to latest -->

### 2026-04-22 — Initial Next.js Setup
- Created Next.js 15 project with App Router, TypeScript, Tailwind CSS v4
- Added CLAUDE.md, AGENTS.md, and context files (project-overview, coding-standards, ai-interaction, current-feature)
- Removed default Next.js placeholder SVGs
- Pushed to GitHub: https://github.com/dianasheptak/devstash

### 2026-04-24 — Dashboard UI Phase 1
- Initialized shadcn/ui with Nova preset (Lucide + Geist), Button and Input components
- Added dark mode by default via `dark` class on `<html>`
- Created `/dashboard` route with layout: top bar (logo, search, New Item button) and sidebar/main placeholders
- Updated app metadata title to "DevStash"

### 2026-05-05 — Dashboard UI Phase 2
- Added collapsible desktop sidebar with `PanelLeftClose`/`PanelLeftOpen` toggle
- Added item type nav links (`/items/snippets`, `/items/prompts`, etc.) with type colors
- Favorite and recent collections in sidebar
- User avatar area at the bottom of the sidebar with name, email, and settings link
- Mobile drawer via shadcn Sheet component (hamburger in top bar)
- "Navigation" label left of the collapse icon in the sidebar toggle bar
- Centered search input in the header
- Favorite collections moved inside a collapsible "Collections" folder in the sidebar

### 2026-05-05 — Dashboard UI Phase 3
- Added 4 stats cards at the top (total items, collections, favorite items, favorite collections)
- Recent collections grid with favorite indicator and item count
- Pinned items section (conditional — renders only when pinned items exist)
- 10 most recent items grid with type icon/color, description, code preview, and tags
- Added shadcn Card and Badge components

### 2026-05-05 — Prisma + Neon PostgreSQL Setup
- Installed Prisma 7, `@prisma/adapter-pg`, `pg`, `dotenv`, `tsx`
- Created `prisma/schema.prisma` with Prisma 7 generator (`prisma-client`, mandatory output) and full schema: User, Item, ItemType, Collection, ItemCollection, Tag, and NextAuth models
- Created `prisma.config.ts` with datasource URL, migrations path, and seed command (Prisma 7 pattern)
- Created `src/lib/prisma.ts` singleton using `PrismaPg` driver adapter (required in Prisma 7)
- Created `prisma/seed.ts` to seed 7 system item types
- Created migration `20260505160854_init` and applied to Neon dev branch
- Seeded system item types successfully

### 2026-05-05 — Seed Data
- Installed bcryptjs for password hashing
- Rewrote prisma/seed.ts with demo user (demo@devstash.io, bcrypt 12 rounds) and 5 collections
- React Patterns: 3 TypeScript snippets (useDebounce, Context provider, utility functions)
- AI Workflows: 3 prompts (code review, documentation generator, refactoring assistant)
- DevOps: 1 snippet (Dockerfile), 1 command (deploy chain), 2 links (Docker, GitHub Actions)
- Terminal Commands: 4 commands (git, docker, process management, npm utilities)
- Design Resources: 4 links (Tailwind, shadcn/ui, Radix UI, Lucide)
- Seed is idempotent — cleans demo user data before recreating

### 2026-05-06 — Dashboard Collections — Real Data
- Created `src/lib/db/collections.ts` with `getRecentCollections()` and `getCollectionStats()`
- `getRecentCollections()` fetches 6 most recent collections with items and types included, computes dominant type color and unique type icons per collection
- Dashboard page made async server component with `force-dynamic` to prevent stale static caching
- CollectionCard updated with colored `border-l-[3px]` from dominant type and small type icons in card footer
- Collections and Favorite Collections stat cards now use real DB counts

### 2026-05-06 — Dashboard Items — Real Data
- Created `src/lib/db/items.ts` with `getPinnedItems()`, `getRecentItems()`, and `getItemStats()`
- All three functions scope to the demo user and include `itemType` and `tags` relations
- Dashboard page now fetches all five data sources in parallel via `Promise.all`
- Removed `mockItems` dependency from dashboard page; Total Items and Favorite Items stats now use real DB counts
- `ItemCard` component updated to accept `ItemWithMeta` type (tags as `string[]`)

### 2026-05-06 — Stats & Sidebar — Real Data
- Added `getSidebarCollections()` to `src/lib/db/collections.ts` — returns collections with `dominantColor` from most-used item type
- Added `getSystemItemTypes()` to `src/lib/db/items.ts` — fetches system types in display order with per-type item counts via `groupBy`
- Converted `src/app/dashboard/layout.tsx` to async server component; fetches item types + sidebar collections in parallel and passes as props
- Updated `DashboardLayout` to accept and forward `itemTypes` and `collections` props to both desktop and mobile `SidebarNav`
- Replaced `mockItemTypes` and `mockCollections` in `SidebarNav` with real props
- Recent collections show a colored circle (dominant type color) instead of a clock icon
- Each item type in the sidebar shows its item count on the right
- Restored Favorites quick-access link in the sidebar
- Added "View all collections →" link below the sidebar collections list

### 2026-05-06 — Component Extraction + Code Quality Quick Wins
- Moved shared `ICON_MAP` constant to `src/lib/constants/item-types.ts` — removed duplication from `page.tsx` and `sidebar-nav.tsx`
- Extracted `SectionHeading` → `src/components/shared/section-heading.tsx`
- Extracted `ItemCard` → `src/components/items/item-card.tsx`
- Extracted `CollectionCard` → `src/components/collections/collection-card.tsx`
- Fixed `ml-auto` collision in `ItemCard` — Star + Pin icons now share a single `ml-auto` wrapper so they render side-by-side correctly when an item is both favorited and pinned
- `dashboard/page.tsx` reduced from 200 lines to 70 — now only data-fetching and layout

### 2026-05-06 — Pro Badge in Sidebar + Header Buttons
- Added `isPro` prop to `NavItem` in `sidebar-nav.tsx`; renders a subtle shadcn `Badge` (secondary, dimmed) with uppercase "PRO" text next to Files and Images types
- Fixed Collections toggle: added `type="button"` and functional updater to resolve collapse not toggling on click
- Added "New Collection" outline button to the dashboard header alongside the existing "New Item" button

### 2026-05-08 — Auth Setup: NextAuth v5 + GitHub OAuth
- Installed `next-auth@5.0.0-beta.31` and `@auth/prisma-adapter@2.11.2`
- Split auth config: `src/auth.config.ts` (edge-safe, GitHub provider + `authorized` callback) and `src/auth.ts` (Prisma adapter + JWT strategy + `jwt`/`session` callbacks injecting `user.id`)
- Created API route handler at `src/app/api/auth/[...nextauth]/route.ts` re-exporting `GET`/`POST` from `handlers`
- Created `src/proxy.ts` (Next.js 16 proxy) — named `proxy = auth` export, matcher locked to `/dashboard/:path*`; unauthenticated users redirected to NextAuth's default sign-in page
- Extended `Session.user` with `id: string` and JWT with `id?: string` via module augmentation in `src/types/next-auth.d.ts`
- Added `.env.example` and a `!.env.example` exception in `.gitignore`

### 2026-05-08 — Auth Phase 2: Credentials Provider + Register API
- Added `Credentials` provider placeholder to `src/auth.config.ts` (edge-safe, `authorize: async () => null`) so the proxy/edge bundle stays bcrypt/Prisma-free
- Overrode `Credentials` in `src/auth.ts`: filters the placeholder out of `authConfig.providers` and re-registers with real `authorize` — lowercase/trim email, `prisma.user.findUnique`, `bcrypt.compare`, returns `{ id, email, name, image }`
- Created `POST /api/auth/register` at `src/app/api/auth/register/route.ts` — validates name/email/password/confirmPassword (regex email, ≥8 chars, match check), 409 on duplicate email, hashes with `bcrypt.hash(password, 12)`, returns `{ user: { id, email, name } }` on 201
- No DB migration needed — `User.password String?` already existed in schema
- Verified: `/api/auth/providers` lists both `github` and `credentials`; sign-in via `/api/auth/callback/credentials` issues `authjs.session-token` with `user.id`; `/dashboard` returns 200 with cookie; wrong password yields null session; all validation paths (duplicate, mismatch, short pw, missing field, bad email) return correct errors

### 2026-05-08 — Auth Phase 3: Custom Auth UI + Sidebar User Menu + Toasts
- Wired `pages.signIn = "/sign-in"` in `src/auth.config.ts` so the proxy and `auth()` redirects target the custom dark page (no more default white NextAuth page)
- Built `/sign-in`, `/register`, `/profile` as server components with `force-dynamic`; each calls `auth()` and redirects authed (sign-in/register) or unauthed (profile) users
- Extracted client form components: `src/components/auth/sign-in-form.tsx` (credentials + inline GitHub brand SVG since lucide-react dropped `Github`; uses `signIn` from `next-auth/react`) and `src/components/auth/register-form.tsx` (validation, `POST /api/auth/register`, redirects to `/sign-in?registered=1`)
- Added reusable `UserAvatar` (`src/components/shared/user-avatar.tsx`) with `getInitials()` helper at `src/lib/initials.ts` — image-or-initials fallback, "Brad Traversy" → "BT"
- Added `UserMenu` (`src/components/layout/user-menu.tsx`) — sidebar bottom area with avatar linking to `/profile`, chevron-toggled upward popover (Profile + Sign out), pointerdown-outside + Escape close
- Removed `mockUser` from `SidebarNav`; `dashboard/layout.tsx` calls `auth()` and forwards real `user` through `DashboardLayout` to both desktop and mobile `SidebarNav`
- Installed `sonner` and added `<Toaster theme="dark" position="top-right" richColors closeButton />` to root layout
- Toasts: sign-in success "Welcome back!", sign-in failure "Invalid email or password", register validation/server errors, and one-shot "Account created — sign in to continue" on `/sign-in?registered=1` (deduped via stable `id: "registered"` to survive React StrictMode double-effect)
- All four auth-adjacent pages render dynamically; smoke-tested HTTP: `/sign-in` 200, `/register` 200, `/dashboard` and `/profile` redirect to `/sign-in?callbackUrl=...` when unauthed, `/sign-in` redirects to `/dashboard` when authed

### 2026-05-08 — Email Verification on Register (Resend)
- Installed `resend@6.12.3`; added `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` to `.env.example`
- `src/lib/email/resend.ts` — Resend client + `sendVerificationEmail()` (HTML + text), default sender `DevStash <onboarding@resend.dev>` overridable via `EMAIL_FROM`
- `src/lib/auth/verification-token.ts` — `createVerificationToken`, `consumeVerificationToken`, `canResendVerification`. Tokens are 32 random bytes, **stored as sha256 hashes** in `VerificationToken.token` (no schema change), single-use, 24h TTL, 60s resend cooldown
- `POST /api/auth/register` — issues token + sends verification email after user creation; failures logged but don't block registration; redirects user to `/verify-email?email=<email>`
- `GET /api/auth/verify?token=...` — consumes token, sets `User.emailVerified`, redirects to `/sign-in?verify=success|expired|invalid`
- `POST /api/auth/resend-verification` — generic-OK responses for non-existent/already-verified emails (no enumeration), 429 on cooldown
- `src/auth.ts` credentials `authorize` — returns `null` when `emailVerified === null` (GitHub OAuth path untouched; Auth.js sets `emailVerified` automatically for OAuth)
- New `/verify-email` page (`src/app/verify-email/page.tsx` + `src/components/auth/verify-email-card.tsx`) — "Check your email" card showing the user's address with mail icon, "Resend verification email" button, and "Sign in" link; redirects to `/dashboard` if already authed
- Sign-in form: refs + `autoComplete="off"` on form + `autoComplete="new-password"` on password + 50ms post-mount DOM `.value` clear to defeat browser autofill on every visit; toasts on `?verify=success|expired|invalid`
- Demo user (`demo@devstash.io`) already seeded with `emailVerified: new Date()` so credentials sign-in still works
- Added `scripts/purge-non-demo-users.ts` — destructive script to delete all non-demo users + their cascading data; dry-run by default, `--yes` flag required to actually delete; refuses to run if demo user is missing

### 2026-05-08 — Email Verification Feature Flag
- Added `src/lib/config.ts` with `isEmailVerificationEnabled()` — single source of truth that reads `EMAIL_VERIFICATION_ENABLED`. Narrow parser: `true|1|yes` → enabled, `false|0|no` → disabled, anything else → default. Default is `true` (fail-closed); `server-only`
- `.env.example` documents the new var alongside Resend config
- `POST /api/auth/register` branches on the flag — when disabled, sets `emailVerified: new Date()` on user create, skips token issuance + email send. Always returns `{ user, verificationRequired }` so the client can route correctly
- `register-form.tsx` reads `verificationRequired` from the response: `/verify-email?email=…` when true, `/sign-in?registered=1` when false
- `sign-in-form.tsx` — restored the `?registered=1` "Account created — sign in to continue" toast for the disabled-flag flow (the `?verify=*` toasts remain)
- `src/auth.ts` credentials `authorize` — `emailVerified` check now gated behind `isEmailVerificationEnabled()`, so existing unverified users can sign in immediately when the flag is flipped off
- `POST /api/auth/resend-verification` — short-circuits to generic `{ ok: true }` when the flag is disabled, so the endpoint reveals nothing about the flag's state
- No code/DB changes required to flip — set `EMAIL_VERIFICATION_ENABLED=false` in `.env` and restart. Resend stays in the codebase as a runtime switch, not a removal

### 2026-05-08 — Forgot Password Flow
- `src/lib/auth/password-reset-token.ts` — `createPasswordResetToken`, `consumePasswordResetToken`, `canResendPasswordReset`. 32 random bytes, **stored as sha256 hashes** in `VerificationToken.token`, single-use, 1h TTL, 60s cooldown. Identifier prefixed with `pwreset:` to share the table with verification tokens; consume rejects rows whose identifier doesn't carry the prefix
- `sendPasswordResetEmail()` added to `src/lib/email/resend.ts` — reuses Resend client + `EMAIL_FROM`; subject "Reset your DevStash password"; HTML + text body
- `POST /api/auth/forgot-password` — generic `{ ok: true }` for unknown emails or users without a password (no enumeration, no account-takeover for OAuth-only accounts), 429 on cooldown, 500 if Resend send fails
- `POST /api/auth/reset-password` — validates `password` ≥8 chars + match, consumes token, `bcrypt.hash(password, 12)`, invalidates all other DB sessions for the user (`prisma.session.deleteMany`), returns `{ ok: true }` or `{ error, reason: "invalid"|"expired" }`
- `/forgot-password` page (server component, redirects to `/dashboard` if authed) + `ForgotPasswordForm` — email validation, post-submit "If an account exists for X, we've sent…" confirmation card + back-to-sign-in link
- `/reset-password` page + `ResetPasswordForm` — reads `?token=` from URL, missing-token state with link to `/forgot-password`, anti-autofill (refs + `autoComplete="off"` form + 50ms post-mount DOM `.value` clear) matching sign-in flow, success → `/sign-in?reset=success`, expired/invalid → `/sign-in?reset=expired|invalid`
- `sign-in-form.tsx` — added "Forgot password?" link beside the password label, plus `?reset=success|expired|invalid` toasts (alongside the existing `?registered=1` and `?verify=*` toasts)
- No DB migration — reuses the existing `VerificationToken` table via the `pwreset:` identifier prefix

### 2026-05-09 — Profile Page + Auth Hardening
- `/profile` page (`src/app/profile/page.tsx`) — identity (avatar via `UserAvatar`, name, email, account creation date), per-type usage stats for all 7 system types via new `getProfileData()` in `src/lib/db/profile.ts` (selects `User.password` only to derive `hasPassword`)
- `src/components/profile/` — `ProfileActions` orchestrator + `ChangePasswordDialog` (only renders when `hasPassword`) + `DeleteAccountDialog` (typed-email confirmation)
- New `src/components/ui/dialog.tsx` (Radix-based shadcn dialog primitive)
- `POST /api/auth/change-password` — `auth()` gate, current-password check via `bcrypt.compare`, refuses to set a password on accounts that don't already have one, bumps `passwordChangedAt`
- `POST /api/auth/delete-account` — `auth()` gate, requires typed email match (case-normalized), `prisma.user.delete` cascades to all owned rows; client calls `signOut({ callbackUrl: "/sign-in" })`
- **Auth hardening (auth-auditor sweep):** added `User.passwordChangedAt` (migration `20260509150615_add_password_changed_at`) + embedded `pwAt` in JWT; `session()` callback now rejects deleted users and tokens minted before the latest password change. Reset-password no longer calls the no-op `prisma.session.deleteMany` under JWT strategy and bumps `passwordChangedAt` instead. `consumeVerificationToken` rejects rows whose identifier carries the shared `PASSWORD_RESET_IDENTIFIER_PREFIX` so the verify endpoint cannot burn a live reset token. Register no longer leaks account existence: existing-email path returns the same generic 201 `{ verificationRequired }` shape, no token issued or email sent; new-user path gates token issuance on `canResendVerification`
- Added `.claude/agents/auth-auditor.md` (sonnet subagent scoped to NextAuth v5 gaps, with explicit "do not flag" list) and `docs/audit-results/AUTH_SECURITY_REVIEW.md` (overwritten on each run)
- Rate limiting on register / sign-in / change-password / reset-password is **deferred** — Medium-severity finding remains open for a follow-up
- Existing JWTs without `pwAt` are treated as stale by the session callback, so all currently-signed-in users will need to re-authenticate once after this deploy

### 2026-05-09 — Rate Limiting on Auth Endpoints (Upstash)
- Installed `@upstash/ratelimit` and `@upstash/redis`; added `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to `.env.example` (leaving them blank disables limiting)
- New `src/lib/rate-limit.ts` — lazy Upstash client + five named sliding-window limiters: `login` (5/15min), `register` (3/1h), `forgotPassword` (3/1h), `resetPassword` (5/15min), `resendVerification` (3/15min). Per-limiter Redis key prefixes prevent cross-route counter collisions
- Helpers: `getClientIp()` reads `x-forwarded-for` (first hop) then `x-real-ip` then `"unknown"`; `checkRateLimit()` returns `{ success, remaining, reset, retryAfterSeconds }`; `rateLimitedResponse()` returns 429 + JSON `{ error }` + `Retry-After` header. Module is `server-only`
- **Fail-open**: missing env vars or limiter exceptions return `{ success: true }` so a Redis outage cannot lock users out of auth
- `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password` gated by IP-keyed checks at the top of POST. `/api/auth/resend-verification` keyed by `${ip}:${email}` and placed before the `EMAIL_VERIFICATION_ENABLED` short-circuit so the disabled-flag deploy still rate-limits
- Login limiting wired into the credentials `authorize()` callback in `src/auth.ts` — keyed by `${ip}:${email}`. Throws `RateLimitedError extends CredentialsSignin` with `code = "RateLimitExceeded"`; NextAuth surfaces this as `result.code` to the client
- `sign-in-form.tsx` — `result.code === "RateLimitExceeded"` maps to "Too many login attempts. Please try again in a few minutes."; falls back to the existing generic "Invalid email or password" otherwise (secure failure mode if the code isn't surfaced)
- Other forms (register / forgot / reset / resend) already piped `data?.error` to a `toast.error`, so the 429 message renders without UI changes
- Closes the Medium-severity rate-limiting finding deferred from the 2026-05-09 auth-hardening sweep

### 2026-05-13 — Items List View
- New dynamic route `/items/[type]` (`src/app/items/[type]/page.tsx`) — server component, `force-dynamic`, validates slug via `slugToTypeName`, `notFound()` on invalid
- `src/app/items/layout.tsx` — wraps `/items/*` in `DashboardLayout` with sidebar (item types + collections), redirects unauthed users to `/sign-in?callbackUrl=/dashboard`
- `src/proxy.ts` matcher extended to `/items/:path*` so auth gating covers the new route
- `getItemsByType()` added to `src/lib/db/items.ts` — scoped to demo user, system-type-only filter, ordered by `isPinned desc` then `createdAt desc`
- `ITEM_TYPE_NAMES`, `ItemTypeName`, and `slugToTypeName()` helper added to `src/lib/constants/item-types.ts` (plural slug → singular type name; null for unknown)
- Header shows type-colored icon, plural label, and item count; empty state is a dashed-border placeholder; grid is 1 column on mobile, 2 at `md+`; reuses existing `ItemCard` so type-colored left border carries over

### 2026-05-13 — Vitest Setup
- Installed `vitest@^4.1.6` as a dev dependency; added `npm run test` (watch) and `npm run test:run` (CI) scripts
- `vitest.config.ts` — node environment, `resolve.tsconfigPaths: true` (Vitest 4 native — no `vite-tsconfig-paths` plugin needed), `include: ['src/**/*.{test,spec}.ts']`, `.tsx` test files explicitly excluded
- **Scope:** server actions and utilities only. Components are intentionally not unit-tested
- Seed tests co-located with source: `src/lib/initials.test.ts` (4 cases on `getInitials`) and `src/lib/constants/item-types.test.ts` (3 cases on `slugToTypeName`). All 6 tests pass
- Updated `CLAUDE.md` (commands + testing scope) and `context/ai-interaction.md` (workflow step 4 now requires tests when touching `src/lib/**`; new "Testing" section; commit gate requires tests passing)

### 2026-05-13 — Item Drawer
- Right-side slide-in drawer (shadcn Sheet, capped `max-w-xl`) for item detail; opens on `ItemCard` click across `/dashboard` and `/items/*` — no separate item page
- `src/components/items/item-drawer-context.tsx` — client React context with `{ openItemId, open, close }`; `ItemDrawerProvider` mounted once in `DashboardLayout`
- `src/components/items/item-drawer.tsx` — Sheet renders skeleton while fetching, then header (type icon + title + type/language badges), action bar (Copy / Favorite / Pin / Edit / Delete with Delete right-aligned), and sections for Description / Content (TEXT) / URL / File / Tags / Collections. Only Copy is wired (`navigator.clipboard` + sonner toast); other actions are placeholders per spec
- `ItemCard` promoted to `"use client"` and now calls `useItemDrawer().open(item.id)` on click; added subtle `hover:ring-1`
- `src/lib/db/items.ts` — new `ItemDetail` type and `getItemDetailById(id)` returning full content + language + file fields + joined collections; scoped to demo user matching the rest of the module
- `GET /api/items/[id]` (`src/app/api/items/[id]/route.ts`) — `auth()`-gated, returns `{ item }` or 401/404; powers the drawer's fetch-on-click
- `DashboardLayout` wraps children in `<ItemDrawerProvider>` and mounts `<ItemDrawer />` once so both dashboard and items routes get the drawer for free

### 2026-05-13 — Item Drawer Edit Mode
- Edit button in the item drawer toggles into inline edit mode; action bar becomes Save / Cancel (Save disabled when title is empty or pending)
- Editable fields: title (required), description, tags (comma-separated); type-specific Content (snippet/prompt/command/note), Language (snippet/command), URL (link); item type, collections, and timestamps are read-only
- `src/lib/validation/item.ts` — `updateItemSchema` (Zod): trims/nulls empty strings, validates `http(s)://` URL, splits/trims tags and drops empties. Extracted to its own module so Vitest can import it without pulling in the NextAuth/edge import chain
- `src/lib/validation/item.test.ts` — 7 Vitest cases covering title trim/required, tag normalization, URL valid/invalid/empty, default nulls
- `src/actions/items.ts` — `updateItem(itemId, input)` server action: `auth()` gate, `safeParse` with `updateItemSchema`, calls `updateItem` query, returns `{ success, data, error }` and surfaces the first Zod issue as the error message
- `src/lib/db/items.ts` — new `updateItem(itemId, data)` query: ownership check via `findFirst({ id, userId })`, `prisma.item.update` with `tags: { set: [], connectOrCreate }` for replace-on-update semantics; returns refreshed `ItemDetail` via `getItemDetailById`
- `item-drawer.tsx` — new `DrawerEdit` view with controlled inputs and `useTransition`; toasts on save success/error and calls `router.refresh()` so the underlying card list reflects changes
- Installed `zod@^4.4.3`; added `src/components/ui/textarea.tsx` via shadcn
- All 13 Vitest tests pass; `npm run build` green

### 2026-05-13 — Item Delete
- `src/lib/db/items.ts` — `deleteItem(itemId)` query: ownership check via `findFirst({ id, userId })`, then `prisma.item.delete`. `ItemCollection` join rows cascade automatically; tags are M:N and untouched
- `src/actions/items.ts` — `deleteItem(itemId)` server action: `auth()` gate, id validation, calls db query, returns `{ success: true, data: { id } }` or `{ success: false, error }`
- `src/components/ui/alert-dialog.tsx` — added via shadcn CLI
- `src/components/items/item-drawer.tsx` — Delete button now opens an `AlertDialog` confirmation (destructive variant on the confirm button, item title quoted in the description). On confirm: invokes the server action inside a `useTransition`, toasts success/error, closes the drawer, and calls `router.refresh()` so the underlying list updates
- `cursor-pointer` added to all action-bar buttons (Copy / Favorite / Pin / Edit / Delete), edit-mode Save / Cancel, and the AlertDialog Cancel / Delete buttons
- `src/actions/items.test.ts` — 5 Vitest cases covering the new action (unauthorized, invalid id, not-found, success, db exception); mocks `@/auth` and `@/lib/db/items` at the import boundary
- All 18 Vitest tests pass; `npm run build` green

### 2026-05-13 — Code Editor (Monaco)
- Installed `@monaco-editor/react`; created `src/components/items/code-editor.tsx` — client component wrapping Monaco with VS Dark theme, macOS window dots (red/yellow/green), language label, copy button, dynamic height (min 80px, max 400px via `onDidContentSizeChange`), thin scrollbars
- `item-drawer.tsx` — display mode replaces `<pre>` with `<CodeEditor readOnly>` for snippet/command types; edit mode replaces `<Textarea>` with `<CodeEditor>` for snippet/command; prompt/note keep `<Textarea>`; `isCodeType` guard defined once at module scope
- `create-item-dialog.tsx` — Language field moved before Content for snippet/command; Content field uses `<CodeEditor>` for snippet/command (language prop wired so syntax highlighting updates live as user types the language); dialog widened to `max-w-2xl`; `defaultType` prop + `useEffect` to sync type when dialog opens
- `create-item-context.tsx` — `CreateItemProvider` + `useCreateItem()` context; holds `isOpen`/`defaultType` state and renders `<CreateItemDialog>` once; replaces the ad-hoc `createOpen` state that was in `DashboardLayout`
- `DashboardLayout` refactored into outer `DashboardLayout` (wraps `ItemDrawerProvider` + `CreateItemProvider`) and inner `DashboardLayoutInner` (uses `useCreateItem().open()`); "New Item" header button calls `open()` with no type arg
- `add-type-button.tsx` — small client button using `useCreateItem().open(type)`; rendered in the `/items/[type]` page header for the 5 creatable types (snippet/prompt/command/note/link); absent for file/image (Pro types)
- All 32 Vitest tests pass; `npm run build` green

### 2026-05-13 — Item Create
- `src/lib/validation/item.ts` — added `createItemSchema` with `superRefine`: type is one of `snippet|prompt|command|note|link` (file/image excluded as Pro/file-upload not built), content required for non-link types, URL required + `http(s)://` validated for link; tags trimmed and de-duped of empties; `CREATABLE_ITEM_TYPES` exported for the UI
- `src/lib/db/items.ts` — `createItem(data)` query: resolves system `ItemType` by name, sets `contentType` (`URL` for link, `TEXT` otherwise), zeros out irrelevant fields per type (no `content` on link, no `url` on text types, `language` only for snippet/command), `connectOrCreate` tags; returns refreshed `ItemDetail`
- `src/actions/items.ts` — `createItem(input)` server action: `auth()` gate, `safeParse` with `createItemSchema`, surfaces first Zod issue, returns `ActionResult<ItemDetail>`
- `src/components/items/create-item-dialog.tsx` — shadcn Dialog client component with type chip selector (icon-colored), conditional fields (Content/Language for snippet+command/prompt+note, URL for link), controlled inputs, `useTransition`, toast on success, resets state on close, calls `router.refresh()`
- `src/components/layout/dashboard-layout.tsx` — "New Item" button now opens the dialog (state lifted to layout); dialog mounted once alongside `ItemDrawer`
- Tests: 8 new cases in `src/lib/validation/item.test.ts` (type enum, title required, content required for non-link, URL required+malformed for link, tag normalization) and 6 new in `src/actions/items.test.ts` (unauthorized, validation failures, success, null-from-query, db exception)
- All 32 Vitest tests pass; `npm run build` green
