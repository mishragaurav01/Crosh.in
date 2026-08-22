# Implementation Plan — Variant ↔ Collection

## Objective

Change Collection membership from Product-level to Variant-level while preserving existing catalog behavior.

## Step 1 — Database

* Remove Product ↔ Collection relation.
* Add Variant ↔ Collection many-to-many relation.
* Generate Prisma migration.
* Migrate existing Product ↔ Collection records to all Variants of each Product.
* Verify no memberships are lost.

## Step 2 — Backend Contract

* Change collection input from `productIds` to `variantIds`.
* Update Zod validation.
* Update collection create/update logic.
* Update collection queries and responses.
* Resolve Product → Variant IDs only for convenience operations.

## Step 3 — Frontend

* Update collection selection state from Products to Variants.
* Add "all variants" selection for a Product.
* Allow individual Variant selection.
* Update API payloads to send `variantIds`.
* Update collection display/query logic.

## Step 4 — Existing Data

Confirm migrated collections behave correctly.

For every old Product membership:

```text
Product
  ↓
all existing Variants
  ↓
Collection
```

## Step 5 — Verification

Run the existing project verification commands.

Manually verify:

1. Add all variants from a Product.
2. Add only selected variants.
3. Same Product has variants in different Collections.
4. Remove one Variant.
5. Existing Collections retain their memberships.

## Completion Criteria

The refactor is complete when:

* Variant is the only collection membership unit.
* Existing data is preserved.
* Both all-variant and selective-variant workflows work.
* No unrelated catalog behavior changes.
