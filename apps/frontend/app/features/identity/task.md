# task.md — Identity (Frontend)

Granular checklist. Work top to bottom. Check off only what was actually built
and verified.

---

## Phase 1 — Shared Components

- [ ] `AuthLayout` built — transactional header, responsive split-pane (desktop)
      / stacked (mobile) body
- [ ] `AuthForm` built — email/phone input + submit button
- [ ] `OtpInputGroup` built — 6 boxes, auto-advance, paste support,
      `autocomplete="one-time-code"`
- [ ] `ResendCodeButton` built — countdown-gated, disabled/enabled states
- [ ] Each component checked for existing equivalents in shared UI before
      building from scratch

## Phase 2 — Screens

- [ ] Login screen — mobile, matches Figma node `18:136`
- [ ] Login screen — desktop, matches Figma node `18:58`
- [ ] Sign Up screen — mobile, matches Figma node `18:186`
- [ ] Sign Up screen — desktop, matches Figma node `18:261`
- [ ] OTP Verification screen — mobile, matches Figma node `18:2`
- [ ] OTP Verification screen — desktop, matches Figma node `18:355`
- [ ] OAuth button present in markup but hidden on all applicable screens
- [ ] Desktop left panel uses placeholder image, structured for easy swap

## Phase 3 — API Integration

- [ ] Confirmed backend identity endpoints are implemented and manually
      verified before starting this phase
- [ ] `AuthForm` wired to `POST /api/auth/otp/request`
- [ ] OTP screen wired to `POST /api/auth/otp/verify`
- [ ] `OTP_INVALID` → inline error under OTP input
- [ ] `OTP_EXPIRED` → prompt for new code, verify button disabled
- [ ] `OTP_MAX_ATTEMPTS` → forces new OTP request, input cleared
- [ ] `OTP_RATE_LIMITED` → cooldown explained, retry blocked
- [ ] `UNAUTHENTICATED` (from `/me`) → treated as logged-out, no error shown
- [ ] CSRF mechanism confirmed against backend, wired into both
      state-changing requests
- [ ] `GET /api/auth/me` wired at app-shell level
- [ ] Logout wired to `POST /api/auth/logout`

## Phase 4 — Verification

- [ ] All five error codes manually triggered and confirmed correct
- [ ] Session persists across page refresh (cookie round-trip confirmed)
- [ ] Resend countdown matches backend's actual cooldown value
- [ ] `turbo test --filter=frontend` — run and report actual result
- [ ] `turbo typecheck --filter=frontend` — run and report actual result
- [ ] `turbo lint --filter=frontend` — run and report actual result
- [ ] Visual check at mobile and desktop against Figma reference
- [ ] No hardcoded colors — spot-check against `design-system.md`

## Discovered Issues

- [x] **Crash on `/features/identity/otp`: `useAuth must be used within
      AuthProvider`.** `OtpForm` calls `useAuth()` from the feature-local
      `components/AuthProvider.tsx`, but that provider is never mounted
      anywhere — the root layout has no provider, and the only mounted
      `AuthProvider` (`lib/auth-context.tsx`, in `app/(admin)/layout.tsx`)
      covers just the `(admin)` route group. Surfaced on first real browser
      run of the verify flow (earlier attempts died earlier, at the 404'd
      `POST /otp/request`). Also flagged: two divergent auth contexts now
      exist (`lib/auth-context.tsx` vs the feature-local copy), which
      conflicts with the no-duplicate-components rule. Must be resolved
      before Phase 4 verification.
      **Resolution:** consolidated on `lib/auth-context.tsx` per user
      decision — added `csrfToken`/`setAuth`, mounted `AuthProvider` in
      root `app/layout.tsx`, removed nested provider from `(admin)/layout.tsx`,
      deleted feature-local copy, `OtpForm` imports `useAuth` from
      `@/lib/auth-context`. Verified: `tsc --noEmit` clean, eslint clean
      (one pre-existing font warning). Browser confirmation of the full
      verify flow still pending.

## Reporting

On completion, report: what was implemented, which checks were actually run,
any deviation from `plan.md` and why, and anything left open (e.g. real
photography still pending, OAuth still hidden).
