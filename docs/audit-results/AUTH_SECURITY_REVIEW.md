# Auth Security Review

**Last audited:** 2026-05-09
**Scope:** NextAuth v5 credentials + GitHub, email verification, forgot/reset password, profile page (incl. uncommitted change-password / delete-account)
**Auditor:** auth-auditor agent

## Summary

- Critical: 0 · High: 2 · Medium: 4 · Low: 2
- Most urgent action: Reset-password and change-password do not actually invalidate other live JWT sessions — `prisma.session.deleteMany` is a no-op under `session.strategy: "jwt"`. A stolen session cookie keeps working until natural expiry even after a password reset.

---

## 🔴 CRITICAL

No issues found in this category.

---

## 🟠 HIGH

### Reset-password "session invalidation" is a no-op under JWT strategy

- **File:** `src/app/api/auth/reset-password/route.ts:57`
- **Problem:** The reset endpoint calls `prisma.session.deleteMany({ where: { userId: user.id } })` to invalidate other active sessions. But `src/auth.ts:12` sets `session: { strategy: "jwt" }`, so NextAuth never writes to the `Session` table — the JWT cookie is self-contained and cryptographically validated without a DB lookup. As a result, an attacker (or an old browser, or a stolen cookie) holding a JWT issued **before** the password reset continues to authenticate until natural token expiry. The visible "we revoked everything" outcome is a false sense of security on a critical recovery flow.
- **Evidence:**
  ```ts
  // src/auth.ts:12
  session: { strategy: "jwt" },
  ```
  ```ts
  // src/app/api/auth/reset-password/route.ts:51-59
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true });
  ```
- **Fix:** Either (a) switch credentials accounts to database sessions, or (b) implement a server-side invalidation signal that the JWT callback honours. The smallest practical fix is to add a `passwordChangedAt` (or `tokenVersion`) column on `User`, embed it in the JWT, and reject tokens whose embedded value is older than the DB value:
  ```ts
  // schema.prisma
  passwordChangedAt DateTime @default(now())
  ```
  ```ts
  // src/auth.ts callbacks
  jwt({ token, user, trigger }) {
    if (user) { token.id = user.id; token.pwAt = (user as { passwordChangedAt?: Date }).passwordChangedAt?.getTime(); }
    return token;
  },
  async session({ session, token }) {
    if (token.id) {
      const u = await prisma.user.findUnique({ where: { id: token.id as string }, select: { passwordChangedAt: true } });
      if (!u || (token.pwAt && u.passwordChangedAt.getTime() > (token.pwAt as number))) return null as never;
      session.user.id = token.id as string;
    }
    return session;
  }
  ```
  Bump `passwordChangedAt` to `new Date()` whenever the password is updated in the reset and change-password handlers.

### Change-password endpoint does not invalidate other sessions

- **File:** `src/app/api/auth/change-password/route.ts:63-69`
- **Problem:** After verifying the current password and writing the new hash, the route returns 200 without invalidating any other token. Combined with the JWT strategy (above), a session that was already compromised remains valid even after the user "rotated" their password from the profile page. OWASP's Authentication / Session Management guidance treats invalidation of other live sessions on credential change as a baseline expectation.
- **Evidence:**
  ```ts
  // src/app/api/auth/change-password/route.ts:63-69
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ ok: true });
  ```
- **Fix:** Use the same `passwordChangedAt`/`tokenVersion` mechanism proposed above and bump it on a successful change, which forces every other JWT for this user to be rejected on its next request. A weaker stop-gap (still better than nothing) is to also call `prisma.session.deleteMany` once DB sessions are in place.

---

## 🟡 MEDIUM

### Deleting an account does not invalidate other live JWTs

- **File:** `src/app/api/auth/delete-account/route.ts:32-34`
- **Problem:** The handler calls `prisma.user.delete(...)` and returns 200; the client then calls `signOut()` to clear its own cookie. Because sessions are JWT, any *other* device still holding a JWT for the now-deleted user remains "authenticated" until the token's natural expiry. `auth()` only inspects the JWT, so `/dashboard` and the proxy guard at `src/proxy.ts:9` continue to admit the request. The data fetches will return empty/404 (the user row is gone), but the user is, from the auth-state perspective, still logged in.
- **Evidence:**
  ```ts
  // src/app/api/auth/delete-account/route.ts:32-34
  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
  ```
  ```ts
  // src/components/profile/delete-account-dialog.tsx:63-65
  toast.success("Account deleted");
  await signOut({ callbackUrl: "/sign-in" });
  ```
