# Tasks — Catalog Public Reads

Slices follow `plan.md`. Each slice is independently verifiable; tick only
after its verification actually ran.

## Slice 1 — Schemas

* [x] Add `publicProductListQuerySchema` (pagination + optional `category` slug) in `schemas/public.schema.ts`.
* [x] Export new public schemas from `schemas/index.ts`.
* [x] Confirm reuse of `paginationQuerySchema` and `slugParamSchema` without duplication.

## Slice 2 — Service

* [x] Implement `listPublicCategories`, `listPublicProducts`, `getPublicProduct`, `listPublicCollections`, `getPublicCollection` in `services/public-catalog.service.ts`.
* [x] Enforce DTO mapping: no raw model passthrough, no raw stock, `available = stock > 0`.
* [x] Compute `priceMin`/`priceMax` with null-safe zero-variant handling.
* [x] Throw existing `CatalogError` codes (`PRODUCT_NOT_FOUND`, `COLLECTION_NOT_FOUND`) on unknown slugs.

## Slice 3 — Routes + mount

* [x] Create `routes/public.routes.ts`; GET-only handlers; no identity middleware.
* [x] Mount at `/api/categories`, `/api/products`, `/api/collections` in `index.ts`.

## Slice 4 — Tests

* [x] Cover all five endpoints: success envelope, pagination bounds, category filter, slug 404s.
* [x] Assert raw stock never appears in any payload; assert `available` mapping.
* [x] Assert zero-variant product lists/details do not crash.
* [x] Regression: `/api/admin/*` still rejects unauthenticated requests.

## Slice 5 — Feature doc

* [x] Add "Public Reads" subsection to the API Surface in `apps/backend/src/features/catalog/AGENT.md`.

## Slice 6 — Verification

* [x] Run `bun test` (full backend suite) — report counts.
* [x] Run `bunx tsc --noEmit -p tsconfig.json` from `apps/backend`.
* [x] Review full diff for unrelated changes.

## Done When

* [x] All five public endpoints answer without credentials.
* [x] Admin authorization unchanged and proven by test.
* [x] Public payloads are DTO-mapped only (no stock counts, no DB passthrough).
* [x] Full suite green, typecheck clean.
