# task.md — Catalog

Granular implementation checklist. Work from top to bottom. Mark an item
complete only after it has actually been implemented and verified.

---

## Phase 0 — Decisions

* [ ] Confirm monetary representation and currency.
* [ ] Confirm whether `size` is required.
* [ ] Confirm whether `color` is required.
* [ ] Confirm slug generation/update behavior.
* [ ] Confirm deletion behavior for dependent records.
* [ ] Confirm administrative role/permission.
* [ ] Confirm product/variant response expansion behavior.

---

## Phase 1 — Schema

* [x] Add `Category` model.
* [x] Add `Collection` model.
* [x] Add `Product` model.
* [x] Add `Variant` model.
* [x] Add `ProductCollection` model.
* [x] Add required foreign keys.
* [x] Add unique constraint for `Category.slug`.
* [x] Add unique constraint for `Collection.slug`.
* [x] Add unique constraint for `Product.slug`.
* [x] Add unique constraint for `Variant.sku`.
* [x] Add unique constraint for `(ProductCollection.productId,
      ProductCollection.collectionId)`.
* [x] Add indexes for expected query patterns.
* [x] Add timestamps.
* [x] Create Prisma migration.
* [x] Run `bunx prisma generate`.
* [x] Inspect generated Prisma types.

---

## Phase 2 — Validation

* [x] Category create schema.
* [x] Category update schema.
* [x] Collection create schema.
* [x] Collection update schema.
* [x] Product create schema.
* [x] Product update schema.
* [x] Variant create schema.
* [x] Variant update schema.
* [x] Collection membership schema.
* [x] Pagination schema.
* [x] Route parameter validation.
* [x] Query parameter validation.
* [x] Price validation.
* [x] Non-negative stock validation.
* [x] Slug validation.

---

## Phase 3 — Category

* [x] Create category endpoint.
* [x] List category endpoint.
* [x] Get category endpoint.
* [x] Update category endpoint.
* [x] Delete category endpoint.
* [x] Category authorization.
* [x] Category service tests.
* [x] Category API tests.

---

## Phase 4 — Collection

* [x] Create collection endpoint.
* [x] List collection endpoint.
* [x] Get collection endpoint.
* [x] Update collection endpoint.
* [x] Delete collection endpoint.
* [x] Collection authorization.
* [x] Collection service tests.
* [x] Collection API tests.

---

## Phase 5 — Product

* [x] Create product endpoint.
* [x] List product endpoint.
* [x] Get product endpoint.
* [x] Update product endpoint.
* [x] Delete product endpoint.
* [x] Category existence validation.
* [x] Category filtering.
* [x] Product authorization.
* [x] Product service tests.
* [x] Product API tests.

---

## Phase 6 — Variant

* [x] Create variant endpoint.
* [x] List product variants endpoint.
* [x] Get variant endpoint.
* [x] Update variant endpoint.
* [x] Delete variant endpoint.
* [x] Product existence validation.
* [x] SKU uniqueness.
* [x] Non-negative stock validation.
* [x] Price validation.
* [x] Variant authorization.
* [x] Variant service tests.
* [x] Variant API tests.

---

## Phase 7 — Collection Membership

* [x] Add product to collection endpoint.
* [x] Remove product from collection endpoint.
* [x] Collection product retrieval.
* [x] Product existence validation.
* [x] Collection existence validation.
* [x] Duplicate membership protection.
* [x] Membership authorization.
* [x] Membership service tests.
* [x] Membership API tests.

---

## Phase 8 — Integration Verification

* [x] Product cannot reference missing category.
* [x] Variant cannot reference missing product.
* [x] Membership cannot reference missing product.
* [x] Membership cannot reference missing collection.
* [x] Duplicate category slug rejected.
* [x] Duplicate collection slug rejected.
* [x] Duplicate product slug rejected.
* [x] Duplicate SKU rejected.
* [x] Duplicate collection membership rejected.
* [x] Negative stock rejected.
* [x] Pagination remains bounded.
* [x] Unauthorized admin operation rejected.
* [x] Missing resource responses use the correct error codes.
* [x] API response envelopes match the project standard.

---

## Phase 9 — Verification

* [x] Run `turbo test --filter=backend`.
* [x] Run `turbo typecheck --filter=backend`.
* [x] Run `turbo lint --filter=backend`.
* [x] Verify migration.
* [x] Verify database constraints.
* [x] Manually verify representative API flows.
* [x] Review full diff.
* [x] Confirm no unrelated files changed.
* [x] Report any skipped checks honestly.

---

## Reporting

On completion, report:

* what was implemented;
* migration name;
* endpoints implemented;
* tests actually run;
* type checking result;
* lint result;
* manual verification performed;
* any decisions that changed during implementation;
* any unresolved limitations.


## Phase 10 — Admin Authorization and Deletion Hardening

### User Model

* [x] Add `isAdmin Boolean @default(false)` to `User`.
* [x] Create Prisma migration.
* [x] Apply migration in development.
* [x] Run `bunx prisma generate`.
* [x] Confirm existing users default to `isAdmin = false`.

### Admin Authorization

* [x] Implement reusable admin authorization middleware/check.
* [x] Require a valid session before checking administrative access.
* [x] Resolve the authenticated User server-side.
* [x] Check `user.isAdmin === true`.
* [x] Reject authenticated non-admin users.
* [x] Reject unauthenticated users.
* [x] Protect Category management endpoints.
* [x] Protect Collection management endpoints.
* [x] Protect Product management endpoints.
* [x] Protect Variant management endpoints.
* [x] Protect ProductCollection management endpoints.
* [x] Verify admin users can access all protected operations.
* [x] Confirm no client-provided admin flag is trusted.
* [x] Confirm no catalog-specific authorization mechanism was introduced.

### Deletion

* [x] Reject Category deletion when Products exist.
* [x] Reject Product deletion when Variants exist.
* [x] Allow Collection deletion when memberships exist.
* [x] Remove ProductCollection rows when deleting a Collection.
* [x] Preserve Products when deleting a Collection.
* [x] Ensure Product deletion never silently deletes Variants.
* [x] Ensure Category deletion never silently deletes Products.
* [x] Ensure ProductCollection deletion removes only the relationship.
* [x] Add service tests for rejected Category deletion.
* [x] Add service tests for rejected Product deletion.
* [x] Add service/integration tests for Collection deletion.
* [x] Verify appropriate conflict/error responses.

### Slugs

* [x] Confirm Category requires a client-provided slug.
* [x] Confirm Collection requires a client-provided slug.
* [x] Confirm Product requires a client-provided slug.
* [x] Confirm duplicate slugs are rejected.
* [x] Confirm no automatic slug generation exists.

### Verification

* [x] Admin authorization manually verified.
* [x] Non-admin authorization manually verified.
* [x] Unauthenticated access manually verified.
* [x] Category deletion behavior manually verified.
* [x] Product deletion behavior manually verified.
* [x] Collection deletion behavior manually verified.
* [x] Product preservation after Collection deletion verified.
* [x] `bun test` passes.
* [x] `tsc --noEmit` passes.
* [x] Full diff reviewed.
* [x] No unrelated changes introduced.
* [x] No constitution modified without explicit approval.

---

## Phase 10 Reporting

Report:

* `isAdmin` schema change;
* migration name;
* authorization implementation;
* endpoints protected;
* deletion behavior implemented;
* tests actually run;
* typecheck result;
* manual verification performed;
* unresolved limitations, if any.
