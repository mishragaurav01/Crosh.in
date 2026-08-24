# AGENTS.md — Feature: Cart

## Purpose

Delta-only spec for `cart`. Tier 2 per `constitution/domain-map.md` — this
file doubles as the plan; `task.md` covers granular checklist items. Does not
restate backend architecture or security baseline — see
`apps/backend/constitution/*.md`.

Load alongside this file: `apps/backend/constitution/security-rules.md`,
`apps/backend/constitution/api-design.md`, `packages/db/constitution/db-design.md`,
and `identity/AGENTS.md` (cart resolves ownership against identity's Session
model, without modifying it).

---

## Scope

Cart supports **both guest and authenticated users** — corrected from an
earlier draft that assumed login-required carts; see
`constitution/decisions.md` ("Cart ownership model — 2026-08-23") for the
full reasoning, including the conversion-rate tradeoff that motivated this.

**In scope:** guest cart (anonymous, cookie-identified), authenticated cart,
implicit merge-on-login, add/update/remove/clear line items, live stock and
price resolution.

**Out of scope for this pass:** wishlist, order/checkout, stock *reservation*
(stock is checked at mutation time, not held), any frontend UI (follow-up
slice), multi-cart-per-user (one cart per identity, guest or authenticated).

---

## Data Model

```prisma
model Cart {
  id          String   @id @default(cuid(2))
  userId      String?  @unique
  guestToken  String?  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       CartItem[]
}

model CartItem {
  id        String   @id @default(cuid(2))
  cartId    String
  variantId String
  quantity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variant   Variant  @relation(fields: [variantId], references: [id], onDelete: Cascade)

  @@unique([cartId, variantId])
  @@index([cartId])
}
```

Prisma requires the inverse sides on existing models: `User.cart Cart?` and
`Variant.cartItems CartItem[]`. These carry no behavior beyond satisfying the
relation declarations.