- **Fix:** Same `passwordChangedAt`/`tokenVersion` pattern from the High findings — when the user no longer exists, the `session()` callback should return `null` so the proxy redirects to `/sign-in`. As an additional defence, have the route call `signOut({ redirect: false })` server-side before the delete, or clear the `authjs.session-token` cookie in the response.

### No rate limiting on register, sign-in, forgot-password, or reset-password endpoints

- **Files:**
  - `src/app/api/auth/register/route.ts:15`
  - `src/app/api/auth/forgot-password/route.ts:8`
  - `src/app/api/auth/reset-password/route.ts:12`
  - `src/app/api/auth/change-password/route.ts:12`
- **Problem:** Only the resend-verification (`src/app/api/auth/resend-verification/route.ts:32`) and forgot-password (`src/app/api/auth/forgot-password/route.ts:27`) flows enforce a 60 s per-email DB cooldown. `register`, `reset-password`, `change-password`, and credentials sign-in (which goes through NextAuth) accept unlimited submissions per IP. That permits credential stuffing on sign-in, password-guessing on `change-password` (`bcrypt.compare` is the only gate), and email enumeration on `register` via the 409 response.
- **Evidence:**
  ```ts
  // src/app/api/auth/register/route.ts:44-47 — no rate limit; 409 on duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  ```
  ```ts
  // src/app/api/auth/change-password/route.ts:58-61 — unlimited current-password guesses
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }
  ```
- **Fix:** Add an IP- and email-keyed rate limit (Upstash Ratelimit, `@vercel/firewall`, or a small Postgres-backed counter) in front of these endpoints — e.g. 5 attempts per email per 15 min on sign-in/change-password, 5 registrations per IP per hour. Optionally, replace the `register` 409 with the same generic OK pattern used on `forgot-password` to avoid email enumeration (with a follow-up email saying "we already have an account for this address").

### `register` reveals account existence (email enumeration)

- **File:** `src/app/api/auth/register/route.ts:44-47`
- **Problem:** Returning a distinct 409 + "An account with this email already exists" lets an attacker enumerate registered email addresses by simply attempting registration. This is a soft leak (the account-creation pathway is unauthenticated and unrate-limited), and combined with the absence of rate limiting (above) it is trivially scriptable.
- **Evidence:**
  ```ts
  // src/app/api/auth/register/route.ts:44-47
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  ```
- **Fix:** Mirror the pattern used by `forgot-password` — return `{ ok: true }` and (out of band) email the existing user with a "someone tried to re-register your address; sign in here / reset your password here" notice. If retaining the 409 is preferred for UX, gate it behind a CAPTCHA and IP rate limit.

### `consumeVerificationToken` does not reject password-reset-prefixed identifiers

- **File:** `src/lib/auth/verification-token.ts:30-46`
- **Problem:** `consumePasswordResetToken` (`src/lib/auth/password-reset-token.ts:43`) correctly checks that the identifier starts with `pwreset:`. The verification-side helper does *not* check the inverse — it happily consumes (deletes) any row in the `verification_tokens` table whose `token` hash matches, including a live password-reset token. Hitting `/api/auth/verify?token=<a-leaked-pwreset-token>` will delete that row before the `prisma.user.findUnique({ where: { email: "pwreset:..." } })` lookup falls through to `verify=invalid`, rendering the legitimate reset link unusable. The redirect tells the user "verify=invalid", not "we just burned your reset link". Real-world impact requires the attacker to already have the reset token (so they could just use it directly), but it lets an attacker who intercepts the email link cancel it without revealing they did so, and it muddies post-incident forensics.
- **Evidence:**
  ```ts
  // src/lib/auth/verification-token.ts:35-46
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });

  if (!record) return { ok: false, reason: "invalid" };

  await prisma.verificationToken.delete({ where: { token: tokenHash } });

  if (record.expires < new Date()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, email: record.identifier };
  ```
