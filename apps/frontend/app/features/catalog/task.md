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

* [x] Category list page.
* [x] Category pagination.
* [x] Category create form.
* [x] Category edit form.
* [x] Category delete action.
* [x] Delete confirmation.
* [x] Category loading state.
* [x] Category empty state.
* [x] Category error state.
* [x] Category backend API integration.
* [x] Category validation errors displayed.
* [x] Category deletion conflict displayed correctly.

---

## Phase 4 — Collections

* [x] Collection list page.
* [x] Collection pagination.
* [x] Collection create form.
* [x] Collection edit form.
* [x] Collection delete action.
* [x] Delete confirmation.
* [x] Collection product list.
* [x] Add Product to Collection.
* [x] Remove Product from Collection.
* [x] Collection loading state.
* [x] Collection empty state.
* [x] Collection error state.
* [x] Collection backend API integration.
* [x] Duplicate membership error handled.

---

## Phase 5 — Products

* [x] Product list page.
* [x] Product pagination.
* [x] Category filter.
* [x] Product create form.
* [x] Product edit form.
* [x] Product delete action.
* [x] Delete confirmation.
* [x] Category selector.
* [x] Product loading state.
* [x] Product empty state.
* [x] Product error state.
* [x] Product backend API integration.
* [x] Category-related backend errors handled.

---

## Phase 6 — Variants

* [x] Product variant list.
* [x] Variant create form.
* [x] Variant edit form.
* [x] Variant delete action.
* [x] Delete confirmation.
* [x] SKU displayed.
* [x] Size displayed.
* [x] Color displayed.
* [x] Price displayed.
* [x] Stock displayed.
* [x] Negative stock prevented in client UX.
* [x] Variant backend API integration.
* [x] Variant validation errors handled.
* [x] Duplicate SKU error handled.

---

## Phase 7 — Collection Membership

* [x] Collection products displayed.
* [x] Product selection UI.
* [x] Add Product to Collection.
* [x] Remove Product from Collection.
* [x] Duplicate membership prevented where practical.
* [x] Duplicate membership backend error handled.
* [x] Missing Product error handled.
* [x] Missing Collection error handled.
* [x] Membership changes reflected without stale UI.

---

## Phase 8 — API Integration

* [x] Category endpoints match backend contract.
* [x] Collection endpoints match backend contract.
* [x] Product endpoints match backend contract.
* [x] Variant endpoints match backend contract.
* [x] Collection membership endpoints match backend contract.
* [x] Pagination matches backend contract.
* [x] Category filtering matches backend contract.
* [x] API response envelope handled consistently.
* [x] Session credentials follow existing frontend API pattern.
* [x] No direct database access exists.

---

## Phase 9 — UX Hardening

* [x] All data-dependent screens have loading states.
* [x] All data-dependent screens have error states.
* [x] Empty lists have useful empty states.
* [x] Mutations provide success feedback where appropriate.
* [x] Mutations provide failure feedback. (Add-to-collection failures now render inside the Add Product dialog instead of behind it.)
* [x] Delete actions require confirmation.
* [x] Forms prevent obvious invalid input. (Client-side slug format/length checks added to Category/Collection/Product forms, mirroring backend rules; Variant price/stock already validated.)
* [x] Backend validation errors are understandable. (CatalogError now surfaces the backend's specific VALIDATION_ERROR message instead of generic text.)
* [x] Pagination behaves consistently. (Clearing the category filter now resets to page 1.)
* [x] Failed mutations do not leave misleading state.
* [x] Authorization failures are handled appropriately.

---

## Phase 10 — Verification

Manual browser items remain unchecked: they require a human session against a
running backend+frontend and were not performed by the implementing agent.
Code-level verification of those flows is noted in the Reporting section of
this pass.

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
* [x] Confirm existing admin navigation still works. (Sidebar links match implemented routes; admin root redirects to `/catalog/categories`; typecheck confirms imports resolve.)
* [ ] Run `turbo test --filter=frontend`. (Cannot run: no `test` task in `turbo.json` and no test script or runner in the frontend package. Nothing exists to run.)
* [x] Run `turbo typecheck --filter=frontend`. (No `typecheck` script exists; equivalent `tsc --noEmit -p tsconfig.json` run directly in the frontend package — passes.)
* [x] Run `turbo lint --filter=frontend`. (Fails: 2 errors + 3 warnings, all pre-existing in non-catalog files (`components/LoginForm.tsx`, `components/TopNavBar.tsx`, identity login/signup pages, `app/layout.tsx`). Zero catalog findings.)
* [x] Review full diff.
* [x] Confirm no unrelated changes. (Only out-of-feature change is the default API URL port fix 3001→3002 in `lib/api.ts`/`lib/auth.ts`, aligning with the backend's actual default port in `apps/backend/index.ts`.)
* [x] Confirm no hardcoded design tokens. (No hex/rgb/arbitrary color values in catalog code; `text-[18px]` icon sizing follows precedent in committed shared components.)

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
