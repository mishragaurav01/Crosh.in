# Plan: Storefront Browse + Cart feature docs

**Goal:** Create `root/feature/storefront-browse-cart/{AGENTS.md, plan.md, task.md}` —
the next feature after cart backend completion (user-approved direction).

**Status:** Content finalized below; awaiting permission to write files.

---

## Execution steps

1. Write `root/feature/storefront-browse-cart/AGENTS.md` (content: Doc 1)
2. Write `root/feature/storefront-browse-cart/plan.md` (content: Doc 2)
3. Write `root/feature/storefront-browse-cart/task.md` (content: Doc 3)
4. No code changes, no commits. No constitution changes without explicit
   per-token approval (design-system.md additions happen later, during S1/S2,
   one proposal at a time).
5. During implementation slices: user pastes Figma code per screen → run the
   Figma Reconciliation Workflow (below) → record in design-notes.md → implement.

## Figma Reconciliation Workflow (per screen)

User cannot share screenshots; delivers Figma "Copy as Code" text only.

For each pasted screen:

1. **Extract values**: list every color hex, font family/size/weight, radius,
   shadow, spacing value used.
2. **Map to existing tokens** per `design-system.md` color-resolution rule —
   near-duplicates resolve to existing tokens (e.g. `#f7d8d8` → `blush`
   family / `primary-container`). Only true novelties become proposals.
3. **Propose new tokens** (if any) as a table: name, value, usage — wait for
   explicit user OK before touching `design-system.md` or `globals.css`.
4. **Record reconciled spec** in `root/feature/storefront-browse-cart/
   design-notes.md`: per-screen layout description (desktop + mobile),
   token-mapped classes for each region, states captured (empty/error/
   unavailable), open questions.
5. **Implement** with semantic markup + Server Components default; Figma code
   is the visual spec, never pasted literally (absolute positioning and
   hardcoded values get rebuilt with tokens and responsive utilities).

Screen delivery order (aligned to slices):

| Order | Screen | States to request |
|---|---|---|
| 1 | Header/nav + footer frames | sticky/scrolled variant if designed |
| 2 | Home (mobile + desktop) | — |
| 3 | Products list | empty result, pagination |
| 4 | Product detail | variant selected, unavailable variant, image gallery |
| 5 | Collections list + detail | empty collection |
| 6 | Cart | empty cart, filled cart, stock-conflict message if designed |

If a designed state doesn't exist for an error/loading case, fall back to the
minimal states already defined in AGENTS.md.

## Decisions locked (recorded in plan.md)

