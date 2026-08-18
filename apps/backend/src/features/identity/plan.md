# plan.md — Identity

Sequenced implementation plan. Each phase should be a reviewable unit — don't
jump ahead to Phase 3 with Phase 1 unverified.

---

## Phase 1 — Schema

1. Add `User`, `OtpCode`, `Session` models to `packages/db` Prisma schema per
   `AGENTS.md`'s Data Model section.
2. Generate migration: `bunx prisma migrate dev --name add_identity_models`.
3. Run `bunx prisma generate`.
4. Verify: open Prisma Studio, confirm tables and columns match spec exactly
   (types, nullability, indexes on `OtpCode.email` and `Session.userId`).

## Phase 2 — OTP Service

1. Build the OTP generation/hashing utility (6-digit numeric, SHA-256 hash).
2. Build the OTP request service: cooldown + hourly rate-limit check against
   existing `OtpCode` rows, create new row, trigger email send.
3. Build the OTP verify service: lookup, attempt increment, expiry check,
   consumption, find-or-create `User`.
4. Email sending: stub/log in dev if no email provider is wired up yet —
   confirm with the user before picking a provider (this is a dependency
   decision, not implicit).

## Phase 3 — Session Service + Middleware

1. Build session creation (on successful OTP verify) and session lookup.
2. Build the Express session-validation middleware described in `AGENTS.md`.
3. Confirm cookie flags are correct in an actual browser/curl response, not
   just in code — this is a named Definition of Done item, don't skip it.

## Phase 4 — Endpoints

1. `POST /api/auth/otp/request`
2. `POST /api/auth/otp/verify`
3. `GET /api/auth/me`
4. `POST /api/auth/logout`

Wire each through Route → Controller → Service per
`apps/backend/constitution/backend-architecture.md`. Validate all input with
Zod per the same document.

## Phase 5 — CSRF

Add double-submit CSRF token verification to `/otp/verify` and `/logout`, per
`AGENTS.md`'s Security Notes.

## Phase 6 — Verification

1. Manually test every error code path in the Error Codes table — not just
   the happy path.
2. Confirm rate limiting and attempt limiting with real repeated requests.
3. Inspect the DB directly to confirm OTP codes are hashed, not plaintext.
4. Run `turbo test --filter=backend`, `turbo typecheck --filter=backend`,
   `turbo lint --filter=backend`.

## Open Dependency Decision

Email provider chosen: **Resend**. Installed `resend` package. `sendOtpEmail`
wrapper in `services/email.service.ts` reads `RESEND_API_KEY` and `EMAIL_FROM`
from env. Should become its own entry in `constitution/decisions.md` if the
project wants a permanent record.
