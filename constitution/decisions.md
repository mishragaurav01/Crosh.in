# Decisions Log

## Purpose

Append-only record of one-off architectural/technical decisions and the reasoning
behind them — lighter than a full constitution document, but prevents the same
question from being re-litigated (or re-guessed) by a future agent session.

Load this when: a "why was it built this way" question comes up, or before
making a decision that a past session may have already made.

Do not delete or rewrite past entries. If a decision changes, add a new entry
that supersedes the old one and note that explicitly.

---

## Format

```
## <Short title> — <YYYY-MM-DD>

**Decision:** what was decided
**Context:** why it came up
**Reasoning:** why this option over the alternatives
**Status:** active / superseded by <link/date>
```

---

## Entries

## API response envelope — 2026-08-18

**Decision:** All API responses use `{ success: boolean, data }` on success and
`{ success: boolean, error: { code, message } }` on failure.
**Context:** `api-design.md` left response shape undefined; identity's endpoints
would have set the precedent by accident otherwise.
**Reasoning:** Explicit `success` flag gives frontend one stable branch point
regardless of HTTP status nuance. Separate machine-readable `code` from
human-readable `message` supports future i18n and programmatic error handling
without a later rewrite.
**Status:** active

## Session/auth architecture — 2026-08-18

**Decision:** Server-side sessions, not JWT. Opaque cuid2 session ID stored in
an httpOnly, Secure, SameSite=Lax cookie. Session records persisted in Postgres
via Prisma (`userId`, `expiresAt`, `createdAt`).
**Context:** `security-rules.md` deliberately left session architecture open
until the auth implementation was actually being designed.
**Reasoning:** Avoids JWT refresh-rotation complexity and blacklist-on-logout
problems. Trivial revocation (delete the row). Reuses existing Postgres
infrastructure instead of introducing a second storage mechanism. Directly
follows `security-rules.md`'s own guidance against unnecessary token complexity.
Since cookies are used, CSRF protection is required per `security-rules.md` —
SameSite=Lax handles most cases; state-changing sensitive endpoints should add
a double-submit CSRF token for defense in depth.
**Status:** active

## Entity ID strategy — 2026-08-18

**Decision:** cuid2 for all entity IDs (User, Session, and subsequent entities
across all features), consistently.
**Context:** `db-design.md` referenced "the project's established ID strategy"
without one being recorded anywhere.
**Reasoning:** User preference; cuid2 is collision-resistant, URL-safe, and
avoids the sequential-guessability of autoincrement IDs without UUID's larger
storage footprint.
**Status:** active

## OTP parameters — 2026-08-18

**Decision:** 10-minute OTP expiry, 5 verification attempts before lockout,
60-second resend cooldown, max 5 OTP requests per identifier (email/phone) per
hour.
**Context:** `security-rules.md` specified "short expiration" and "limited
attempts" without concrete numbers, leaving the OTP service to invent values on
first implementation.
**Reasoning:** Standard balance between security (bounding brute-force and abuse)
and legitimate user experience (enough time/attempts to not lock out a real user
fumbling a code).
**Status:** active

**Decision:** Checkout is a conceptual flow only, not a feature folder. `order`
and `payment` remain separate, independently testable backend feature folders.
**Context:** `systemModules.md` (now `constitution/domain-map.md`) grouped
Address/Order/Payment under a "Checkout" node, raising the question of whether
they should be one feature folder.
**Reasoning:** Payment is the highest-risk domain (PCI boundary, third-party
processor). Isolating it from order/cart logic keeps its blast radius small and
lets it carry stricter review/testing requirements without dragging order logic
along with it.
**Status:** active

## Email provider — 2026-08-19

**Decision:** Resend for transactional email (OTP dispatch initially, broader
transactional email later).
**Context:** Identity feature Phase 2 required an email provider for sending OTP
codes. `plan.md` flagged this as an open dependency decision.
**Reasoning:** Modern API, clean SDK, generous free tier (100 emails/day),
TypeScript-first. Simpler than SendGrid's heavier SDK. No AWS account dependency
like SES. Can be swapped later if volume or cost requirements change — the
`sendOtpEmail` wrapper in `services/email.service.ts` isolates the provider
behind a single function boundary.
**Status:** active

*(add further entries here as real decisions get made, e.g. where Address
ultimately lives, CSRF library choice, etc.)*


## Admin authorization model — 2026-08-20

**Decision:** Administrative authorization is represented by a boolean
`User.isAdmin` field. The field defaults to `false`.

**Context:** Catalog management requires authorization beyond authentication,
but the project does not currently need a general role or permission system.

**Reasoning:** A boolean is sufficient for the current requirement and avoids
introducing roles, permission tables, or RBAC complexity before the product
actually needs them. The authorization check is implemented as reusable
backend infrastructure so future administrative features can use the same
mechanism.

**Status:** active
