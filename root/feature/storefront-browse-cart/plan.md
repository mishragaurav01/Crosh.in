# plan.md — Storefront Browse + Cart

Implementation plan. Spec lives in `AGENTS.md`; this file records how it gets
built and decisions locked during planning (2026-08-24). Work proceeds slice by
slice; `task.md` tracks the checklist; `design-notes.md` holds reconciled
per-screen Figma specs.

---

## Decisions Locked During Planning

| # | Question | Decision |
|---|---|---|
| 1 | Route location | New `app/(storefront)/` route group mirroring `(admin)`; stub `app/page.tsx` moves inside it (URL unchanged) |
| 2 | Feature folders | `app/features/storefront/` (browse) + `app/features/cart/` (cart), mirroring backend boundaries; one root feature doc governs both — one delivery slice |
| 3 | Cart UI form | Full page at `/cart`, not a drawer (no overlay primitive exists; building one is separate work). Bottom-nav bag links there |
| 4 | Add-to-cart placement | Product detail page only; listing-card quick-add deferred (variant ambiguity) |
| 5 | Data fetching split | Browse = Server Components on public reads. Cart = client-side (cookie-bound guest carts; RSC cannot forward browser cookies) |
| 6 | Cart state | No global store. Server DTO is source of truth; mutations return refreshed DTO → direct state swap. Minimal cart provider feeds bottom-nav badge + cart page; refetch on auth change for merge-on-login |
| 7 | Session-expiry interaction | Cart endpoints never 401 → `handleSessionExpiry` structurally can't fire on cart flows; documented so nobody "fixes" it later |
| 8 | Price formatting | Single shared `formatPrice` util (`Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })`). Designs show `$` — INR stands unless user overrides (Integration Gap table) |
| 9 | Homepage scope | Superseded: real Figma Home design exists → implement all designed sections (hero, featured collections, bestsellers, brand story, testimonials, newsletter, footer); static content where no backend exists |
| 10 | Figma designs | User delivers "Copy as Code" per screen in chat (no screenshots possible). All six screens, mobile + desktop. Reconcile before implementing; record in `design-notes.md` |
| 11 | Categories browsing | Filter-only via quick-filter chips on `/products?category=<slug>` (no category detail endpoint exists) — confirmed by user |
| 12 | Nimbus Sans sightings | Figma missing-font artifact, not a third typeface — mapped to Inter everywhere |

---

## Token Reconciliation Results (Home, Products list, Product detail — mobile)

All colors map to existing tokens. Three exist only in `globals.css`, not the
design-system table — propose tabulating them:

* `primary-fixed-dim #DDC0C0` (testimonial quote icon)
* `outline-variant #D2C3C3` (inactive filter chip border)
* `surface-container #F3ECEC` (inactive filter chip background)

**Typography proposals (need explicit approval before use):**

