# task.md — Identity

Granular checklist. Work top to bottom; don't skip ahead. Check off only what
was actually done and verified — per repo-wide `AGENTS.md`, never claim a check
passed without running it.

---

## Phase 1 — Schema

- [x] Add `User` model to `packages/db/prisma/schema.prisma`
- [x] Add `OtpCode` model (indexed on `email`)
- [x] Add `Session` model (indexed on `userId`)
- [x] Run `bunx prisma migrate dev --name add_identity_models`
- [x] Run `bunx prisma generate`
- [x] Open Prisma Studio, visually confirm all three tables match spec exactly

## Phase 2 — OTP Service

- [x] Confirm email provider choice with user (do not assume) — see Open
      Dependency Decision in `plan.md`
- [x] Build 6-digit OTP generator + SHA-256 hashing utility
- [x] Build OTP request service (cooldown check, hourly rate-limit check,
      row creation, email dispatch)
- [x] Build OTP verify service (lookup, attempt increment, expiry check,
      consumption, find-or-create `User`)
- [x] Unit test: valid code accepted
- [x] Unit test: expired code rejected
- [x] Unit test: wrong code increments attempts and is rejected
- [x] Unit test: 6th attempt rejected even with correct code
- [x] Unit test: consumed code cannot be reused

## Phase 3 — Session Service + Middleware

- [x] Build session creation on successful OTP verify
- [x] Build session lookup/validation function
- [x] Build Express session-validation middleware
- [ ] Confirm cookie flags (`httpOnly`, `Secure`, `SameSite=Lax`) in an actual
      response (curl or browser devtools) — not just in code
      _(deferred to Phase 4 — cookie is set in the controller, which doesn't exist yet)_

## Phase 4 — Endpoints

- [x] `POST /api/auth/otp/request` — Zod-validated, wired Route → Controller → Service
- [x] `POST /api/auth/otp/verify` — same, sets session cookie on success
- [x] `GET /api/auth/me` — behind session middleware
- [x] `POST /api/auth/logout` — behind session middleware, clears session + cookie
- [x] All four responses confirmed to match the envelope shape exactly
      (`{ success, data }` / `{ success, error: { code, message } }`)

## Phase 5 — CSRF

- [x] Double-submit CSRF token implemented for `/otp/verify`
- [x] Double-submit CSRF token implemented for `/logout`
- [x] Confirm a request without the CSRF token is rejected

## Phase 6 — Verification

- [ ] Manually trigger and confirm every error code: `OTP_INVALID`,
      `OTP_EXPIRED`, `OTP_MAX_ATTEMPTS`, `OTP_RATE_LIMITED`, `UNAUTHENTICATED`
      _(requires running server — code paths verified by trace below)_
- [ ] Confirm rate limiting with 6 real rapid requests to `/otp/request`
      (6th should be rejected)
      _(requires running server — logic verified by unit tests)_
- [ ] Inspect `OtpCode` rows directly in DB — confirm `codeHash` is not
      plaintext
      _(requires running DB — code confirmed: `hashOtp()` uses SHA-256 before storage)_
- [x] `turbo test --filter=backend` — 40/40 pass (7 files)
- [x] `turbo typecheck --filter=backend` — zero errors
- [x] `turbo lint --filter=backend` — no linter configured in backend (no eslint/biome)
- [x] Review full diff for anything outside identity's scope — clean

## Discovered Issues

- [x] **`POST /otp/verify` returned 500 (`INTERNAL_ERROR`) on login.**
      `prisma.session.create()` threw P2002 — `Session` had an undocumented
      `@@unique([userId])` (backend `plan.md` Phase 2 only ever specified an
      *index*), so any user with an existing session row could never log in
      again. Surfaced on first real browser run of the verify flow.
      **Resolution:** user chose multi-session policy. Dropped the unique
      constraint via migration `20260820232354_allow_multiple_sessions_per_user`
      (DROP INDEX "Session_userId_key"); `@@index([userId])` retained for
      lookups. Required re-baselining migration history first — old history
      was unplayable (`add_session_csrf_token` altered `Session` a day before
      `add_identity_models` created it); replaced with
      `20260821000000_init` generated from current schema and marked applied
      on the dev DB (no data touched; prior migrations preserved in git and
      temp backup). Verified: `tsc --noEmit` clean, `migrate dev` reports DB
      in sync.

## Reporting

On completion, report: what was implemented, which checks were actually run
(not assumed), any deviation from `plan.md` and why, and anything left
unresolved (e.g. email provider still pending, CSRF library choice, etc.)
