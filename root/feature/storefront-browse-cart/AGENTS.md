# AGENTS.md — Feature: Storefront Browse + Cart

## Purpose

First customer-facing slice of Crosh.in: storefront shell, catalog browsing,
and cart UI. Consumes the existing public-read catalog endpoints and the cart
API. **No backend changes** — both APIs already exist (cart backend Phases 3–5
must land before S3 starts).

Visual design is Figma-driven. Designs exist for all six screens at mobile +
desktop; the user delivers Figma "Copy as Code" per screen. Every screen goes
through the reconciliation workflow in `plan.md` before implementation, and its
reconciled spec is recorded in `design-notes.md`.

**Tier 2 feature slice.** Load alongside this file:

* `apps/frontend/constitution/frontend-architecture.md`
* `apps/frontend/constitution/design-system.md`
* root `constitution/conventions.md` when naming/shared conventions matter
* Backend contracts (read-only): `apps/backend/src/features/catalog/AGENTS.md`
  → Public Reads section, and `apps/backend/src/features/cart/AGENTS.md`
* This feature's `design-notes.md` (reconciled per-screen specs)

---

## Scope

**In scope:** storefront route group + shell (top app bar, bottom nav bar,
footer), full Home page per design (hero, featured collections, bestsellers,
brand story teaser, testimonials*, newsletter*, footer), products list with
category quick-filter chips + pagination, product detail (swipeable gallery,
variant swatches, details accordion, add-to-cart CTA, related items),
collections list/detail, cart page (add / set quantity / remove / clear),
guest-cart support, merge-on-login pickup.

\* Testimonials and Newsletter are rendered as designed but run on **static
sample content** — no backend domains exist for them (see Integration Gaps).

**Out of scope for this pass:** checkout, order, payment, wishlist *behavior*
(hearts render decoratively, per design, but do nothing), cart drawer/slide-
over, quick-add from listing cards, auth UI changes, legacy duplicate-route
cleanup, SEO beyond baseline metadata, any new backend endpoints.

---

## Dependency

S3 (cart UI) requires cart backend Phases 3–5 complete: endpoints mounted,
DTO mapping landed, tests green. Do not start S3 against an unmouted/unverified
cart backend. Exact cart DTO field names come from the implemented mapping —
inspect before wiring; never invent field names.

---

## Route Map

All customer-facing routes live in `app/(storefront)/`, mirroring `(admin)`.
The stub `app/page.tsx` moves into the group (URL unchanged).

```
(storefront)/
├── layout.tsx                  # top app bar + bottom nav + footer shell
├── page.tsx                    # home (moved from app/page.tsx)
├── products/page.tsx           # list, ?category=<slug> quick-filter
├── products/[slug]/page.tsx    # detail + gallery + variants + related
├── collections/page.tsx
├── collections/[slug]/page.tsx
└── cart/page.tsx               # full page, not a drawer
```

Feature-local code mirrors backend boundaries:

* `app/features/storefront/` — browse components (hero, product card, filter
  chips, gallery, variant selector, accordion, section blocks)
* `app/features/cart/` — cart API functions + cart page components + cart
  badge (bottom nav)

Note: `frontend-architecture.md` names `src/features/<name>/`, but every
existing feature lives under `app/features/<name>/` — these docs follow the
actual repo layout. The mismatch is flagged for separate resolution; do not
"fix" it silently here.

---

## Behavior Contract

1. **Browse pages fetch server-side.** Product/collection/category data comes
   from public read endpoints via Server Components. Client Components only
   where interaction requires: filter chips, pagination, gallery, variant
   selector, add-to-cart, quantity steppers, cart badge, accordion.
2. **Variant selection.** >1 variant ⇒ swatch pills select a variant before
   Add-to-cart enables; selected swatch shows the double-ring treatment;
   unavailable variants render at 60% opacity and cannot be added.
   Single-variant products skip selection. See Integration Gaps for swatch
   color sourcing.
