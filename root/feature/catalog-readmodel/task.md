# Tasks — Catalog Read Model

Slices follow `plan.md`. Each slice is independently verifiable; tick only
after its verification actually ran.

## Slice 1 — Product.status

* [x] Migration `add_product_status` (enum + column, existing rows →
      PUBLISHED, default DRAFT) applied; `prisma generate` run.
* [x] Admin create defaults to DRAFT; update accepts transitions; list gains
      optional `?status=` filter.
* [x] Public product list + detail return PUBLISHED only; draft detail → 404
      `PRODUCT_NOT_FOUND` (indistinguishable from absent).
* [x] Tests: visibility, draft-detail indistinguishability, admin defaults,
      status filter.

## Slice 2 — Variant.sortOrder

* [x] Migration `add_variant_sort_order` applied; `prisma generate` run.
* [x] Public product detail orders variants by `sortOrder asc, createdAt asc`.
* [x] Seed sets explicit sortOrder per variant.
* [x] Test: ordering respected when it differs from creation order.

## Slice 3 — ColorOption grounding

* [x] Migration `add_color_options` (lookup table + nullable
      `Variant.colorId`) applied; legacy colors backfilled from the frontend
      name→hex map; unmapped values flagged in output.
* [x] Public variant DTOs expose `colorHex: string | null`.
* [x] Admin variant writes accept optional validated `colorId`.
* [x] Tests: colorHex mapping, null-safety, admin colorId validation.

## Slice 4 — Collection read model + storefront grid

* [x] `GET /api/collections/:slug` returns `products[]`
      (`ProductListItemDto`-shaped, full-variant priceMin, membership order,
      published-only).
* [x] Frontend collection page renders `ProductCard` grid identical in
      treatment to `/products`; grouped-variant rows removed; types updated.
* [x] Empty-collection and unknown-slug behavior unchanged.
* [x] Tests: grouping/order, priceMin parity with `/products`, draft
      exclusion, zero-member shape.

## Slice 5 — Verification and bookkeeping

* [x] Full backend suite green — counts reported.
* [x] `bunx tsc --noEmit` clean in apps/backend and apps/frontend.
* [x] ESLint clean on all touched files.
* [x] Live walkthrough: seeded collections render as card grids; drafted
      product disappears publicly and returns on republish.
* [x] `catalog/AGENT.md` API Surface updated for status filter, sortOrder,
      colorHex, and collection `products[]`.
* [x] Full diff reviewed for scope creep.

## Done When

* [x] Collections are a card surface indistinguishable in treatment from Shop.
* [x] No public route can surface draft/archived content.
* [x] Variant order deterministic; swatch hex API-fed; seed satisfies every
      new invariant.
* [x] All migrations additive; nothing destructive; consumers unbroken.
