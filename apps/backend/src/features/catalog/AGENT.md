# AGENTS.md — Feature: Catalog

## Purpose

Delta-only spec for the `catalog` feature: category, collection, product, and
variant management.

This document does not restate backend architecture, API conventions, database
rules, or security baselines. Those remain governed by the applicable
repository and backend constitution documents.

**Tier 2 feature** per `constitution/domain-map.md`.

Load alongside this file:

* `apps/backend/constitution/backend-architecture.md`
* `apps/backend/constitution/api-design.md`
* `apps/backend/constitution/security-rules.md`
* `packages/db/constitution/db-design.md`
* root `constitution/conventions.md` when applicable

---

## Scope

Catalog owns the product catalog structure:

* categories
* products
* product variants
* collections
* product-to-collection membership

Catalog does not own:

* cart behavior
* orders
* payments
* shipments
* user addresses
* authentication
* warehouse-level inventory management
* stock movement history

The `stock` value on a variant is currently part of the variant's catalog
representation. A future inventory domain may take ownership of stock movement,
reservation, warehouse, or availability logic.

---

## Roles

Catalog management endpoints are administrative operations.

Only authenticated users with the appropriate administrative permission may:

* create categories
* update categories
* delete categories
* create collections
* update collections
* delete collections
* create products
* update products
* delete products
* create variants
* update variants
* delete variants
* add products to collections
* remove products from collections

Public catalog-read behavior may be introduced separately and must not weaken
the authorization requirements of management endpoints.

Authorization must always be enforced by the backend.

---

## Data Model

All IDs use cuid2.

### Category

* `id`
* `name`
* `description`
* `slug`
* `createdAt`
* `updatedAt`

Rules:

* `name` is required.
* `description` is nullable.
* `slug` is required and unique.
* Slugs must be normalized consistently.
* Category names do not need to be globally unique unless the implementation
  establishes that requirement explicitly.

### Collection

* `id`
* `name`
* `description`
* `slug`
* `createdAt`
* `updatedAt`

Rules:

* `name` is required.
* `description` is nullable.
* `slug` is required and unique.
* Slugs must be normalized consistently.

### Product

* `id`
* `name`
* `description`
* `slug`
* `categoryId`
* `createdAt`
* `updatedAt`

Rules:

* `name` is required.
* `description` is nullable.
* `slug` is required and unique.
* `categoryId` is required.
* A product belongs to exactly one category in the current model.

### Variant

* `id`
* `sku`
* `size`
* `color`
* `price`
* `stock`
* `productId`
* `createdAt`
* `updatedAt`

Rules:

* `sku` is required and unique.
* `size` is required.
* `color` is required.
* `price` is stored as an integer monetary value in the database; do not use
  floating-point storage for money.
* `stock` is an integer and must never be negative.
* `productId` is required.
* A variant belongs to exactly one product.

### ProductCollection

* `id`
* `productId`
* `collectionId`
* `createdAt`

Rules:

* `productId` is required.
* `collectionId` is required.
* A product may belong to many collections.
* A collection may contain many products.
* The `(productId, collectionId)` pair must be unique.
* Creating an existing membership must not create a duplicate row.

---

## Relationships

```text
Category
   │
   └── Product
          │
          └── Variant

Collection
   │
   └── ProductCollection
          │
          └── Product
```

The database must enforce the foreign-key relationships.

Do not duplicate product/category/collection relationships in application
state when the database relationship is the source of truth.

---

## API Surface

The exact routes are defined here rather than in the repository-wide API
constitution because catalog-specific behavior belongs to this feature.

### Categories

`POST /api/admin/categories`

Create a category.

`GET /api/admin/categories`

List categories.

`GET /api/admin/categories/:id`

Retrieve a category.

`PATCH /api/admin/categories/:id`

Update a category.

`DELETE /api/admin/categories/:id`

Delete a category.

### Collections

`POST /api/admin/collections`

Create a collection.

`GET /api/admin/collections`

List collections.

`GET /api/admin/collections/:id`

Retrieve a collection.

`PATCH /api/admin/collections/:id`

Update a collection.

`DELETE /api/admin/collections/:id`

Delete a collection.

### Products

`POST /api/admin/products`

Create a product.

`GET /api/admin/products`

List products.

`GET /api/admin/products/:id`

Retrieve a product.

`PATCH /api/admin/products/:id`

Update a product.

`DELETE /api/admin/products/:id`

Delete a product.

### Variants

