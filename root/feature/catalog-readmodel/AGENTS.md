# AGENTS.md — Catalog Read Model

## Purpose

Close the gap between what the catalog schema stores and what customer-facing
surfaces need: make collection pages render real product cards, give catalog
content a publication lifecycle, and replace free-text variant attributes with
grounded data — without breaking any existing consumer.

This is an additive evolution of the existing `catalog` feature (backend),
`packages/db`, and one storefront surface. It is a separate feature precisely
because `storefront-browse-cart` declared "no backend changes"; those changes
are authorized HERE instead.

**Tier 2 feature slice.** Load alongside this file:

* `packages/db/constitution/db-design.md` (schema/migration work)
* `apps/backend/constitution/backend-architecture.md`
* `apps/backend/constitution/api-design.md`
* root `constitution/conventions.md`
* When touching the collections page: `apps/frontend/AGENTS.md` +
  `root/feature/storefront-browse-cart/design-notes.md` (read-only reference)

---

## Scope

**In scope:**

1. **Collection detail read model** — `GET /api/collections/:slug` gains
   card-ready product summaries (`products[]`) shaped exactly like
   `ProductListItemDto`, derived by grouping member variants, membership order
   preserved. Existing `variants[]` array is retained.
2. **Product lifecycle** — `Product.status` enum (`DRAFT | PUBLISHED |
   ARCHIVED`). Public reads return published products only (draft detail →
   404, never a distinguishable "exists but hidden"). Admin writes gain
   status handling; admin list gains an optional status filter.
3. **Variant ordering** — `Variant.sortOrder` (Int, default 0); public product
   detail orders by `sortOrder asc, createdAt asc`.
4. **Color grounding** — `ColorOption` lookup table (`id, name unique, hex`);
   nullable `Variant.colorId` FK added alongside the existing `color` string
   (transition period: both populated where possible; enforcement deferred).
   Public variant DTOs gain `colorHex: string | null`.
5. **Seed upkeep** — `packages/db/prisma/seed.ts` updated so seeded data
   satisfies every new invariant (published status, sort orders, color
   options).

**Out of scope:**

* Image ownership CHECK constraints and primary-image semantics (deferred
  hygiene item; tracked in design-notes)
* Full attribute/EAV modeling, size normalization
* Admin UI screens for managing statuses/colors (endpoints only)
* Any new public endpoint beyond enriching existing ones
* Search, sorting parameters, caching

---

## Contract Decisions (defaults — override explicitly before build)

| Decision | Default |
|---|---|
| Existing rows at migration time | become `PUBLISHED` (storefront unchanged) |
| New-product default status (admin create) | `DRAFT` |
| Draft product/collection detail via public route | `404 PRODUCT_NOT_FOUND` — indistinguishable from absent |
| `variants[]` in collection detail | kept (future variant-chip UI), consumers may ignore it |
| Membership order | preserved into `products[]` (first-seen product order) |
| `colorId` enforcement (drop string reliance) | deferred until admin color management exists |
| Admin list default | returns all statuses; `?status=` filters optionally |

---

## Implementation Rules

* Schema changes ship as additive migrations with descriptive names; no
  destructive operations, no hand-edited applied migrations. Run
  `bunx prisma generate` after each schema change.
* Public responses stay strictly DTO-mapped: raw stock counts never leave the
  service layer; `available = stock > 0` unchanged.
* `products[]` summaries must reuse the existing `ProductListItemDto` shape —
  do not invent a parallel card shape for collections.
* Backend changes stay inside `Route → Controller → Service → Database`;
  read-model grouping happens in `public-catalog.service.ts`, not controllers.
* Frontend changes limited to `app/(storefront)/collections/[slug]/page.tsx`
  and the storefront types file; `ProductCard` is reused as-is.
* Feature docs updated (`catalog/AGENT.md` API Surface) — documentation only,
  never constitution files.

---

## Verification (minimum bar)

* All existing tests stay green; new behavior covered by Bun tests:
  published-only visibility, draft-detail 404 indistinguishability, status
  filtering, variant ordering, colorHex mapping, collection `products[]`
  grouping/order/price/image correctness.
* `bunx tsc --noEmit` clean in backend and frontend; ESLint clean on touched
  files.
* Live walkthrough: seeded collection renders as a product-card grid identical
  in treatment to `/products`; a drafted product disappears from public
  surfaces while remaining visible to admin.
* Report honestly which checks ran vs reasoned.

---

## Escalation

Stop and ask if: any migration turns destructive, `colorId` backfill cannot
map a legacy color value, the DTO enrichment would break a documented
consumer, or scope creep toward admin UI starts looking necessary.