| # | Question | Decision |
|---|---|---|
| 1 | Route location | New `app/(storefront)/` route group mirroring `(admin)`; stub `app/page.tsx` home moves inside it |
| 2 | Feature folders | Two, mirroring backend boundaries: `app/features/storefront/` + `app/features/cart/`; one shared root feature doc covers both |
| 3 | Cart UI form | Full page at `/cart`, not a drawer — no overlay primitive exists; building one is separate work |
| 4 | Add-to-cart placement | Product detail page only this pass; listing-card quick-add out of scope (variant ambiguity) |
| 5 | Data fetching split | Browse = Server Components on public reads; cart = client-side (cookie-bound guest carts; RSC can't forward them) |
| 6 | Cart state | No global store; server DTO is source of truth; mutations return refreshed DTO (cart backend Clarification #5); refetch on auth change for merge-on-login |
| 7 | Session-expiry interaction | Cart endpoints never 401 → `handleSessionExpiry` can't fire from cart flows; documented so nobody "fixes" it |
| 8 | Price formatting | Single shared `formatPrice` util (INR, `Intl.NumberFormat("en-IN")`); prices arrive as integer minor units |
| 9 | Homepage scope | Thin: hero placeholder + featured grid — now superseded by real Figma design for Home; implement the designed sections |
| 10 | Figma designs | User has Figma designs for ALL six screens at BOTH mobile + desktop. Delivery: Figma "Copy as Code" pasted in chat per screen (no screenshots possible). Workflow: token-reconcile each screen against `design-system.md` → record reconciled spec in `root/feature/storefront-browse-cart/design-notes.md` → implement. New tokens require explicit user approval before entering `design-system.md` + `globals.css`. Categories stay filter-only (decision confirmed). |

## Flags (documented in docs, not bundled into this slice)

- Constitution drift: `frontend-architecture.md` says `src/features/<name>/`, reality is `app/features/<name>/` — docs follow reality; fixing the constitution needs explicit user approval separately
- Legacy duplicates `app/features/login|signup` vs `app/features/identity/login|signup` — future cleanup
- Rate limiting / security headers debt becomes urgent when storefront deploys
- Hard dependency: cart backend Phases 3–5 must land first

---

# Doc 1 — AGENTS.md

```markdown
# AGENTS.md — Feature: Storefront Browse + Cart

## Purpose

First customer-facing slice of Crosh.in: storefront shell, catalog browsing,
and cart UI. Consumes the existing public-read catalog endpoints and the cart
API. **No backend changes** — both APIs already exist (or are completing under
their own features).

**Tier 2 feature slice.** Load alongside this file:

* `apps/frontend/constitution/frontend-architecture.md`
* `apps/frontend/constitution/design-system.md`
* root `constitution/conventions.md` when naming/shared conventions matter
* Backend contracts (read-only): `apps/backend/src/features/catalog/AGENTS.md`
  → Public Reads section, and `apps/backend/src/features/cart/AGENTS.md`

---

## Scope

**In scope:** storefront route group + shell (header/footer), thin homepage,
product list with category filter, product detail with variant selector,
collections list/detail, cart page (add / set quantity / remove line / clear),
guest-cart support, merge-on-login pickup.

**Out of scope for this pass:** checkout, order, payment, wishlist, cart
drawer/slide-over (full page only), quick-add from listing cards, Figma home
marketing sections (carousel/testimonials/newsletter — separate design work),
auth UI changes, legacy duplicate-route cleanup (`app/features/login|signup`),
SEO beyond baseline metadata.

---

## Dependency

This slice consumes the cart API, which must be complete first (`cart`
backend Phases 3–5: endpoints mounted, DTO mapping landed, tests green).
Do not start S3 against an unmouted/unverified cart backend.

The exact cart DTO field names follow whatever the cart backend lands on per
its AGENTS.md — do not invent field names here; inspect the implemented
DTO mapping before wiring components.

---

## Route Map

All customer-facing routes live in a new `app/(storefront)/` route group,
mirroring how admin pages live under `app/(admin)/`. The current stub
`app/page.tsx` moves into the group.

```
(storefront)/
├── layout.tsx                  # header + footer shell
├── page.tsx                    # home (moved from app/page.tsx)
├── products/page.tsx           # list, ?category=<slug> filter
├── products/[slug]/page.tsx    # detail + variant selector
├── collections/page.tsx
├── collections/[slug]/page.tsx
└── cart/page.tsx               # full page, not a drawer
```

Feature-local code lives in two folders, mirroring backend boundaries:

* `app/features/storefront/` — browse components (product card, variant
  selector, category filter, pagination controls)
* `app/features/cart/` — cart API functions + cart page components

Note: `frontend-architecture.md` names `src/features/<name>/`, but every
existing feature lives under `app/features/<name>/` — these docs follow the
actual repo layout. The constitution mismatch is flagged for separate
resolution; do not "fix" it silently inside this feature.

---

## Behavior Contract

1. **Browse pages fetch server-side.** Product/collection/category data comes
   from the public read endpoints via Server Components. Client Components
   appear only where interaction requires (variant selector, add-to-cart,
   pagination/filter controls).
2. **Variant selection.** If a product has >1 variant, size/color pills select
   a variant before Add-to-cart enables. Unavailable variants (`available:
   false`) render visibly but cannot be added. Single-variant products skip
   selection entirely.
3. **Cart mutations return the refreshed cart DTO** (cart backend decision);
   the UI updates state directly from each response — no refetch round trip,
   no duplicated global store.
4. **Merge-on-login is picked up implicitly.** After login, the next cart
   fetch resolves the merged cart server-side. The cart view refetches when
   auth state changes. No merge-specific frontend logic exists.
5. **Session-expiry interaction.** Cart endpoints never return 401 (guests
   allowed), so `handleSessionExpiry` in `lib/api.ts` cannot fire from cart
   flows. Do not add UNAUTHENTICATED handling to cart code — there is nothing
   to handle.
6. **Error mapping.**
   * `409 INSUFFICIENT_STOCK` → inline message near the offending control;
     refresh cart state from the error response if one is provided, else
     refetch.
   * `404 CART_ITEM_NOT_FOUND` → treat as stale UI: refetch cart, show notice.
   * Unknown product/collection slug → Next.js `notFound()` (404 page).
   * All other errors → explicit error state per route; never a silent blank.

---

## Security Notes

* The UI never authorizes anything. `available` is a backend-computed boolean;
  raw stock counts never render anywhere.
* Guest carts ride on backend-set cookies — the frontend never reads, writes,
  or logs `guest_token` or CSRF cookie values directly; `lib/api.ts` already
  handles the CSRF header.
* No session identifiers or tokens in URLs, ever.
* Prices leave the API as integer minor units; formatting happens once in a
  shared `formatPrice` util (INR, `Intl.NumberFormat("en-IN")`). Never
  reinterpret or convert backend price values elsewhere.

---

## Implementation Rules

* Design tokens come from `app/globals.css` (`@theme`) exclusively — the
  Tailwind v4 token layer mirrors `design-system.md`. No hardcoded hex/fonts.
  Known component patterns to reuse: product card (`radius-lg` image,
  brand-tinted shadow), pill buttons, outline buttons, input fields.
* Server Components are the default. Mark client only for genuine
  interactivity (variant selector, quantity steppers, add-to-cart).
* Every data-dependent route segment gets `loading.tsx` and `error.tsx`.
* Reuse `lib/api.ts` (`api.get/post/patch/delete`) — no second fetch wrapper.
  Cart requests need `credentials: "include"`, which the client already sets.
* Empty states are designed, not accidental: empty product list, empty cart
  (with link back to browsing).
* Mobile-first presentation applies here (unlike admin screens) — design-system
  spacing/layout observations were taken from a 390px mobile frame.

---

## Escalation

Ask before proceeding if:

* the cart backend DTO differs materially from its documented contract, or
  cart Phases 3–5 are still open;
* a required design token/component pattern is missing from
  `design-system.md` (e.g., quantity stepper treatment) and multiple materially
  different approaches exist;
* public read endpoints prove insufficient for a required view (e.g., no way
  to list a product's variants without fetching full detail);
* adding any global state, caching layer, or alternate fetching pattern looks
  tempting — that is an architectural change requiring review.

Do not modify a constitution to resolve an implementation question without
explicit approval.

---

## Definition of Done

* [ ] All six routes render with real API data; admin routes untouched.
* [ ] Guest visitor can browse → add to cart → see persisted cart after reload
      (cookie survives), all verified in a real browser.
* [ ] Logged-in user's cart resolves by session; guest→user merge observed
      live (add items as guest, log in, cart merges per backend rules).
* [ ] Variant gating enforced: unavailable variant cannot be added; single-
      variant product needs no selector.
* [ ] All four cart mutation error paths handled per contract clause 6.
* [ ] `loading.tsx`/`error.tsx` present on every data-dependent segment.
* [ ] No hardcoded tokens; no global state library; no second API client.
* [ ] Typecheck and lint run and reported honestly (actual repo commands —
      see plan.md Verification Notes).
```

---

# Doc 2 — plan.md

```markdown
# plan.md — Storefront Browse + Cart

Implementation plan for the storefront-browse-cart slice. Spec lives in
`AGENTS.md`; this file records how it gets built and decisions locked during
planning (2026-08-24). Work proceeds slice by slice; `task.md` tracks the
checklist.

---

## Decisions Locked During Planning

| # | Question | Decision |
|---|---|---|
| 1 | Route location | New `app/(storefront)/` route group mirroring `(admin)`; stub `app/page.tsx` home moves inside it. URL unchanged (`/`). |
| 2 | Feature folders | Two, mirroring backend boundaries: `app/features/storefront/` (browse) and `app/features/cart/` (cart). One root feature doc governs both — they ship as one slice. |
| 3 | Cart UI form | Full page at `/cart`. No drawer/slide-over: no overlay/dialog primitive exists yet and building one is its own piece of work. Header bag icon links to `/cart`. |
| 4 | Add-to-cart placement | Product detail page only. Listing-card quick-add is ambiguous with multi-variant products — deferred. |
| 5 | Data fetching split | Browse pages: Server Components calling public read APIs (no credentials needed). Cart: client-side fetch/mutation — guest carts are cookie-bound and RSC cannot forward browser cookies. |
| 6 | Cart state | No global store (architecture change without demonstrated need). Server DTO is source of truth; mutations return the refreshed DTO (cart backend Clarification #5) → direct state swap. Refetch on auth-state change to surface merge-on-login results. |
| 7 | Session-expiry interaction | Cart endpoints never return 401 (guests allowed) → `handleSessionExpiry` structurally can't fire on cart flows. Documented in AGENTS.md clause 5 so it isn't "fixed" later. |
| 8 | Price formatting | One shared `formatPrice(valueMinorUnits)` util using `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })`. Formatting is the consumer's job per public-reads contract. |
| 9 | Homepage scope | Hero placeholder + featured grid fed by first page of `GET /api/products`. Figma marketing sections (carousel, testimonials, newsletter) are separate future work. |

---

## S1 — Storefront Shell

Files:

```
app/(storefront)/layout.tsx        # shell: TopNavBar-derived header + footer
app/(storefront)/page.tsx          # moved from app/page.tsx
```

* Header evolves the existing `components/TopNavBar.tsx`: Shop → `/products`,
  Collections → `/collections`, bag icon → `/cart`. Keep it a Server Component;
  links need no interactivity.
* Footer: cream-alt background per design system; minimal links this pass.
* Delete `app/page.tsx` after the move (route group serves `/`).

## S2 — Catalog Browse

Files:

```
app/features/storefront/components/product-card.tsx
app/features/storefront/components/category-filter.tsx      # client (URL param)
app/features/storefront/components/pagination.tsx           # client (URL param)
app/features/storefront/components/variant-selector.tsx     # client
app/features/storefront/components/add-to-cart.tsx          # client
lib/format-price.ts
app/(storefront)/products/page.tsx            # server; reads searchParams (Promise)
app/(storefront)/products/[slug]/page.tsx     # server; notFound() on unknown slug
app/(storefront)/collections/page.tsx
app/(storefront)/collections/[slug]/page.tsx
+ loading.tsx / error.tsx per segment
```

* Product list: `GET /api/products?page&limit&category`. Pagination +
  filter mutate URL search params (no client cache of list state).
* Product detail: `GET /api/products/:slug`; renders variants through the
  selector; images `{url, alt}[]` in sortOrder order.
* Variant selector: size × color pills derived from the variants array;
  selecting yields a `variantId`; unavailable variants disabled; Add-to-cart
  enabled only with a selected available variant (or auto-selected single
  variant).
* Collection detail: banner + member variants grouped by `productName`.
* Category banner slot renders when non-null (currently always null — render
  the null path cleanly).

## S3 — Cart Integration

Files:

```
app/features/cart/api.ts             # getCart, addCartItem, setCartItemQty,
                                     # removeCartItem, clearCart — via lib/api.ts
