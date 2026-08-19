# plan.md — Catalog

Sequenced implementation plan. Complete and verify each phase before moving
to the next phase.

---

## Phase 1 — Database Schema

1. Add `Category`.
2. Add `Collection`.
3. Add `Product`.
4. Add `Variant`.
5. Add `ProductCollection`.
6. Add all required foreign keys.
7. Add unique constraints for:

   * Category.slug
   * Collection.slug
   * Product.slug
   * Variant.sku
   * ProductCollection `(productId, collectionId)`
8. Add indexes supporting the expected lookup patterns.
9. Add lifecycle timestamps where appropriate.
10. Create the Prisma migration.
11. Run `bunx prisma generate`.
12. Inspect the resulting schema and migration.

Do not apply destructive migration behavior without explicit authorization.

---

## Phase 2 — Shared Validation and Types

1. Define Zod schemas for category input.
2. Define Zod schemas for collection input.
3. Define Zod schemas for product input.
4. Define Zod schemas for variant input.
5. Define Zod schemas for collection membership.
6. Define pagination schemas.
7. Define feature-specific response types where useful.
8. Establish the slug normalization behavior.
9. Establish the monetary representation used by the API.

Do not allow database models to become the public API contract automatically.

---

## Phase 3 — Category Management

Implement:

1. Create category.
2. List categories.
3. Retrieve category.
4. Update category.
5. Delete category.

Verify:

* validation;
* slug uniqueness;
* authorization;
* not-found behavior;
* pagination;
* response envelope.

---

## Phase 4 — Collection Management

Implement:

1. Create collection.
2. List collections.
3. Retrieve collection.
4. Update collection.
5. Delete collection.

Verify:

* validation;
* slug uniqueness;
* authorization;
* not-found behavior;
* pagination;
* response envelope.

---

## Phase 5 — Product Management

Implement:

1. Create product.
2. List products.
3. Retrieve product.
4. Update product.
5. Delete product.

Verify:

* category existence;
* slug uniqueness;
* authorization;
* pagination;
* filtering;
* not-found behavior;
* response envelope.

---

## Phase 6 — Variant Management

Implement:

1. Create variant.
2. List product variants.
3. Retrieve variant.
4. Update variant.
5. Delete variant.

Verify:

* product existence;
* SKU uniqueness;
* non-negative stock;
* valid monetary values;
* authorization;
* pagination;
* response envelope.

---

## Phase 7 — Product / Collection Membership

Implement:

1. Add product to collection.
2. Remove product from collection.
3. Retrieve collection products through the collection API.
4. Prevent duplicate membership.

Verify:

* product existence;
* collection existence;
* authorization;
* unique membership;
* correct behavior when membership does not exist.

---

## Phase 8 — Cross-Feature API Behavior

Verify the complete resource graph:

```text
Category
  ↓
Product
  ↓
Variant

Collection
  ↓
ProductCollection
  ↓
Product
```

Verify that:

* products cannot reference missing categories;
* variants cannot reference missing products;
* memberships cannot reference missing products;
* memberships cannot reference missing collections;
* duplicate SKUs are rejected;
* duplicate slugs are rejected;
* duplicate memberships are rejected.

---

## Phase 9 — Testing

Add tests for:

### Category

* creates category;
* rejects invalid input;
* rejects duplicate slug;
* returns not-found correctly;
* updates category;
* deletes category according to the defined deletion policy.

### Collection

* creates collection;
* rejects duplicate slug;
* updates collection;
* manages membership correctly.

### Product

* creates product;
* rejects missing category;
* rejects duplicate slug;
* updates product;
* filters by category.

### Variant

* creates variant;
* rejects missing product;
* rejects duplicate SKU;
* rejects negative stock;
* validates price;
* updates variant.

### Membership

* adds product to collection;
* rejects duplicate membership;
* removes membership;
* handles missing product;
* handles missing collection.

---

## Phase 10 — Verification

Run the relevant backend verification:

```text
turbo test --filter=backend
turbo typecheck --filter=backend
turbo lint --filter=backend
```

Also verify the database migration and API behavior against the feature
requirements.

Report actual results only.

---

## Open Decisions

Before implementation begins, confirm:

1. Monetary representation and currency.
2. Whether `size` and `color` are required or optional.
3. Whether slugs are client-provided, generated, or generated with an override.
4. Exact deletion behavior for categories/products/collections with
   dependents.
5. Exact administrative role/permission currently used by the project.
6. Whether product listing should expose variants by default or only when
   explicitly requested.

These decisions should be recorded in the root `constitution/decisions.md`
only if they represent durable project-wide decisions.
