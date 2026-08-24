# Plan — Session Expiry UX

## Goal

When an admin's session expires mid-use, they are automatically returned to
login (destination preserved); direct visits to admin pages while logged out
show a sign-in prompt instead of a broken admin shell.

Decision record: root `constitution/decisions.md` → "Session expiry UX pattern — 2026-08-23".

## Current State (baseline, pre-slice)

* Backend returns `401 { code: "UNAUTHENTICATED" }` on expired/missing sessions
  (`session.service.ts`, `session.middleware.ts`) — no backend change needed.
* `lib/api.ts` throws the error object to callers; no 401 interception.
* `CatalogError.tsx` renders expiry text with no way back to login.
* `AdminSidebar` hides the user section when logged out (`return null`).
* `(admin)/layout.tsx` has no auth guard; no `middleware.ts` exists.
* Login at `/features/identity/login`; OTP verify redirects admins to
  `/catalog/categories` unconditionally (`OtpForm.tsx:50`).

## Slices

### S1 — Centralized 401 interception (`lib/api.ts`)
* Detect HTTP 401 / error code `UNAUTHENTICATED` in `ApiClient.request`.
* Single-fire guard flag; hard redirect via `window.location.assign` to
  `/features/identity/login?next=<path+query>&reason=expired`.

### S2 — Login flow honors next + reason
* `login/page.tsx`: server component reads `searchParams` (`next`, `reason`),
  passes to client inner; expiry notice when `reason=expired`; forwards `next`
  to OTP URL.

### S3 — OTP verify returns to destination
* `otp/page.tsx`: accept + forward `next`.
* `OtpForm.tsx`: validate `next` (relative-only), navigate there after verify;
  fallback to existing role-based default.

### S4 — Admin shell guard
* New `(admin)/AdminGuard.tsx` client component: loading → spinner,
  !user → sign-in prompt panel, else children.
* Wire into `(admin)/layout.tsx`.
* `AdminSidebar.tsx`: Sign In link when logged out instead of `return null`.

## Risks / Notes

* Redirect loop risk is structurally excluded: identity endpoints use their own
  fetch wrapper (`app/features/identity/api/auth.ts`) and never pass through
  `lib/api.ts`. Verified during implementation, not assumed.
* Open-redirect: `next` validated as `/...` relative path before navigation.
* Prerender safety: no `useSearchParams`; server pages pass props down.

## Verification Plan

See AGENTS.md → Verification. Commands: `turbo typecheck --filter=frontend`,
`turbo lint --filter=frontend`, manual dev-server walkthrough of each contract
clause with backend running.
