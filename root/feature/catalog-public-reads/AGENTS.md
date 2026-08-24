# AGENTS.md — Catalog Public Reads

## Purpose

Expose unauthenticated, read-only catalog endpoints so customer-facing
consumers (storefront pages, wishlist, cart) can browse categories, products,
variants, and collections.

This is an additive capability of the existing `catalog` feature. All code
lives in `apps/backend/src/features/catalog/`. No new backend feature folder.

**Tier 2 feature slice.** Load alongside this file:

* `apps/backend/constitution/backend-architecture.md`
* `apps/backend/constitution/api-design.md`
* `apps/backend/constitution/security-rules.md`

---

## Visibility Contract

Public endpoints are GET-only and require **no authentication and no
authorization**. This is intentional and is not a weakening of admin rules:

* Existing `/api/admin/*` routes keep `requireSession` + `requireAdmin`.
* Public routes expose reads only; no create/update/delete path may ever be
  added to them.
* If a future requirement needs "public but protected" data, it is a new
  decision — do not mutate these endpoints into it silently.

---

## API Surface

All routes return the standard envelope `{ success, data }` / 
`{ success, error: { code, message } }`. Validation failures use 422 with
`VALIDATION_ERROR`. Unknown slugs use 404 with the entity's `*_NOT_FOUND` code.
Pagination reuses `paginationQuerySchema` (page ≥ 1, limit ≤ 100, default 20).

### Categories

`GET /api/categories`

Paginated list.

```json
{ "id": "...", "name": "...", "slug": "...", "description": null, "banner": null }
```

Each item reserves a `banner: { url, alt } | null` slot; it is always null
until category banners are surfaced publicly.

### Products

`GET /api/products?page=&limit=&category=<categorySlug>`

Paginated list. `category` filters by category slug and is optional.

```json
{
  "id": "...",
  "name": "...",
  "slug": "...",
  "description": null,
  "priceMin": 2999,
  "priceMax": 4999,
  "images": [{ "url": "https://cdn.example/images/product/<id>/<key>.webp", "alt": "Front" }]
}
```

`priceMin`/`priceMax` are computed across the product's variants in integer
minor units (cents). Products with zero variants yield `null` for both.
`images` maps the product's attached images as `{ url, alt }[]` ordered by
`sortOrder` then creation time; products without images yield `[]`.

`GET /api/products/:slug`

Product detail. Same base shape as a list item plus:

```json
{
  "variants": [
    { "id": "...", "sku": "...", "size": "S", "color": "Black", "price": 2999, "available": true }
  ],
  "images": [{ "url": "https://cdn.example/images/product/<id>/<key>.webp", "alt": "Front" }]
}
```

Variants are ordered by creation time ascending (stable display order).

### Collections

`GET /api/collections`

Paginated list: `{ id, name, slug, description }`.

`GET /api/collections/:slug`

Collection detail: list shape plus its banner and member variants:

```json
{
  "banner": { "url": "https://cdn.example/images/collection/<id>/<key>.webp", "alt": "Banner" },
  "variants": [
    { "id": "...", "sku": "...", "size": "...", "color": "...", "price": 2999,
      "available": true, "productId": "...", "productName": "..." }
  ]
}
```

`banner` is `{ url, alt } | null` (null when no banner image is attached).
`productId`/`productName` let consumers group variants under products.
Variants are ordered by membership creation time ascending.

---

## Data Exposure Rules

* Variant `available` is `stock > 0`. Raw `stock` counts must never appear in
  any public response, log line intended for clients, or error message.
* Prices leave the service layer exactly as stored (integer minor units).
  Formatting is the consumer's job.
* Internal IDs (`id`, `productId`) are included deliberately: cart/wishlist
  will reference variant IDs. Slugs remain the lookup key for detail routes;
  internal cuids are never accepted by public routes.
* No field selection shortcuts: public responses use explicit DTO mapping, not
  raw Prisma model passthrough.
* Only derived image URLs leave the system: `{ url, alt }` values are built at
  DTO-mapping time from the configured public base. Object keys, bucket names,
  endpoints, credentials, and signing material never appear in any public
  response.

---

## Implementation Rules

* Follow `Route → Controller → Service → Database`. Services stay
  Express-free; controllers own Zod parsing and status codes, matching the
  existing admin controller style.
* Reuse existing shared schemas where they fit (`paginationQuerySchema`,
  `slugParamSchema`). New public-specific schemas live in
  `schemas/public.schema.ts`.
* Public read logic lives in `services/public-catalog.service.ts`; do not
  modify admin services to serve public shapes.
* Routes file: `routes/public.routes.ts` — no identity middleware attached.
  Mount in `index.ts` at `/api/categories`, `/api/products`, `/api/collections`.
* Tests live in `__tests__/public-read.test.ts`, following the existing Bun
  test conventions of this feature.

## Out of Scope

* Rate limiting (no middleware exists repo-wide yet; noted as future hardening)
* Search, sorting beyond defaults
* Caching / ETags
* Image upload/storage administration (admin-only surface owned by the
  catalog-images feature; these endpoints only map attached images into DTOs)
* Category banner population (slot reserved, filled by a later decision)
* Frontend storefront pages (separate phase)

---

## Verification

Verify at minimum:

* All five endpoints respond without any authentication credentials.
* Admin counterparts still reject unauthenticated requests (no weakening).
* Pagination bounds enforced (limit > 100 → 422).
* `category=<slug>` filter returns only that category's products.
* Unknown product/collection slug → 404 with correct error code.
* Raw stock never appears in any response payload.
* `available` correctly reflects `stock > 0` per variant.
* Product with zero variants does not crash listing or detail.
* Product `images` are mapped `{ url, alt }` in sortOrder order and collection
  detail carries `banner`; no storage keys or configuration leak.
