# Implementation Plan — Catalog Read Model

## Objective

Four additive schema/read-model changes that let the storefront treat
collections like the catalog: card-ready collection contents, a publication
lifecycle, deterministic variant order, and grounded color data — each slice
independently verifiable, none destructive.

---

## Slice 1 — `Product.status`

1. Migration `add_product_status`: enum `ProductStatus`
   (`DRAFT | PUBLISHED | ARCHIVED`), column with data migration
   `UPDATE ... SET status = 'PUBLISHED'` for existing rows; column default
   `DRAFT` for new rows. `bunx prisma generate`.
2. Admin schemas/services: create accepts optional status (default DRAFT);
   update accepts status transitions; list gains optional `?status=`.
3. Public reads: list and detail return PUBLISHED only; unknown-or-draft slug
   both yield 404 with the existing code.
4. Tests: published-only listing, draft-detail 404 indistinguishability,
   admin default-DRAFT on create, status filter, archived hidden publicly.

## Slice 2 — `Variant.sortOrder`

1. Migration `add_variant_sort_order`: Int, default 0, no backfill needed.
2. Public product detail ordering becomes `sortOrder asc, createdAt asc`.
3. Seed sets explicit sortOrder values (0..n per product).
4. Test: ordering respected when sortOrder differs from creation order.

## Slice 3 — `ColorOption` grounding

1. Migration `add_color_options`: model `{ id cuid, name unique,
   hex Char(7) }`; nullable `Variant.colorId` FK. No enforcement change.
2. Backfill within the migration's deployment step or a one-off script:
   map distinct legacy color strings to options using
   `apps/frontend/app/features/storefront/swatch-colors.ts` as the name→hex
   source of truth (unmapped names get an option row with neutral hex and are
   flagged in output).
3. Public variant DTOs gain `colorHex: string | null`.
4. Admin variant write paths accept optional `colorId` (validated to exist).
5. Tests: colorHex present/null-safe, backfill idempotence, admin colorId
   validation error path.

## Slice 4 — Collection detail read model + storefront grid

1. Backend: extend `getPublicCollection` mapping to emit `products[]` —
   member variants grouped by distinct product preserving first-seen order.
   Each summary is shaped exactly as `ProductListItemDto`, and `priceMin` is
   computed across the product's FULL variant set (not just member variants),
   so cards never disagree between `/products` and `/collections/[slug]`.
   Published-only products included.
2. Frontend: `collections/[slug]/page.tsx` renders `ProductCard` grid with
   the same classes as the products grid; grouped-variant list removed;
   empty state and 404 behavior unchanged; types file updated.
3. Tests: grouping/order, priceMin parity with `/products` for the same
   product, image mapping, zero-member collection → empty grid state,
   draft-product exclusion from `products[]`.

## Slice 5 — Verification and bookkeeping

* Full `bun test` suite; report counts.
* `bunx tsc --noEmit` backend + frontend; ESLint on touched files.
* Live walkthrough against seeded data: collections render as card grids;
  drafted seed product vanishes publicly, reappears when republished.
* Tick task.md honestly; update `catalog/AGENT.md` API Surface (feature doc).

---

## Completion Criteria

* `/collections/[slug]` is visually and behaviorally a product-card surface —
  same component, same DTO shape, same price logic as `/products`.
* Unpublished content cannot leak through any public route.
* Variant display order is deterministic and admin-controllable via field
  value (UI later).
* Colors resolve from lookup data; swatch hex flows from the API.
* No destructive migration; every consumer of changed endpoints still works.
