# task.md — Catalog (Frontend)

Granular implementation checklist. Work top to bottom. Check off an item only
after it has actually been implemented and verified.

---

## Phase 1 — Existing Admin UI

* [x] Locate existing admin route. (None existed — created `app/(admin)/` route group.)
* [x] Locate existing admin layout. (None existed — created `app/(admin)/layout.tsx` with sidebar.)
* [x] Locate existing admin navigation. (None existed — created `app/(admin)/AdminSidebar.tsx`.)
* [x] Inspect shared Button component. (None existed — created `components/ui/Button.tsx`.)
* [x] Inspect shared Input/Form components. (None existed — created `components/ui/Input.tsx`, `Select.tsx`.)
* [x] Inspect shared Table component. (None existed — created `components/ui/Table.tsx`.)
* [x] Inspect shared Dialog/Modal component. (None existed — created `components/ui/Dialog.tsx`, `ConfirmDialog.tsx`.)
* [x] Inspect shared pagination component. (None existed — created `components/ui/Pagination.tsx`.)
* [x] Inspect existing API/data-fetching utilities. (None existed — created `lib/api.ts` with fetch wrapper, CSRF, credentials.)
* [x] Inspect existing authentication/session handling. (None existed — created `lib/auth.ts`, `lib/auth-context.tsx`.)
* [x] Confirm no second admin shell is required. (Single admin shell at `(admin)/` route group.)

---

## Phase 2 — Shared Catalog UI

* [x] Reuse existing shared components where applicable. (Button, Input, Select, Table, Dialog, ConfirmDialog, Pagination, Alert, Loading, EmptyState, PageHeader, Badge reused.)
* [x] Build only required Catalog-specific components. (CategoryForm, CollectionForm, ProductForm, VariantForm, CollectionMembership, CatalogError.)
* [x] Build Catalog page header if needed. (PageHeader from Phase 1 reused.)
* [x] Build/reuse data table pattern. (Table from Phase 1 reused.)
* [x] Build/reuse delete confirmation. (ConfirmDialog from Phase 1 reused.)
* [x] Build/reuse pagination. (Pagination from Phase 1 reused.)
* [x] Build category selector. (Select component used in ProductForm with category options.)
* [x] Build category form. (`features/catalog/components/CategoryForm.tsx`.)
* [x] Build collection form. (`features/catalog/components/CollectionForm.tsx`.)
* [x] Build product form. (`features/catalog/components/ProductForm.tsx` with category selector.)
* [x] Build variant form. (`features/catalog/components/VariantForm.tsx` with price/stock validation.)
* [x] Build collection membership UI. (`features/catalog/components/CollectionMembership.tsx` with add/remove/search.)

---

## Phase 3 — Categories

* [ ] Category list page.
* [ ] Category pagination.
* [ ] Category create form.
* [ ] Category edit form.
* [ ] Category delete action.
* [ ] Delete confirmation.
* [ ] Category loading state.
* [ ] Category empty state.
* [ ] Category error state.
* [ ] Category backend API integration.
* [ ] Category validation errors displayed.
* [ ] Category deletion conflict displayed correctly.

---

## Phase 4 — Collections

* [ ] Collection list page.
* [ ] Collection pagination.
* [ ] Collection create form.
* [ ] Collection edit form.
* [ ] Collection delete action.
* [ ] Delete confirmation.
* [ ] Collection product list.
* [ ] Add Product to Collection.
* [ ] Remove Product from Collection.
* [ ] Collection loading state.
* [ ] Collection empty state.
* [ ] Collection error state.
* [ ] Collection backend API integration.
* [ ] Duplicate membership error handled.

---

## Phase 5 — Products

* [ ] Product list page.
* [ ] Product pagination.
* [ ] Category filter.
* [ ] Product create form.
* [ ] Product edit form.
* [ ] Product delete action.
* [ ] Delete confirmation.
* [ ] Category selector.
* [ ] Product loading state.
* [ ] Product empty state.
* [ ] Product error state.
* [ ] Product backend API integration.
* [ ] Category-related backend errors handled.

---

## Phase 6 — Variants

* [ ] Product variant list.
* [ ] Variant create form.
* [ ] Variant edit form.
* [ ] Variant delete action.
* [ ] Delete confirmation.
* [ ] SKU displayed.
* [ ] Size displayed.
* [ ] Color displayed.
* [ ] Price displayed.
* [ ] Stock displayed.
* [ ] Negative stock prevented in client UX.
* [ ] Variant backend API integration.
* [ ] Variant validation errors handled.
* [ ] Duplicate SKU error handled.

---

## Phase 7 — Collection Membership

* [ ] Collection products displayed.
* [ ] Product selection UI.
* [ ] Add Product to Collection.
* [ ] Remove Product from Collection.
* [ ] Duplicate membership prevented where practical.
* [ ] Duplicate membership backend error handled.
* [ ] Missing Product error handled.
* [ ] Missing Collection error handled.
* [ ] Membership changes reflected without stale UI.

---

## Phase 8 — API Integration

* [ ] Category endpoints match backend contract.
* [ ] Collection endpoints match backend contract.
* [ ] Product endpoints match backend contract.
* [ ] Variant endpoints match backend contract.
* [ ] Collection membership endpoints match backend contract.
* [ ] Pagination matches backend contract.
* [ ] Category filtering matches backend contract.
* [ ] API response envelope handled consistently.
* [ ] Session credentials follow existing frontend API pattern.
* [ ] No direct database access exists.

---

## Phase 9 — UX Hardening

* [ ] All data-dependent screens have loading states.
* [ ] All data-dependent screens have error states.
* [ ] Empty lists have useful empty states.
* [ ] Mutations provide success feedback where appropriate.
* [ ] Mutations provide failure feedback.
* [ ] Delete actions require confirmation.
* [ ] Forms prevent obvious invalid input.
* [ ] Backend validation errors are understandable.
* [ ] Pagination behaves consistently.
* [ ] Failed mutations do not leave misleading state.
* [ ] Authorization failures are handled appropriately.

---

## Phase 10 — Verification

* [ ] Manually verify Category CRUD.
* [ ] Manually verify Collection CRUD.
* [ ] Manually verify Product CRUD.
* [ ] Manually verify Variant CRUD.
* [ ] Manually verify Product → Collection assignment.
* [ ] Manually verify Product removal from Collection.
* [ ] Manually verify category filtering.
* [ ] Manually verify pagination.
* [ ] Manually verify delete confirmation.
* [ ] Manually verify non-admin authorization rejection.
* [ ] Manually verify loading states.
* [ ] Manually verify empty states.
* [ ] Manually verify error states.
* [ ] Manually verify responsive behavior.
* [ ] Confirm existing admin navigation still works.
* [ ] Run `turbo test --filter=frontend`.
* [ ] Run `turbo typecheck --filter=frontend`.
* [ ] Run `turbo lint --filter=frontend`.
* [ ] Review full diff.
* [ ] Confirm no unrelated changes.
* [ ] Confirm no hardcoded design tokens.

---

## Reporting

On completion, report:

* what was implemented;
* which Catalog screens were added;
* which shared components were reused;
* API endpoints integrated;
* tests actually run;
* typecheck result;
* lint result;
* manual verification performed;
* any deviations from `plan.md`;
* unresolved limitations.