app/features/cart/cart-context.tsx   # optional local provider ONLY if multiple
                                     # components need cart state; prefer passing
                                     # response state down before reaching for it
app/features/cart/components/cart-line.tsx           # client (steppers)
app/features/cart/components/cart-summary.tsx
app/(storefront)/cart/page.tsx       # client page: fetch on mount + on auth change
```

* Mutations swap in the returned refreshed DTO (contract clause 3).
* Error mapping per contract clause 6 (`INSUFFICIENT_STOCK` inline,
  `CART_ITEM_NOT_FOUND` refetch-and-notice, others → error state).
* Quantity steppers: PATCH absolute-set semantics (backend treats 0 as
  remove) — debounce rapid clicks or serialize them; last write wins.
* Clear cart: confirm step, then DELETE `/api/cart`.
* Empty cart state: message + link to `/products`.

## S4 — Verification

Manual walkthrough checklist (real browser, dev servers running):

1. Guest: browse → open product → select variant → add → reload page → cart
   persists (cookie survived).
2. Guest adds item → logs in with an account that has no cart → merged/
   promoted cart visible without manual refresh beyond auth-change refetch.
3. Guest adds overlapping variant → logs in → summed, capped at stock.
4. Unavailable variant cannot be added.
5. PATCH qty beyond stock → inline INSUFFICIENT_STOCK message; cart state
   consistent afterward.
6. Remove line / clear cart behave and re-render correctly.
7. Unknown product/collection slug → 404 page.
8. Admin routes (`/catalog/*`) untouched and still guarded.
9. loading/error states observed by throttling network or stopping backend.

### Verification Notes (repo reality)

* No turbo test task exists for frontend; nothing to run there — report as
  not applicable rather than passing.
* Typecheck: turbo.json defines `check-types`, but the frontend package.json
  defines neither script. Actual command: `bunx tsc --noEmit` in apps/frontend.
* Lint: ESLint runs per changed file. Known pre-existing errors in
  `components/LoginForm.tsx`, `components/TopNavBar.tsx` — do not fix inside
  this slice unless touched; report honestly if TopNavBar edits trip them.

---

## Assumptions (change if wrong)

* Cart backend Phases 3–5 land before S3 starts.
* INR/en-IN is the correct display currency/locale (Crosh.in branding).
* Baseline `<title>`/description metadata suffices; no structured data/OG
  work this pass.
```

---

# Doc 3 — task.md

```markdown
# task.md — Storefront Browse + Cart

Granular checklist. Work top to bottom. Check off only what was actually done
and verified. S3 depends on cart backend Phases 3–5 being complete.

---

## Prerequisites

- [ ] Cart backend mounted at `/api/cart` with DTO mapping landed and tests green
- [ ] Inspect actual cart DTO field names; record them here before wiring UI

## S1 — Shell

- [ ] `app/(storefront)/` group created; `layout.tsx` with header + footer
- [ ] Home page moved from `app/page.tsx` into the group; old file deleted
- [ ] Header links wired: Shop → /products, Collections → /collections, bag → /cart
- [ ] Footer uses cream-alt token treatment
- [ ] Admin routes verified untouched

## S2 — Browse

- [ ] `formatPrice` util added; used everywhere prices render
- [ ] Products list page (server) with pagination + ?category= filter
- [ ] Category filter and pagination update URL params; shareable URLs work
- [ ] Product card component per design system (radius-lg image, brand-tinted shadow, Playfair heading, Inter body)
- [ ] Product detail page (server) with images gallery, price range or selected-variant price
- [ ] Variant selector: size/color pills, unavailable variants disabled, single-variant products bypass selection
- [ ] Add-to-cart client component wired to POST /api/cart/items with selected variantId
- [ ] Collections list + detail pages (banner rendered when present)
- [ ] Unknown slugs hit notFound() → 404 page
- [ ] loading.tsx + error.tsx on every data-dependent segment
- [ ] Empty states designed (no products, empty category result)

## S3 — Cart

- [ ] app/features/cart/api.ts functions over lib/api.ts (no second client)
- [ ] Cart page fetches on mount AND on auth-state change (merge pickup)
- [ ] Line items render name/slug link, attributes, unit price, line total, availability flag
- [ ] Quantity steppers PATCH absolute values; rapid clicks serialized/debounced
- [ ] PATCH quantity 0 removes the line in UI terms (backend semantics)
- [ ] Remove-line button (DELETE item); clear-cart button with confirm (DELETE /api/cart)
- [ ] Subtotal from server DTO only — never recomputed client-side as source of truth
- [ ] INSUFFICIENT_STOCK shows inline message near the control; state stays consistent
- [ ] CART_ITEM_NOT_FOUND treated as stale UI: refetch + notice
- [ ] Empty cart state with link back to /products
- [ ] Cart page loading + error states implemented

## S4 — Verification

- [ ] Full manual walkthrough executed per plan.md S4 checklist (all 9 steps) with outcomes recorded
- [ ] bunx tsc --noEmit run in apps/frontend — result reported
- [ ] ESLint run on changed files — result reported (pre-existing LoginForm/TopNavBar errors noted, not silently ignored)
- [ ] Full diff reviewed for scope creep; deviations reported explicitly

## Reporting

On completion, report: what was built per slice, walkthrough evidence (which
clauses were machine-checked vs eyeballed), typecheck/lint results honestly,
any deviation from AGENTS.md/plan.md, anything left open.
```
