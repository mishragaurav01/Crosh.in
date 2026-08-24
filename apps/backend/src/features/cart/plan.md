# plan.md — Cart

Implementation plan for the cart feature. The spec lives in `AGENTS.md`;
this file records *how* it gets built and the decisions locked during
planning (2026-08-24). Work proceeds phase by phase; `task.md` tracks the
granular checklist.

---

## Decisions Locked During Planning

| # | Question | Decision |
|---|---|---|
| 1 | Guest CSRF (identity's `requireCsrfToken` always 403s guests) | Cart-local middleware: session-token comparison for authenticated requests, double-submit `cart_csrf` cookie for guests. identity untouched. |
| 2 | cuid drift scope | All models repo-wide move to `cuid(2)` in this pass (planning found plain `cuid()` everywhere). Zero SQL impact — client-side defaults. |
| 3 | Merge on GET? | Merge fires on any cart request including GET; "GET never creates rows" applies to lazy empty-cart creation, not merge promotion. |
| 4 | guestToken generation | `randomBytes(32).toString("hex")` — repo precedent (identity's CSRF tokens); no new dependency. |

Full reasoning in `AGENTS.md` → Clarifications section.

---

## Phase 0 — Schema Drift Fix (`packages/db/prisma/schema.prisma`)

- Replace every `@default(cuid())` with `@default(cuid(2))` across all ten
  existing models.
- No migration SQL results from this (Prisma generates IDs client-side);
  `prisma generate` refreshes types. Existing rows keep their IDs.

## Phase 1 — Cart Models + CHECK Constraint

Add to the schema exactly per `AGENTS.md`:

- `Cart`: `id` cuid(2), nullable+unique `userId`, nullable+unique
  `guestToken`, timestamps, optional relation to `User`
  (`onDelete: Cascade`), `items CartItem[]`.
- `CartItem`: `id` cuid(2), `cartId`, `variantId`, `quantity`, timestamps,
  cascade relations to `Cart` and `Variant`,
  `@@unique([cartId, variantId])`, `@@index([cartId])`.
- Inverse sides required by Prisma: `User.cart Cart?`,
  `Variant.cartItems CartItem[]`.

Migration steps (from `packages/db`):

1. `bunx prisma migrate dev --name add_cart_models --create-only`
2. Append raw SQL to the generated migration **before applying**:
   ```sql
   ALTER TABLE "Cart" ADD CONSTRAINT "Cart_owner_xor_check" CHECK (
     (("userId" IS NULL) AND ("guestToken" IS NOT NULL)) OR
     (("userId" IS NOT NULL) AND ("guestToken" IS NULL))
   );
   ```
3. Apply (`bunx prisma migrate dev`), then `bunx prisma generate`.
4. Verify against the dev DB: insert both-null → rejected; both-set →
   rejected; one-sided → accepted (then cleaned up). Report actual output.

## Phase 2 — Ownership Resolution

New files under `apps/backend/src/features/cart/`:

```
middleware/resolve-cart-owner.middleware.ts
middleware/cart-csrf.middleware.ts
services/cart.service.ts        # business logic + transactions
services/cart-dto.ts            # explicit DTO mapping (public-catalog.service pattern)
controllers/cart.controller.ts
routes/cart.routes.ts           # createCartRoutes(prisma)
schemas/cart.schema.ts          # zod bodies/params
types/cart-errors.ts            # CartError: CART_ITEM_NOT_FOUND / INSUFFICIENT_STOCK
__tests__/*.test.ts
```

(`middleware/` extends the subfolder list in AGENTS.md's Structure section;
matches identity's layout and backend-architecture.md's middleware concept.)

### `resolveCartOwner(prisma)` — never rejects

- Parse cookies via a cart-local helper (repo already duplicates `parseCookie`
  twice; matching that pattern, extraction is a future refactor).
- Valid session → attach `req.user` + `req.csrfToken` by reusing identity's
  `validateSession` service.
- Guest cookie present → look up cart by `guestToken`.
- Both present → merge runs here (fires on GET too):
  interactive transaction → lock affected variant rows
  (`SELECT ... FOR UPDATE` via `$queryRaw` inside tx) → for each guest line:
  overlapping variant sums quantities capped at stock; non-overlapping lines
  promoted → delete guest Cart row → clear guest cookie on response.
  Idempotent when the token references nothing.

### Cookies

| Cookie | Flags | Purpose |
|---|---|---|
| `guest_token` | httpOnly, secure (`NODE_ENV === "production"`), SameSite=Lax, path `/` | Identifies the guest cart; issued only on first mutation when unauthenticated |
| `cart_csrf` | same minus httpOnly (JS-readable for double-submit) | Guest CSRF comparison value |

### `requireCartCsrf`

- Authenticated request: identical check to identity's `requireCsrfToken`
  (`X-CSRF-Token` header vs `req.csrfToken`), 403 `CSRF_FAILED` envelope.
- Unauthenticated: header vs `cart_csrf` cookie value.

## Phase 3 — Endpoints

Mounted at `/api/cart` in `apps/backend/index.ts`.

| Route | Chain | Behavior |
|---|---|---|
| `GET /` | resolveCartOwner | Cart DTO or `{ items: [], subtotal: 0 }`; no row creation outside merge promotion |
| `POST /items` | resolveCartOwner → requireCartCsrf | Validate body; lazy-create cart (+ guest cookies if needed); tx: lock variant, `(existing ?? 0) + qty <= stock` else 409 `INSUFFICIENT_STOCK`; upsert; return refreshed DTO |
| `PATCH /items/:itemId` | same | Absolute set; `quantity === 0` deletes the line; >0 re-checked inside tx; owner-scoped 404 `CART_ITEM_NOT_FOUND` |
| `DELETE /items/:itemId` | same | Owner-scoped delete, 404 semantics as above |
| `DELETE /` | same | Clear all items; idempotent success even with no cart |

- Controllers mirror catalog's safeParse → 422 `VALIDATION_ERROR` envelope
  pattern; errors use `{ success, error: { code, message } }`.
- Reuse catalog's `VARIANT_NOT_FOUND` semantics — no duplication.
- Concurrency: add/increment and merge run in `$transaction` with variant
  rows locked `FOR UPDATE` before the quantity math — never trust a prior
  stock read.

## Phase 4 — Tests (`__tests__/`, mock-prisma style like existing suites)

Ten files mapping 1:1 to task.md Phase 4: lazy guest creation, authed
resolution, merge-promote (empty user cart), merge-overlap capped at stock,
CSRF 403s ×4 routes ×guest/authed, stock-cap 409, PATCH 0 removes,
cross-owner 404, DTO leak-free, clear-cart. `$transaction` mocked to invoke
the callback with a tx mock.

## Phase 5 — Verification (honest reporting)

Repo reality vs task.md wording:

- **No turbo test task exists** (`turbo.json` defines build/lint/check-types/
  dev only; backend package.json defines none of them). Actual command:
  `bun test` in `apps/backend`.
- **No typecheck script** — turbo.json has `check-types` but backend defines
  no such script. Actual command: `bunx tsc --noEmit` in `apps/backend`.
- **No lint tooling anywhere** — report as not runnable, not as passing.
- Live-server checks (curl): Set-Cookie flags on `guest_token`/`cart_csrf`,
  quantity-0 behavior, real 409/404 codes.
- Full diff review for scope creep; deviations reported explicitly.

---

## Assumptions (change if wrong)

- Mutating endpoints return the refreshed cart DTO (frontend syncs state in
  one round trip).
- Subtotal sums all lines, including unavailable ones.
- Availability exposed as boolean only — raw stock never leaves the API
  (matches catalog public-read rules).
- POST quantity must be ≥ 1 (int); PATCH accepts ≥ 0 where 0 means remove.
