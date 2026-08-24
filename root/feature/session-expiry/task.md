# Task — Session Expiry UX

Working checklist. One slice at a time; update status as work completes.

## Status Key

`[ ]` pending · `[x]` done · `[~]` blocked/deferred (note why)

## S1 — Centralized 401 interception

- [x] `lib/api.ts`: add single-fire session-expiry handler (module flag +
      `window.location.assign` to login with `next` + `reason=expired`).
- [x] Trigger it on HTTP 401 or error code `UNAUTHENTICATED` inside
      `ApiClient.request`; still throw the error to callers afterward.

## S2 — Login flow honors next + reason

- [x] `login/page.tsx`: convert to server page reading `searchParams`
      (`next`, `reason`), delegating to a client inner component.
- [x] Expiry notice banner when `reason=expired`.
- [x] Forward `next` through to `/features/identity/otp?email=…&next=…`.

## S3 — OTP verify returns to destination

- [x] `otp/page.tsx`: read `next` from search params, pass to `OtpForm`.
- [x] `OtpForm.tsx`: accept optional `next` prop; validate relative path
      (`startsWith("/") && !startsWith("//")`); navigate to it after verify,
      else keep role-based default.

## S4 — Admin shell guard

- [x] New `app/(admin)/AdminGuard.tsx` (client): loading spinner /
      signed-out prompt panel / children.
- [x] Wrap `{children}` in `(admin)/layout.tsx` with `AdminGuard`.
- [x] `AdminSidebar.tsx`: render Sign In link in user section slot when
      logged out (replaces bare `return null`).

## Verification

- [x] Type check (`bunx tsc --noEmit`) — clean. NOTE: repo defines turbo task
      `check-types`, not `typecheck`; frontend package.json has neither script.
- [x] ESLint on all changed files — clean (2 pre-existing errors in untouched
      files `components/LoginForm.tsx`, `components/TopNavBar.tsx` remain).
- [x] Backend `GET /api/admin/categories` without cookie → 401
      `{"code":"UNAUTHENTICATED","message":"Missing session"}` (trigger condition).
- [x] `/features/identity/login?next=%2Fcatalog%2Fproducts&reason=expired`
      SSRs 200 with expiry banner; RSC payload confirms `next`/`reason` props
      reach `LoginClient`.
- [x] `/catalog/products` logged out SSRs 200: sidebar renders, AdminGuard
      shows loading spinner pre-hydration, no crash.
- [~] Browser-interaction clauses NOT machine-verified here (require real
      browser + auth state manipulation): actual redirect firing on mid-use
      401, single-fire behavior under concurrent failures, post-verify return
      to `next`, tampered absolute `next` fallback at runtime (logic reviewed:
      `safeRelativePath` rejects non-relative), sidebar Sign In click-through,
      no-spurious-redirect during normal logged-in use.