`POST /api/admin/products/:productId/variants`

Create a variant for a product.

`GET /api/admin/products/:productId/variants`

List variants belonging to a product.

`GET /api/admin/products/:productId/variants/:variantId`

Retrieve a variant.

`PATCH /api/admin/products/:productId/variants/:variantId`

Update a variant.

`DELETE /api/admin/products/:productId/variants/:variantId`

Delete a variant.

### Product / Collection Membership

`POST /api/admin/collections/:collectionId/products/:productId`

Add a product to a collection.

`DELETE /api/admin/collections/:collectionId/products/:productId`

Remove a product from a collection.

---

## Slugs

Slugs are API-visible identifiers but database IDs remain the canonical
identifiers internally.

When a slug is changed:

* the uniqueness constraint must still be enforced;
* references should continue using IDs;
* no automatic redirect/history system is introduced at this stage.

Slug generation may be automatic from the name, but the API must define
whether the client may explicitly provide a slug.

This behavior must be implemented consistently across Category, Collection,
and Product.

---

## Pagination

Collection endpoints that can grow must use bounded pagination.

At minimum:

* categories: paginated
* collections: paginated
* products: paginated
* variants: paginated

The implementation must not return an unbounded collection.

Pagination parameters and response shape must remain consistent within the
feature.

---

## Filtering

Product listing should support category filtering.

Collection membership listing should support retrieving products belonging to a
specific collection.

Do not expose arbitrary database fields as filtering parameters.

Additional filtering, sorting, or search should be added only when an actual
catalog requirement exists.

---

## Validation

All request input must be validated with Zod.

Validation includes:

* body fields
* route parameters
* query parameters
* IDs
* slugs
* numeric price values
* stock values
* pagination parameters

`price` must reject invalid monetary values.

`stock` must reject negative values.

---

## Deletion

Deletion must respect existing relationships.

Before implementing destructive deletion behavior, determine whether the
domain should:

* reject deletion when dependent records exist;
* cascade deletion;
* detach relationships;
* soft delete.

Do not silently choose destructive cascading behavior.

The initial implementation should prefer preventing accidental deletion of
entities that still have dependent business data.

---

## Error Codes

Feature-specific error codes should include, where applicable:

| Code                              | Meaning                                |
| --------------------------------- | -------------------------------------- |
| `CATEGORY_NOT_FOUND`              | Category does not exist                |
| `COLLECTION_NOT_FOUND`            | Collection does not exist              |
| `PRODUCT_NOT_FOUND`               | Product does not exist                 |
| `VARIANT_NOT_FOUND`               | Variant does not exist                 |
| `DUPLICATE_SLUG`                  | Slug is already in use                 |
| `DUPLICATE_SKU`                   | SKU is already in use                  |
| `DUPLICATE_COLLECTION_MEMBERSHIP` | Product is already in collection       |
| `INVALID_CATEGORY`                | Product references an invalid category |
| `INVALID_PRODUCT`                 | Variant references an invalid product  |
| `VALIDATION_ERROR`                | Request input is invalid               |

Exact status-code mapping must follow the backend API constitution.

---

## Service Boundaries

Services own catalog business logic.

Examples:

* category service
* collection service
* product service
* variant service
* collection membership service

Do not create services merely to wrap a single Prisma call unless the service
boundary is useful for the feature's business behavior.

No repository layer should be introduced.

---

## Security

All catalog management endpoints are protected administrative operations.

The backend must:

1. authenticate the request;
2. verify administrative authorization;
3. validate input;
4. execute the catalog operation.

Never trust the frontend admin UI as the authorization boundary.

Do not expose database errors, Prisma errors, or internal implementation
details through API responses.

---

## Definition of Done

* [ ] Category CRUD implemented.
* [ ] Collection CRUD implemented.
* [ ] Product CRUD implemented.
* [ ] Variant CRUD implemented.
* [ ] Product/collection membership implemented.
* [ ] Administrative authorization enforced on every management endpoint.
* [ ] Zod validation implemented.
* [ ] Pagination implemented for growing collections.
* [ ] Slug uniqueness enforced.
* [ ] SKU uniqueness enforced.
* [ ] Product/collection membership uniqueness enforced.
* [ ] Negative stock rejected.
* [ ] Monetary values do not use floating-point database storage.
* [ ] Database constraints match the feature rules.
* [ ] Relevant tests pass.
* [ ] Type checking passes.
* [ ] Full diff reviewed for unrelated changes.
