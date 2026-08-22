# Implementation Plan — Catalog Public Reads

## Objective

Unauthenticated read-only access to categories, products (with variants), and
collections, following existing backend conventions exactly.

Contract decisions already made:

* Prefix: `/api/<resource>` (no `/admin`, no `/public`)
* Lookup key for detail routes: slug only
* Stock: exposed as `available` boolean only, never raw counts
* Scope: categories + products + collections, all three in this pass
* Images: DTO slot reserved now (`images: []`), model arrives in the images phase

---

## Slice 1 — Schemas

Create `schemas/public.schema.ts`:

* `publicProductListQuerySchema` = `paginationQuerySchema.extend({ category: slugSchema.optional() })`
* Reuse `paginationQuerySchema`, `slugParamSchema` as-is.
* Export from `schemas/index.ts`.

Verifiable alone via Zod unit tests.

## Slice 2 — Public catalog service

Create `services/public-catalog.service.ts`:

* `listPublicCategories({ page, limit })`
* `listPublicProducts({ page, limit, category? })` — joins category by slug when filter present; computes `priceMin`/`priceMax` across variants
* `getPublicProduct({ slug })` — product + ordered variants mapped to public shape
* `listPublicCollections({ page, limit })`
* `getPublicCollection({ slug })` — collection + member variants with product context

Rules enforced here: explicit field selection, `available = stock > 0`,
no raw stock leaves the function, stable ordering. Throws `CatalogError`
404s for unknown slugs, reuses existing error codes.

## Slice 3 — Routes and mounting

Create `routes/public.routes.ts` exposing three routers (or one factory
returning three): categories, products, collections. No identity middleware.

Mount in `index.ts`:

```text
/api/categories   → public categories router
/api/products     → public products router
/api/collections  → public collections router
```

Controllers mirror admin controller style: Zod safeParse at the boundary,
422 on failure, envelope responses, CatalogError → status mapping.

## Slice 4 — Tests

Create `__tests__/public-read.test.ts` covering the AGENTS.md verification
list: unauthenticated shape, pagination bounds, category-slug filtering,
slug 404s, availability mapping, stock absence, zero-variant safety,
and a regression assertion that admin routes still require auth.

## Slice 5 — Feature doc update

Add the public surface to `apps/backend/src/features/catalog/AGENT.md`
(API Surface section gains a "Public Reads" subsection referencing the
feature docs). This is feature documentation, not constitution — allowed.

## Slice 6 — Verification and bookkeeping

* `bun test` from `apps/backend` — full suite green
* `bunx tsc --noEmit -p tsconfig.json` — clean
* Tick task.md items honestly; note anything not run

---

## Completion Criteria

* Storefront-relevant reads work without credentials.
* No admin behavior changed; no auth weakening.
* Public payloads contain only DTO-mapped fields.
* All existing tests still pass.