3. **Cart mutations return the refreshed cart DTO** (cart backend Clarification
   #5); UI swaps state directly from each response — no refetch round trip, no
   duplicated global store. A minimal cart-state provider feeds the bottom-nav
   badge and cart page.
4. **Merge-on-login is picked up implicitly**: after login the next cart fetch
   resolves the merged server-side; cart surfaces refetch on auth change.
5. **Session-expiry interaction.** Cart endpoints never return 401 (guests
   allowed), so `handleSessionExpiry` cannot fire from cart flows. Do not add
   UNAUTHENTICATED handling to cart code.
6. **Error mapping.**
   * `409 INSUFFICIENT_STOCK` → inline message near the control; refresh state
     from error response if provided, else refetch.
   * `404 CART_ITEM_NOT_FOUND` → stale UI: refetch cart + notice.
   * Unknown product/collection slug → `notFound()` (404 page).
   * Everything else → explicit error state; never a silent blank.
7. **Pagination** uses URL search params (`?page=`), rendered as the designed
   outline "Load More"-style pill per `design-notes.md`.

---

## Security Notes

* The UI never authorizes anything. `available` is backend-computed; raw stock
  counts never render anywhere.
* Guest carts ride on backend-set cookies — the frontend never reads/writes/
  logs `guest_token` or CSRF cookies directly; `lib/api.ts` handles the header.
* No session identifiers or tokens in URLs.
* Prices arrive as integer minor units; format only via shared `formatPrice`.
* Static-content sections (testimonials, newsletter, brand story) contain no
  user-supplied text paths; when real backends arrive, treat submitted text as
  text, never HTML.

---

## Implementation Rules

* Design tokens from `app/globals.css` (`@theme`) exclusively — no hardcoded
  hex/fonts/radii/shadows. Proposed additions live in `design-notes.md` and
  enter the token layer only after explicit user approval.
* Server Components are the default; mark client only for genuine
  interactivity.
* Every data-dependent route segment gets `loading.tsx` and `error.tsx`.
* Reuse `lib/api.ts` — no second fetch wrapper (`credentials: "include"` is
  already set).
* Empty states are designed, not accidental: empty product list, empty
  collection, empty cart (with link back to browsing).
* Mobile-first per the 390px frames; desktop layouts follow desktop frames as
  they are delivered (fallback: sensible token-consistent adaptation, recorded
  in design-notes as "desktop: adapted, not designed").
* Images: use `next/image` where practical; derived CDN URLs from DTOs only.

---

## Integration Gaps (decided defaults — override explicitly if wrong)

| Gap | Default this pass |
|---|---|
| Reviews section (product page) has no backend | Render designed layout with clearly-static sample content; no API calls |
| Wishlist hearts have no backend | Render per design; buttons decorative (disabled semantics); follow-up feature |
| Related items "You might also love" | Same-category products via `GET /api/products?category=<product's category slug>` excluding current |
| Variant swatch colors — DB stores `color` as a name string only | Frontend name→hex map (`app/features/storefront/swatch-colors.ts`) for known names; unknown names fall back to neutral circle + initial; recorded as future schema candidate (needs backend/db decision, not cart's call) |
| Newsletter form has no subscriber backend | Rendered per design; submit is a visible no-op with a "coming soon" notice; tracked follow-up |
| Bottom-nav "Account" destination | `/features/identity/login` for now (no customer account page exists) |
| Currency | **Resolved:** INR ₹ via `formatPrice` despite `$` in mockups (user-confirmed 2026-08-24) |
| Testimonial carousel dots | Static first-slide render; rotation is client polish, added only if trivial |

---

## Escalation

Ask before proceeding if:

* the cart backend DTO differs materially from its documented contract, or
  Phases 3–5 are still open;
* a required token/component pattern is missing and materially different
  implementations exist;
* public read endpoints prove insufficient for a required view;
* global state, caching layers, or alternate fetching patterns start looking
  tempting — architectural change requiring review;
* a designed element has no data source at all beyond the gaps tabled above.

Do not modify a constitution (including `design-system.md`) without explicit
per-change approval.

---

## Definition of Done

* [ ] All six routes render per reconciled designs (mobile exact; desktop per
      frames or recorded adaptation); admin routes untouched.
* [ ] Guest visitor can browse → add to cart → reload → cart persists (real
      browser verified).
* [ ] Guest→user merge observed live after login.
* [ ] Variant gating enforced (unavailable cannot be added; single-variant
      bypasses selection).
* [ ] All cart mutation error paths handled per contract clause 6.
* [ ] Token additions approved by user and applied to design-system.md +
      globals.css in the same change that uses them.
* [ ] `loading.tsx`/`error.tsx` on every data-dependent segment.
* [ ] No hardcoded tokens, no global state library, no second API client.
* [ ] Typecheck and lint run and reported honestly (actual commands — see
      plan.md Verification Notes).
