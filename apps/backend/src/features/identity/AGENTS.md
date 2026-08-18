# AGENTS.md — Feature: Identity

## Purpose

Delta-only spec for the `identity` feature: signup, login, and OTP verification.
Does not restate backend architecture, API conventions, or security baseline —
those are governed by `apps/backend/constitution/*.md` and apply here
unmodified. This file only covers what's specific to this feature.

**Tier 1 feature** (per `constitution/domain-map.md`) — highest scrutiny,
alongside `payment`.

Load alongside this file: `apps/backend/constitution/security-rules.md`
(mandatory — this feature is entirely security-sensitive),
`apps/backend/constitution/api-design.md`, `packages/db/constitution/db-design.md`.

---

## Scope

Passwordless email + OTP authentication. **Signup and login are the same flow**
— there is no separate signup form. A user requests an OTP for their email;
verifying it either logs them in (if the user already exists) or creates their
account (if it's their first time) and logs them in. This collapses "signup"
and "login" into one endpoint pair rather than two parallel flows, since both
ultimately do the same thing: prove control of an email address.

**In scope:** OTP request, OTP verification (with implicit account creation),
session creation, session validation, logout.

**Out of scope for this pass:** OAuth (email/OTP only for now — OAuth is a
separate future addition per `security-rules.md`, not part of this
implementation), password-based auth (not part of the primary flow per
`security-rules.md`), profile management beyond the minimum fields needed to
create a `User` row.

---

## Data Model

All IDs use cuid2 per `constitution/decisions.md`.

### `User`
- `id` (cuid2, PK)
- `email` (unique, required)
- `emailVerifiedAt` (nullable timestamp — set on first successful OTP verify)
- `createdAt`, `updatedAt`

### `OtpCode`
- `id` (cuid2, PK)
- `email` (indexed — OTPs are requested before a `User` row necessarily exists)
- `codeHash` (hashed, never plaintext — see Security below)
- `expiresAt`
- `attempts` (int, default 0)
- `consumedAt` (nullable — set once successfully verified; a consumed code is dead)
- `createdAt`

### `Session`
- `id` (cuid2, PK — this value *is* the cookie content, opaque to the client)
- `userId` (FK → User)
- `expiresAt`
- `createdAt`

No password field anywhere. No plaintext OTP storage anywhere.

---

## Endpoints

All responses use the envelope from `constitution/decisions.md`
(`{ success, data }` / `{ success, error: { code, message } }`).

### `POST /api/auth/otp/request`
Body: `{ email: string }`

- Always responds success-shaped regardless of whether the email has an
  existing account — per `security-rules.md`, never disclose account existence.
- Rate limited: max 5 requests per email per hour, 60-second cooldown between
  requests for the same email (`constitution/decisions.md`, OTP parameters).
- Generates a 6-digit numeric code, hashes it before storage, sets 10-minute
  expiry, sends via email.
- Response: `{ success: true, data: { message, expiresInSeconds: 600 } }`

### `POST /api/auth/otp/verify`
Body: `{ email: string, code: string }`

- Look up the most recent unconsumed, unexpired `OtpCode` for the email.
- Max 5 verification attempts per code before it's invalidated (increment
  `attempts` on each failed check; reject once `attempts >= 5` even if the
  correct code is later supplied — force a new OTP request instead).
- On success: mark code consumed, find-or-create `User` by email (set
  `emailVerifiedAt` if newly verified), create `Session`, set session cookie.
- Response: `{ success: true, data: { user: { id, email } } }`
- Failure modes: expired code, wrong code, too many attempts, no pending code
  — each maps to a distinct `error.code` (see Error Codes below).

### `GET /api/auth/me`
Requires valid session cookie.

- Response: `{ success: true, data: { user: { id, email } } }`
- No session / expired session → `401` with `error.code: "UNAUTHENTICATED"`.

### `POST /api/auth/logout`
Requires valid session cookie.

- Deletes the `Session` row, clears the cookie.
- Response: `{ success: true, data: { message: "Logged out" } }`

---

## Session Middleware

A single Express middleware validates the session cookie against the `Session`
table and attaches the resolved user to the request for downstream handlers
(`req.user` or equivalent). This middleware is owned by `identity` but will be
imported by every other feature that needs authenticated routes — keep its
interface stable once built, since changing it later touches every feature.

---

## Security Notes (feature-specific, in addition to `security-rules.md`)

- OTP codes are hashed at rest (e.g. SHA-256) — never stored or logged in
  plaintext, per `security-rules.md`.
- OTP request endpoint must respond in constant shape/timing regardless of
  whether the email exists, to avoid account-enumeration via response
  difference or timing.
- Session cookie: `httpOnly`, `Secure`, `SameSite=Lax`, per
  `constitution/decisions.md` (Session/auth architecture).
- Rate limiting for `/otp/request` is enforced by querying `OtpCode` rows for
  the email within the lookback window — no new infra (Redis, etc.) introduced
  for this. If this becomes a bottleneck at scale, that's an architectural
  change requiring review, not a silent swap.
- CSRF: since auth relies on cookies, state-changing endpoints here
  (`/otp/verify`, `/logout`) should implement double-submit CSRF token
  verification per `security-rules.md`'s CSRF clause.

---

## Error Codes (this feature)

| Code | Meaning |
|---|---|
| `OTP_INVALID` | Code doesn't match the active OTP for this email |
| `OTP_EXPIRED` | No active (unexpired, unconsumed) OTP for this email |
| `OTP_MAX_ATTEMPTS` | Too many failed verify attempts on the current code |
| `OTP_RATE_LIMITED` | Too many OTP requests for this email recently |
| `UNAUTHENTICATED` | No valid session |

---

## Escalation

Ask before proceeding if: OAuth needs to be added to this pass after all,
rate-limiting needs to move to shared infrastructure (Redis) rather than DB
queries, or the session middleware's interface needs to change after other
features have already started depending on it.

---

## Definition of Done (feature-specific, in addition to backend `AGENTS.md`)

- [ ] `User`, `OtpCode`, `Session` migrations applied via `packages/db`.
- [ ] All four endpoints implemented and manually verified against the error
      codes table above.
- [ ] OTP codes confirmed hashed at rest (inspect DB directly, not just code).
- [ ] Rate limiting and attempt-limiting verified with actual repeated requests,
      not just reasoned about.
- [ ] Session cookie flags (`httpOnly`, `Secure`, `SameSite=Lax`) confirmed in
      an actual response, not assumed from code.
- [ ] CSRF protection in place on state-changing endpoints.