**Verify `cuid(2)` (not `cuid()`) against existing models before running this
migration.** Inspection during planning found **every model in the schema on
plain `cuid()`** (identity *and* catalog) — a pre-existing drift from
`constitution/decisions.md`'s cuid2 decision. All models move to `cuid(2)` in
the same pass rather than compounding the inconsistency (see Clarifications
#2). Since Prisma generates IDs client-side, this produces no destructive SQL.

**DB constraint (raw SQL in the migration, not expressible in Prisma schema
syntax):** exactly one of `userId` / `guestToken` must be non-null — never
both, never neither. This is the kind of invariant `db-design.md` says belongs
at the database layer, not just application logic.

Prices are never stored on `CartItem` — live-read from `Variant` at request
time. Snapshotting happens at order placement, not here (per
`constitution/domain-map.md`'s Address/order note).

Cascades: delete `User` → their cart goes with it. Delete `Variant` → its
cart line items go with it — inherited from catalog's cascade precedent;
flagging (not blocking) that catalog's variant-deletion strategy might be
worth a soft-delete reconsideration later, since a customer's cart silently
losing an item when a product is discontinued is a UX gap, not just a data
concern. Not cart's decision to make.

---

## Guest Cart Mechanism

- A guest's cart is identified by an opaque `guestToken` in its own cookie —
  **separate from identity's session cookie**, since guests are never
  authenticated. Same cookie rigor as sessions: `httpOnly`, `Secure`,
  `SameSite=Lax`.
- The guest cookie is issued **lazily, on the first mutating cart request**
  (`POST`/`PATCH`/`DELETE`) — never on `GET`, matching the existing "GET
  never creates rows" rule.
- CSRF protection applies to guest cart mutations exactly as it does to
  authenticated ones — a guest's cart is as real a CSRF target as a user's.
  (Mechanism clarified 2026-08-24 — see Clarifications #1.)

## Merge-on-Login (Implicit)

No dedicated merge endpoint. Every cart request resolves ownership via a
`resolveCartOwner` middleware:

1. Authenticated session present, no guest cookie → resolve by `userId`.
2. No session, guest cookie present → resolve by `guestToken` (create lazily
   on first mutation if neither exists yet).
3. **Both present** (just-logged-in user with a leftover guest cookie) →
   merge in a single transaction: for each guest line item, if the user's
   cart already has that variant, sum quantities capped at current stock;
   otherwise add the line. Delete the guest `Cart` row, clear the guest
   cookie. This makes merge a side effect of normal request flow rather than
   a step the frontend has to remember to call — it fires once, naturally,
   the first time a freshly-authenticated user hits any cart endpoint.

This deliberately does not touch identity's `/otp/verify` endpoint — keeps
the two features decoupled, per `backend-architecture.md`'s boundary rules.

---

## API

Mounted at `/api/cart` in `index.ts`. All routes go through
`resolveCartOwner` (not `requireSession` — guests are allowed) and cart CSRF
enforcement on every mutation (see Clarifications #1).

| Method | Route | Behavior |
|---|---|---|
| `GET` | `/api/cart` | Cart DTO for resolved owner; empty shape if no cart exists yet — never creates rows |
| `POST` | `/api/cart/items` | `{ variantId, quantity=1 }` → lazily creates cart (issuing guest cookie if unauthenticated) + adds; increments if line exists; `409 INSUFFICIENT_STOCK` if total qty exceeds stock. Merge-on-login runs first if both identities present. |
| `PATCH` | `/api/cart/items/:itemId` | `{ quantity }` absolute set. **`quantity: 0` is treated as implicit remove** — deletes the line rather than rejecting. Stock re-checked for any value > 0. Owner-scoped 404. |
| `DELETE` | `/api/cart/items/:itemId` | Remove line; owner-scoped 404. |
| `DELETE` | `/api/cart` | Clear all items. |

DTO is explicitly mapped, never Prisma passthrough — items carry live price,
availability, variant attributes, product name/slug, first image; server
computes subtotal.

Error codes (`cart-errors.ts`): `CART_ITEM_NOT_FOUND`, `INSUFFICIENT_STOCK`.
Reuse catalog's `VARIANT_NOT_FOUND` — don't duplicate it.

---

## Concurrency

Add/increment and merge both run inside a transaction with a stock-guarded
atomic update, per `db-design.md`'s concurrency clause — never trust a prior
stock read to still be valid by write time.

---

## Structure

`apps/backend/src/features/cart/{routes,controllers,services,schemas,middleware,__tests__}`,
mirroring catalog/identity layout. `middleware/` holds `resolveCartOwner` and
the cart-local CSRF middleware (added by Clarification #1). Router factory
takes `prisma`.

---

## Tests (`__tests__/`)

- Guest cart: created lazily on first mutation, not on GET
- Authenticated cart: resolved by `userId`
- Merge-on-login: guest cart with items + user logs in with no existing cart
  → guest cart promoted (not just merged-into-empty)
- Merge-on-login: guest cart + user already has overlapping variant → quantity
  summed, capped at stock
- CSRF 403s on all mutations, guest and authenticated
- Add/increment/stock-cap (409 on exceeding stock)
- `PATCH quantity: 0` → item removed, not rejected
- Ownership scoping — one user/guest cannot touch another's cart items (404,
  not 403, to avoid confirming the item's existence)
- DTO mapping — no raw Prisma fields leak through
- Clear cart

---

## Escalation

Ask before proceeding if: the DB CHECK constraint for `userId`/`guestToken`
XOR can't be cleanly expressed in the migration and needs a different
enforcement approach, or catalog's variant cascade-delete behavior needs to
change as a result of this feature (that's catalog's call, not cart's).

---

## Definition of Done

- [ ] `cuid(2)` confirmed (not `cuid()`) on Cart, CartItem, and cross-checked
      against existing models.
- [ ] DB-level CHECK constraint for the userId/guestToken XOR actually applied
      and tested (attempt to insert a row violating it, confirm rejection).
- [ ] Guest cookie confirmed `httpOnly`, `Secure`, `SameSite=Lax` in an actual
      response, not assumed from code.
- [ ] Merge-on-login tested with both empty-user-cart and overlapping-variant
      scenarios.
- [ ] All error codes and the `quantity: 0` behavior verified against a
      running server, not just reasoned about.
- [ ] Backend test suite, typecheck, and lint all run and reported honestly
      (actual repo commands — see `plan.md` Phase 5).

---

## Clarifications — 2026-08-24 (resolved during implementation planning)

These resolve conflicts between this spec and the actual codebase/repo rules.
Where they conflict with text above, they supersede it.

1. **Guest CSRF mechanism.** identity's `requireCsrfToken` always 403s guests:
   it requires `req.csrfToken`, which only `requireSession` sets (from a
   Session row), and guests have no session row. Wiring identity's middleware
   into cart as written would make every guest mutation impossible. Decision:
   cart ships its **own** CSRF middleware — authenticated requests perform the
   exact same header-vs-session-token comparison identity's middleware does;
   unauthenticated requests use classic double-submit (`X-CSRF-Token` header
   vs a non-httpOnly `cart_csrf` cookie issued alongside `guest_token`).
   identity-owned middleware is not modified (interface stability per
   `identity/AGENTS.md`).
2. **cuid drift is repo-wide.** Planning-phase inspection found plain
   `cuid()` on *all* models — User, OtpCode, Session (identity) and Category,
   Collection, Product, Variant, VariantCollection, Image (catalog). Per
   `db-design.md` ("Established strategy: cuid2, for all entities"), all
   models move to `cuid(2)` in cart's migration pass. Client-side defaults →
   zero SQL change, safe for existing rows.
3. **Merge fires on GET too.** The prose above says merge triggers on "any
   cart endpoint", while the API table mandates it only before POST and says
   GET "never creates rows" — yet promoting a guest cart into an empty user
   cart requires creating the user's Cart row. Resolved: merge runs on every
   cart request including GET; the "never creates rows" clause targets lazy
   empty-cart creation for anonymous requests, not merge promotion. Rationale:
   deferring merge to the first mutation would show a freshly-logged-in user
   an empty cart page — broken-feeling UX the implicit-merge decision exists
   to avoid.
4. **Guest token generation.** No cuid2 library is installed; repo precedent
   for hand-generated opaque tokens is `randomBytes(32).toString("hex")`
   (identity's CSRF tokens). `guestToken` values use the same approach —
   stronger entropy than cuid2 and no new dependency.
5. **Response conventions.** Mutating endpoints return the refreshed cart DTO
   (one round trip for frontend state sync). Subtotal sums all lines including
   unavailable ones. Availability leaves only as the `available` boolean —
   never raw stock counts (matches catalog public-read rules).
