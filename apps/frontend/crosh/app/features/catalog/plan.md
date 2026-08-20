# plan.md — Catalog (Frontend)

Sequenced implementation plan.

Build shared Catalog UI patterns before assembling the complete management
screens. Follow existing admin patterns before introducing new components.

---

## Phase 1 — Inspect Existing Admin UI

1. Locate the existing admin route/layout/navigation.
2. Inspect existing shared buttons, inputs, tables, dialogs, forms, pagination,
   alerts, and loading states.
3. Inspect existing frontend API/data-fetching utilities.
4. Inspect existing authentication/session handling.
5. Confirm how authenticated administrative users are represented by the
   existing frontend/backend integration.
6. Reuse existing patterns instead of introducing parallel implementations.

Do not create a second admin shell or navigation system.

---

## Phase 2 — Catalog Shared UI

Build only the Catalog-specific reusable pieces that are actually needed.

Potential components include:

* Catalog page header
* Catalog data table
* pagination controls
* delete confirmation dialog
* category selector
* product form
* category form
* collection form
* variant form
* collection product selector
* catalog error feedback

Before creating each component, verify that an equivalent shared component does
not already exist.

---

## Phase 3 — Categories

Build the Categories management screen.

Required behavior:

1. Paginated category list.
2. Create category.
3. Edit category.
4. Delete category.
5. Loading state.
6. Empty state.
7. Error state.
8. Delete confirmation.
9. Backend conflict handling when Products still reference the Category.

Integrate the Catalog Category API after the screen structure is stable.

---

## Phase 4 — Collections

Build the Collections management screen.

Required behavior:

1. Paginated collection list.
2. Create collection.
3. Edit collection.
4. Delete collection.
5. View/manage products in a collection.
6. Add product to collection.
7. Remove product from collection.
8. Loading state.
9. Empty state.
10. Error state.
11. Delete confirmation.

A Collection deletion must be presented as deletion of the Collection only.

---

## Phase 5 — Products

Build the Products management screen.

Required behavior:

1. Paginated product list.
2. Category filter.
3. Create product.
4. Edit product.
5. Delete product.
6. Display category.
7. Access variant management.
8. Access collection membership management.
9. Loading state.
10. Empty state.
11. Error state.
12. Delete confirmation.

---

## Phase 6 — Variants

Build Product variant management.

Required behavior:

1. List variants for a Product.
2. Create variant.
3. Edit variant.
4. Delete variant.
5. Display SKU.
6. Display size.
7. Display color.
8. Display price.
9. Display stock.
10. Validate obvious invalid input on the client for UX.
11. Surface backend validation errors.

Do not introduce inventory-management behavior beyond the current Variant
`stock` field.

---

## Phase 7 — Collection Membership

Implement the Product ↔ Collection relationship UI.

Required behavior:

1. Show Products belonging to a Collection.
2. Add an existing Product to a Collection.
3. Remove a Product from a Collection.
4. Prevent obvious duplicate selections in the UI.
5. Handle backend duplicate-membership errors.
6. Handle missing Product/Collection errors.

Do not create a standalone global state representation of collection membership.

---

## Phase 8 — API Integration

Integrate the screens with the backend Catalog endpoints.

Verify:

* request payloads match backend schemas;
* route parameters are correct;
* pagination parameters match the API;
* category filtering matches the API;
* response envelopes are handled correctly;
* backend error codes are surfaced appropriately;
* credentials/session behavior follows the existing frontend API pattern.

Do not bypass the backend API.

---

## Phase 9 — UX Hardening

Verify:

1. Loading states do not produce blank screens.
2. Empty lists provide useful actions.
3. Mutations provide success/failure feedback.
4. Delete actions require confirmation.
5. Forms prevent obvious invalid submissions.
6. Backend validation errors are understandable.
7. Pagination behaves consistently.
8. Collection membership changes update the visible UI correctly.
9. Failed mutations do not leave stale or misleading UI state.
10. Admin authorization failures are handled without exposing internal details.

---

## Phase 10 — Verification

Run:

* `turbo test --filter=frontend`
* `turbo typecheck --filter=frontend`
* `turbo lint --filter=frontend`

Also verify manually:

1. Category CRUD.
2. Collection CRUD.
3. Product CRUD.
4. Variant CRUD.
5. Product → Collection assignment.
6. Product removal from Collection.
7. Category filtering.
8. Pagination.
9. Delete confirmation.
10. Backend authorization rejection.
11. Loading states.
12. Empty states.
13. Error states.
14. Responsive behavior.
15. Existing admin navigation remains intact.

Review the complete diff for unrelated changes.

---

## Open Items

* Final visual treatment should follow the existing admin design patterns if
  available.
* Do not invent new design tokens for Catalog without explicit approval.
* Do not introduce a global state library for Catalog.
