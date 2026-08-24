# AGENTS.md — Session Expiry UX

## Purpose

Ensure an admin whose session expires mid-use is automatically returned to
login with their destination preserved, and that direct visits to admin pages
while logged out show a sign-in prompt instead of a broken admin shell.

This is a frontend-only slice spanning shared infrastructure (`lib/api.ts`),
the identity login/OTP flow, and the `(admin)` route shell. No backend changes.

**Tier 2 feature slice.** Load alongside this file:

* `apps/frontend/constitution/frontend-architecture.md`
* `apps/frontend/constitution/design-system.md`
* `apps/backend/src/features/identity/AGENTS.md` (API contract, read-only)
* Root `constitution/decisions.md` → "Session expiry UX pattern — 2026-08-23"

---

## Behavior Contract

1. **Mid-use expiry (auto-redirect).** When any request through the shared
   ApiClient (`lib/api.ts`) receives HTTP 401 or error code
   `UNAUTHENTICATED`, the client performs exactly one hard redirect to
   `/features/identity/login?next=<current-path+query>&reason=expired`.
   * A module-level flag guarantees a single redirect even when several
     requests fail concurrently.
   * The redirect uses `window.location.assign` (full reload) so stale React
     state from the expired session is discarded.
2. **Login flow honors the redirect.**
   * Login shows a "session expired" notice when `reason=expired` and forwards
     `next` through to the OTP screen.
   * After successful OTP verify, the user lands on `next` when present.
   * `next` must be validated as a relative path (starts with `/`, not `//`)
     before navigating — never navigate to an arbitrary absolute URL
     (open-redirect protection).
3. **Direct logged-out visits (guard).** A client-side guard in
   `app/(admin)/layout.tsx`: while auth state loads, show a spinner; if
   definitively logged out, show a sign-in prompt panel instead of page
   content; otherwise render children normally.
4. **Sidebar reflects logged-out state** with a Sign In link instead of
   rendering nothing.

---

## Security Notes

* This slice is UI convenience only. It does not authorize anything; the
  backend's `requireSession` + `requireAdmin` remain the security boundary
  per `frontend-architecture.md` → Authentication State.
* Auth endpoints (`/api/auth/me`, `/otp/*`, `/logout`) use the identity
  feature's separate fetch wrapper and must never trigger the expiry redirect
  (a 401 from `/me` simply means logged out).
* Never place session identifiers or CSRF tokens into the redirect URL.

---

## Implementation Rules

* All expiry interception lives in `lib/api.ts`. Feature components must not
  implement their own 401-to-login logic.
* Server Components read search params via the Page `searchParams` prop
  (Promise) and pass values down — do not introduce `useSearchParams` without
  a Suspense boundary (Next 16 prerender requirement).
* Reuse existing design tokens/components (`LoadingSpinner`, Alert pattern,
  surface/on-surface color roles); no new primitives for this slice.
* Keep the identity fetch wrapper (`app/features/identity/api/auth.ts`)
  untouched by interception logic.

## Out of Scope

* Backend changes (CSRF on catalog mutations, security headers — tracked
  separately as future hardening).
* Next.js middleware / edge route protection.
* Storefront (non-admin) session-expiry behavior beyond what falls out of the
  shared ApiClient automatically.
* Moving the login route path (stays `/features/identity/login`).

---

## Verification

Verify at minimum:

* With a valid admin session, delete/expiry the session server-side, then
  trigger any admin API call → single redirect to login with
  `?next=<original>&reason=expired`; no redirect loop.
* Login with `reason=expired` shows the expiry notice.
* After OTP verify, user returns to the original `next` path.
* A tampered absolute `next` value (`https://evil.example`) is not navigated
  to — falls back to role-based default.
* Visiting `/catalog/products` logged out shows the sign-in prompt panel,
  then the sidebar Sign In link leads to login.
* Logged-in flows are unaffected (no spurious redirects).
