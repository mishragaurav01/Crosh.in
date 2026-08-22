# Tasks — Variant ↔ Collection Refactor

## Database

* [x] Change Prisma relation from Product ↔ Collection to Variant ↔ Collection.
* [x] Create and apply migration.
* [x] Migrate existing Product → Collection memberships to all Product Variants.
* [x] Verify migrated data.

## Backend

* [x] Update collection Zod schemas to use `variantIds`.
* [x] Update collection create/update services.
* [x] Update collection queries and response mappings.
* [x] Replace remaining Product → Collection references.

## Frontend

* [x] Update collection API/types to use `variantIds`. (`types.ts`: `Collection.variantIds`, `VariantCollection` replaces `ProductCollection`; `api.ts`: membership endpoints moved to `/collections/:id/variants[/:variantId]`.)
* [x] Update collection selector to expose Variants. (`CollectionMembership.tsx` add-dialog now groups variants by Product with SKU/size/color/price rows.)
* [x] Support "all variants" selection. ("Add all" per Product resolves to sequential per-variant POSTs; shows remaining count when partially assigned, "All in collection" badge when complete.)
* [x] Support selective Variant selection. (Per-variant Add buttons; members show an "In collection" badge; dialog stays open for multi-add with inline feedback.)
* [x] Update collection display/state logic. (Members table shows Variant/Product/Price/Stock/Added; optimistic member set keeps badges consistent during refetch; removal confirm and copy updated to variant semantics.)

## Verification

Automated coverage: `apps/backend/src/features/catalog/__tests__/verification.test.ts`
runs the five flows below against real catalog services (`collection.service`,
`membership.service`) using a stateful in-memory Prisma double that enforces
`(variantId, collectionId)` uniqueness — so post-operation membership state is
asserted through the public service surface, not spies. Browser-level UI
confirmation still requires a human session.

* [x] Verify all-variant assignment. (Product's variants resolved then submitted as full `variantIds` set; exactly those members reported by `getCollection` and `listCollectionVariants`; re-adding an assigned variant returns 409 without duplicating the row.)
* [x] Verify selective-variant assignment. (Submitting one variant of a three-variant product yields exactly that member; unsubmitted siblings stay out.)
* [x] Verify independent Variant memberships. (Two variants of the same product in two collections coexist; removing one leaves the other collection untouched.)
* [x] Verify removing one Variant. (Removing from a fully-assigned collection keeps siblings; removed variant itself is untouched; removing a non-member returns 404 and changes nothing.)
* [x] Verify existing migrated Collections. (Memberships seeded in migration shape — one row per variant per former Product→Collection link — are preserved via `listCollections`/`getCollection`; schema assertion confirms no `ProductCollection` model or Product↔Collection relation remains, only `VariantCollection`.)
* [x] Run project verification commands. (`bun test` from `apps/backend`: 227 pass / 0 fail across 20 files, including the 13 new verification tests; `tsc --noEmit -p tsconfig.json` clean. Note: `apps/backend/package.json` has no `test` script and root `turbo.json` has no `test` task despite `apps/backend/AGENTS.md` listing `turbo test --filter=backend` — commands were run directly with Bun instead.)

## Done When

* [x] No Product ↔ Collection relationship remains. (Frontend: `ProductCollection` type and `/products` membership endpoints removed entirely. Backend: asserted by `verification.test.ts` against the Prisma schema.)
* [x] Variant ↔ Collection is the only collection membership relationship. (`VariantCollection` type + `/collections/:id/variants[/:variantId]` endpoints are the sole membership path.)
* [ ] Existing collection data is preserved. (Handled by the completed DB migration; migration-shape behavior now also covered by `verification.test.ts`, but runtime confirmation still requires a running stack.)
* [ ] All required UI workflows work correctly. (Implemented; manual browser verification outstanding.)