- **Fix:** Add the same prefix discriminator the password-reset helper uses, but in reverse — reject any record whose identifier starts with `pwreset:` *before* deleting:
  ```ts
  if (!record || record.identifier.startsWith("pwreset:")) {
    return { ok: false, reason: "invalid" };
  }
  ```
  Move the prefix string to a shared constant exported from one of the two helpers so both flows agree.

---

## 🟢 LOW

### Resend-verification cooldown can be bypassed by registering twice with the same email

- **File:** `src/app/api/auth/register/route.ts:62-69`
- **Problem:** `register` always issues a new verification token (deleting any existing one — see `createVerificationToken` at `src/lib/auth/verification-token.ts:18`). The 60 s `canResendVerification` cooldown is enforced only on `/api/auth/resend-verification`, not on `/api/auth/register`. Because the duplicate-email check returns 409 *before* the token write, this isn't directly exploitable today — but if the 409 enumeration leak is fixed by switching to a generic OK with subsequent token re-issue, the cooldown will silently disappear for the register path. Worth tightening pre-emptively given the previous finding's recommended fix.
- **Evidence:**
  ```ts
  // src/lib/auth/verification-token.ts:18-21
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });
  ```
- **Fix:** When (and if) `register` becomes idempotent for existing-email cases, add `canResendVerification(email)` before issuing a fresh token. Same for any future "add password to OAuth account" flow that may want to reuse this helper.

### Verification token email link is sent over GET with side effects