| ID | Proposal | Seen in |
|---|---|---|
| T1 | Playfair Display 18px/22px regular — grid product titles | Collection page cards ("Sage Meadow Tote") |
| T2 | Inter 14px/20px medium, tracking 0.7px (+ uppercase variant for labels like SELECT COLOR) — eyebrow/label role | Product info price label, accordion headers, review authors, related card titles |
| T3 | Inter 16px/26px regular — relaxed body role (descriptions, footer links, related prices) | Product description, footers |
| ~~T4~~ | **RESOLVED by user:** all prices normalize to `sage-dark (#56615B)` everywhere — including Home bestsellers (was #4F4444) and related-item cards (was #705959) | All price surfaces |

**Resolved alongside:** currency = INR ₹ via `formatPrice` (user-confirmed,
despite `$` in mockups). No-backend section defaults approved: static reviews +
testimonials, decorative wishlist hearts, no-op newsletter with notice.

**Shadow/radius proposals:**

| ID | Proposal |
|---|---|
| S1 | Review-card shadow `0px 20px 40px rgba(112,89,89,0.04)` |
| S2 | Primary CTA shadow `0px 10px 15px -3px rgba(112,89,89,0.1), 0px 4px 6px -4px rgba(112,89,89,0.1)` |
| S3 | Bottom-nav shadow blur drift: doc says 10px, frames say 20px — recommend 20px (newer frames); design-system.md edit needs approval |
| R1 | Footer/catalog-footer top-corner radius 32px treatment |

Newsletter subscribe button is mauve-brown with **radius-md (12px)**, not pill —
recorded as an intentional component variation.

---

## Slices

### S1 — Shell + Home

```
app/(storefront)/layout.tsx        # TopAppBar (mobile: menu/logo/bag; desktop:
                                   # inline nav per admin-era TopNavBar patterns),
                                   # BottomNavBar (client: active state + cart badge),
                                   # Footer (desktop variant per frame when delivered)
app/(storefront)/page.tsx          # full Home per design-notes
app/features/storefront/components/hero.tsx
app/features/storefront/components/collection-rail.tsx     # circular thumbs, h-scroll
app/features/storefront/components/product-card.tsx        # shared by rails/grids
app/features/storefront/components/brand-story.tsx
app/features/storefront/components/testimonial-card.tsx    # static content
app/features/storefront/components/newsletter-signup.tsx   # client (no-op submit)
lib/format-price.ts
```

Desktop Home frame pending from user; mobile implemented exactly as delivered.

### S2 — Catalog Browse

```
app/(storefront)/products/page.tsx            # server; searchParams (Promise)
app/(storefront)/products/[slug]/page.tsx     # server; notFound() on unknown slug
app/(storefront)/collections/page.tsx
app/(storefront)/collections/[slug]/page.tsx
+ loading.tsx / error.tsx per segment
app/features/storefront/components/filter-chips.tsx        # client; URL params
app/features/storefront/components/pagination.tsx          # client; URL params
app/features/storefront/components/image-gallery.tsx       # client; swipe + dots
app/features/storefront/components/variant-swatches.tsx    # client
app/features/storefront/components/details-accordion.tsx   # client
app/features/storefront/components/add-to-cart-cta.tsx     # client
app/features/storefront/components/related-rail.tsx        # same-category fetch
app/features/storefront/swatch-colors.ts                   # name→hex map
```

Related rail: product's own category slug → `GET /api/products?category=…`,
exclude current product. Reviews section: static sample layout (gap table).

### S3 — Cart Integration

```
app/features/cart/api.ts             # getCart/addCartItem/setCartItemQty/
                                     # removeCartItem/clearCart over lib/api.ts
app/features/cart/cart-context.tsx   # minimal provider: state + mutations +
                                     # refetch-on-auth-change
app/features/cart/components/cart-badge.tsx                # bottom nav count
app/features/cart/components/cart-line.tsx                 # steppers (serialized)
app/features/cart/components/cart-summary.tsx
app/(storefront)/cart/page.tsx       # empty/filled/error states
```

Quantity steppers use PATCH absolute-set semantics (backend treats 0 as
remove); rapid clicks serialized, last write wins. Errors per contract clause 6.

### S4 — Verification

Manual walkthrough (real browser, both dev servers): the nine-step guest/login
merge/gating/error checklist from task.md, plus visual comparison of built
pages against delivered frames at 390px.

#### Verification Notes (repo reality)

* No frontend test runner wired — nothing to run; report as not applicable.
* Typecheck: turbo.json defines `check-types` but package.json has neither
  script. Actual command: `bunx tsc --noEmit` in apps/frontend.
* Lint: ESLint per changed file. Known pre-existing errors in
  `components/LoginForm.tsx` and `components/TopNavBar.tsx` — report honestly;
  do not fix unless this slice touches them.

---

## Assumptions (change if wrong)

* Cart backend Phases 3–5 land before S3 starts.
* INR/en-IN display stands despite `$` in mockups.
* Static sections ship with sample copy from the frames, clearly marked in code.
* Desktop frames for remaining screens arrive before their slice starts;
  otherwise token-consistent adaptation is recorded in design-notes.md.
