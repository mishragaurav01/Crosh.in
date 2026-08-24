# task.md — Cart

Granular checklist. Work top to bottom. Check off only what was actually done
and verified.

Planning-phase findings are noted inline where inspection already happened
(2026-08-24); boxes stay unchecked until the work lands in this pass.

---

## Phase 0 — Prerequisite Check

- [x] Inspect existing models in `schema.prisma` — confirm whether they use
      `cuid()` or `cuid(2)`. **Found during planning: ALL models (identity's
      User/OtpCode/Session and every catalog model) are on plain `cuid()`.**
      Per approved decision, fix all of them in this same migration pass
      rather than adding a second inconsistent model set.

## Phase 1 — Schema

- [x] Move all existing models to `@default(cuid(2))` (no SQL impact —
      client-side defaults)
- [x] Add `Cart` model (`userId` nullable+unique, `guestToken` nullable+unique,
      `cuid(2)` ids, inverse relation `User.cart`)
- [x] Add `CartItem` model (`@@unique([cartId, variantId])`, indexed on `cartId`,
      inverse relation `Variant.cartItems`)
- [x] Add raw-SQL DB CHECK constraint: exactly one of `userId`/`guestToken`
      non-null
- [x] Run `bunx prisma migrate dev --name add_cart_models`
- [x] Run `bunx prisma generate`
- [x] Attempt an invalid insert (both null, or both set) directly against the
      DB — confirm the CHECK constraint actually rejects it

## Phase 2 — Ownership Resolution

- [x] Build `resolveCartOwner` middleware: resolves `userId` from session if
      present, `guestToken` from cookie if present, neither rejects the
      request (cart is guest-accessible)
- [x] Guest cookie issuance: lazy, mutation-only, `httpOnly`/`Secure`/`SameSite=Lax`
- [x] Merge-on-login logic: both identities present → transactional merge
      (sum overlapping variants capped at stock, promote non-overlapping
      lines, delete guest cart, clear guest cookie); fires on any cart
      request including GET (Clarification #3)

## Phase 3 — Services & Endpoints

- [x] `GET /api/cart` — DTO mapping, empty shape if no cart, never creates rows
      (outside merge promotion)
- [x] `POST /api/cart/items` — lazy cart creation, increment-if-exists,
      `409 INSUFFICIENT_STOCK`, merge runs first if applicable
- [x] `PATCH /api/cart/items/:itemId` — absolute set, `quantity: 0` → delete
      the line, stock re-check for quantity > 0, owner-scoped 404
- [x] `DELETE /api/cart/items/:itemId` — owner-scoped 404
- [x] `DELETE /api/cart` — clear all items
- [x] Cart CSRF enforcement wired into all four mutating routes
      (cart-local middleware per Clarification #1 — session-token check for
      authenticated requests, double-submit `cart_csrf` cookie for guests)
- [x] `cart-errors.ts`: `CART_ITEM_NOT_FOUND`, `INSUFFICIENT_STOCK` added;
      catalog's `VARIANT_NOT_FOUND` reused, not duplicated
- [x] Add/increment and merge both wrapped in stock-guarded transactions
      (interactive tx + `SELECT ... FOR UPDATE` on involved variants)

## Phase 4 — Tests

Ten suites under `__tests__/`, one per checklist item (2026-08-24). 61
assertions across the ten files; full run: 369 pass / 0 fail repo-wide.

- [x] Guest cart created lazily on mutation, not on GET
      (`lazy-guest-creation.test.ts`)
- [x] Authenticated cart resolved correctly by `userId`
      (`authed-owner-resolution.test.ts`)
- [x] Merge: guest cart + no existing user cart → promoted correctly
      (`merge-promote.test.ts`)
- [x] Merge: guest cart + overlapping variant in user cart → quantities
      summed, capped at stock (`merge-overlap-stock-cap.test.ts`)
- [x] CSRF 403 on all four mutating routes, guest and authenticated
      (`cart-csrf.test.ts` — live-server contract test over real route wiring)
- [x] Stock cap enforced on add/increment (`409 INSUFFICIENT_STOCK`)
      (`stock-cap-add-increment.test.ts`, includes PATCH-side cap)
- [x] `PATCH quantity: 0` removes the line rather than erroring
      (`patch-zero-removes.test.ts`)
- [x] Cross-owner access returns 404, not 403 or leaked data
      (`ownership-scoping-404.test.ts`)
- [x] DTO mapping — no raw Prisma model fields present in response
      (`cart-dto-mapping.test.ts`)
- [x] `DELETE /api/cart` clears all items correctly (`clear-cart.test.ts`)

## Phase 5 — Verification

Repo has no turbo test/typecheck/lint wiring for backend (see plan.md
Phase 5); the actual equivalents are noted in parentheses.
All checks below executed 2026-08-24.

- [x] Backend test suite run and result reported (`bun test` in apps/backend):
      **370 pass / 0 fail** across 36 files (62 of them cart tests in 10
      suites). Two pre-existing `[confirmUpload]` console-noise lines from
      catalog image tests are expected error-path logs, not failures.
- [x] Typecheck run and result reported (`bunx tsc --noEmit` in apps/backend):
      **clean** (exit 0).
- [x] Lint attempted and honestly reported: `bunx turbo lint --filter=backend`
      → "No tasks were executed as part of this run." Backend `package.json`
      defines only `dev`/`start`; no ESLint/Biome config exists anywhere in
      the repo. **Lint is not runnable** — reported as such, not as passing.
- [x] Guest cookie flags confirmed in an actual response (curl against the
      real server on :3002):
      `guest_token=<64-hex>; Path=/; HttpOnly; SameSite=Lax`
      `cart_csrf=<same 64-hex>; Path=/; SameSite=Lax` (no HttpOnly —
      double-submit readable; no Secure outside production). Also locked in
      as a permanent wire-level test in `cart-csrf.test.ts`.
- [x] Review full diff for anything outside cart's scope: cart's footprint is
      `apps/backend/src/features/cart/` (new), the `/api/cart` mount in
      `index.ts`, schema.prisma cart models + repo-wide `cuid(2)` sweep, and
      the `20260823194912_add_cart_models` migration. Other modified files in
      the working tree belong to the separate catalog-images/identity work
      that predates this feature.

### Live-server verification (real DB, real HTTP)

Run against `bun index.ts` on port 3002 with a real dev-DB variant
(stock 200):

| Check | Result |
|---|---|
| First-contact POST add | 200; guest cookies issued lazily; correct DTO |
| GET with guest cookies | 200; item visible |
| Increment with matching `X-CSRF-Token` | 200; qty summed |
| PATCH `quantity: 0` | 200; line removed (implicit remove) |
| Add full stock, then +1 more | **409 INSUFFICIENT_STOCK** |
| DELETE bogus item id | **404 CART_ITEM_NOT_FOUND** |
| Guest cookies + missing/mismatched header | **403 CSRF_FAILED** on POST and DELETE `/` |

Authenticated-route CSRF was verified over live route wiring via the
in-process live-server suite (`cart-csrf.test.ts`); verifying it via curl
would require a real Session row, which the guest-only curl pass did not
create.

Test data cleaned up afterwards: cart items cleared, the guest Cart row
deleted, server stopped. No residue left in the dev DB.

## Reporting

On completion, report: what was implemented, which checks were actually run,
whether the `cuid()`/`cuid(2)` issue was found and fixed (planning confirmed
it repo-wide; fix tracked in Phase 1), any deviation from `AGENTS.md`, and
anything left open.