- **File:** `src/app/api/auth/verify/route.ts:11-34`
- **Problem:** The verify endpoint is a GET that mutates state (sets `emailVerified`) and consumes the token. This is the conventional pattern for email-link verification (POST-from-email isn't viable), and it is bounded by single-use + expiry, so it is acceptable. Flagging only as a defense-in-depth note: any third-party Referer leakage of the link (forwarded email, link previews, etc.) leaks the raw token, which is then exchangeable for verification once. No fix recommended unless you adopt a two-step "click → confirm POST" pattern; if so, also add `Referrer-Policy: no-referrer` on the verification page.
- **Evidence:**
  ```ts
  // src/app/api/auth/verify/route.ts:11-34
  export async function GET(req: Request) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const result = await consumeVerificationToken(token);
    ...
  ```
- **Fix:** Optional — render an interstitial `/verify-email/confirm?token=...` page that submits a POST to `/api/auth/verify` on user click, and serve the page with `Referrer-Policy: no-referrer`. Low priority.

---

## ✅ Passed Checks

The following auth-security practices are correctly implemented in the codebase:

- bcrypt cost factor is **12** on register, reset-password, and change-password (`src/app/api/auth/register/route.ts:49`, `src/app/api/auth/reset-password/route.ts:51`, `src/app/api/auth/change-password/route.ts:63`)
- Password comparison uses `bcrypt.compare` (constant-time) on credentials sign-in and change-password, never `===` (`src/auth.ts:31`, `src/app/api/auth/change-password/route.ts:58`)
- New password length and confirmation are validated server-side on register, reset-password, and change-password (`src/app/api/auth/register/route.ts:36-42`, `src/app/api/auth/reset-password/route.ts:27-32`, `src/app/api/auth/change-password/route.ts:36-45`)
- `User.password` is never selected into a response payload — `getProfileData` selects it only to derive `hasPassword: user.password !== null` and discards the raw value (`src/lib/db/profile.ts:32-70`)
- Verification and password-reset tokens are generated with `crypto.randomBytes(32)` and stored as **sha256 hashes** in the DB (`src/lib/auth/verification-token.ts:14-21`, `src/lib/auth/password-reset-token.ts:19-25`)
- Tokens are single-use: deleted from the DB before the expiry check, so even an expired-but-replayed token cannot be re-consumed (`src/lib/auth/verification-token.ts:40`, `src/lib/auth/password-reset-token.ts:47`)
- TTLs are reasonable: verification 24 h, password reset 1 h (`src/lib/auth/verification-token.ts:5`, `src/lib/auth/password-reset-token.ts:5`)
- The shared `verification_tokens` table is namespaced via the `pwreset:` identifier prefix, and `consumePasswordResetToken` rejects rows lacking that prefix (`src/lib/auth/password-reset-token.ts:7,43-45`)
- Resend cooldowns of 60 s are enforced on resend-verification and forgot-password (`src/app/api/auth/resend-verification/route.ts:32-38`, `src/app/api/auth/forgot-password/route.ts:27-33`, `src/lib/auth/verification-token.ts:48-58`)
- `forgot-password` returns generic `{ ok: true }` for unknown emails AND for OAuth-only accounts (no `User.password`), preventing both enumeration and account-takeover-by-binding-a-password (`src/app/api/auth/forgot-password/route.ts:21-25`)
- `resend-verification` returns generic `{ ok: true }` for unknown emails, already-verified users, and when the verification flag is off — no enumeration (`src/app/api/auth/resend-verification/route.ts:22-30`)
- Credentials `authorize` returns `null` for unverified users when `EMAIL_VERIFICATION_ENABLED` is enabled, gating it via the config helper for a single source of truth (`src/auth.ts:34`, `src/lib/config.ts:14`)
- `change-password` requires the **current** password before accepting a new one (`src/app/api/auth/change-password/route.ts:58-61`)
- `change-password` refuses to set a password on accounts that don't already have one (no GitHub-only takeover via this route), and the UI hides the affordance via `hasPassword` (`src/app/api/auth/change-password/route.ts:51-56`, `src/app/profile/page.tsx:130`, `src/components/profile/profile-actions.tsx:21`)
- `delete-account` requires the user to type their email exactly to confirm (server-side and client-side checks both compare normalized lowercase) (`src/app/api/auth/delete-account/route.ts:22-30`, `src/components/profile/delete-account-dialog.tsx:35`)
- Profile page calls `auth()` and redirects unauthenticated users; profile data is fetched scoped to `session.user.id` (no IDOR) (`src/app/profile/page.tsx:33-37`, `src/lib/db/profile.ts:29-55`)
- `change-password` and `delete-account` API routes both call `auth()` and require `session.user.id` before accepting input (`src/app/api/auth/change-password/route.ts:13-16`, `src/app/api/auth/delete-account/route.ts:10-13`)
- All `prisma.user.update({ data: ... })` call sites pass an explicit, narrow data object — no mass-assignment via `req.body` (`src/app/api/auth/verify/route.ts:28-31`, `src/app/api/auth/reset-password/route.ts:52-55`, `src/app/api/auth/change-password/route.ts:64-67`)
- JWT/session callbacks expose only `id`, never `password`, `stripeCustomerId`, or `stripeSubscriptionId` (`src/auth.ts:42-52`, `src/types/next-auth.d.ts:3-9`)
- Email casing is normalized (`trim().toLowerCase()`) on every input path that compares emails — register, sign-in, forgot-password, resend-verification, token identifiers, delete-account confirm — so cooldowns and unique constraints can't be bypassed via casing (`src/app/api/auth/register/route.ts:24`, `src/auth.ts:24`, `src/lib/auth/verification-token.ts:13`, `src/lib/auth/password-reset-token.ts:14`, `src/app/api/auth/delete-account/route.ts:22-23`)
- The Prisma schema cascades user deletion across `Account`, `Session`, `Item`, `Collection`, and `ItemType` via `onDelete: Cascade`, so `prisma.user.delete` cleans up all owned rows (`prisma/schema.prisma:52,64,104,128,149`)
- Verification token email body and password-reset email body do not log the raw token; the only place the raw token leaves the server is in the email URL (`src/lib/email/resend.ts:25,81`)
- No tokens, passwords, or other secrets are committed in `.env.example` (placeholders only)
- Resend send errors throw and are caught by the route handler — `forgot-password` and `resend-verification` return 500 / never claim success when send fails (`src/lib/email/resend.ts:70-73,126-129`, `src/app/api/auth/forgot-password/route.ts:35-41`, `src/app/api/auth/resend-verification/route.ts:40-46`)
- Auth-related pages (`/sign-in`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/profile`) are `force-dynamic` and call `auth()` server-side before rendering, with appropriate authed/unauthed redirects (`src/app/sign-in/page.tsx:7-15`, `src/app/register/page.tsx:6-14`, `src/app/forgot-password/page.tsx:7-14`, `src/app/reset-password/page.tsx:8-15`, `src/app/verify-email/page.tsx:8-15`, `src/app/profile/page.tsx:10,33-37`)
