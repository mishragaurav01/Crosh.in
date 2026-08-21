# AGENTS.md — Feature: Catalog (Frontend)

## Purpose

Delta-only spec for the frontend `catalog` feature.

This feature provides the administrative UI for managing:

* Categories
* Collections
* Products
* Variants
* Product-to-collection membership

Do not restate frontend architecture or design-system rules here. Those are
governed by the frontend constitutions.

**Tier 2 feature** per `constitution/domain-map.md`.

---

## Context Loading

Load alongside this file:

* `apps/frontend/constitution/frontend-architecture.md`
* `apps/frontend/constitution/design-system.md`
* `apps/backend/constitution/api-design.md`
* `apps/backend/src/features/catalog/AGENTS.md`
* root `constitution/conventions.md` when naming, TypeScript, testing, or shared
  conventions are relevant
* root `constitution/tech-stack.md` when version-specific behavior is relevant

Do not load unrelated backend feature documentation.

---

## Scope

This feature is the admin catalog management interface.

The UI must support:

* category management
* collection management
* product management
* variant management
* assigning products to collections
* removing products from collections

This pass is for the **admin site**, not the public storefront catalog.

Do not build storefront product/category/collection pages as part of this
feature.

---

## Backend Integration

The frontend communicates only with the Catalog REST API.

Use the endpoints defined by:

`apps/backend/src/features/catalog/AGENTS.md`

The frontend must not access Prisma, `packages/db`, or the database.

The backend is authoritative for:

* validation
* authentication
* administrative authorization
* uniqueness
* stock constraints
* relationships
* deletion rules

Client-side validation exists only to improve user experience.

---

## Authentication and Authorization

Catalog management is restricted to administrators.

The frontend may reflect the authenticated user's administrative state when the
backend exposes it, but frontend checks are never an authorization boundary.

Do not implement a separate client-side permission system.

If the backend rejects an operation because the user is not authorized, display
an appropriate error state rather than attempting to bypass or reinterpret the
restriction.

---

## UI Structure

The admin catalog UI should be organized around the following areas:

```text
Catalog
├── Categories
├── Collections
└── Products
    └── Variants
```

Collection membership should be managed from the Collection and/or Product
management UI rather than as an independent top-level section unless an
existing admin navigation pattern requires it.

Use the existing admin layout/navigation if one already exists.

Do not create a second admin shell.

---

## Component Rules

Before creating a component:

1. Inspect existing shared UI components.
2. Reuse existing buttons, inputs, dialogs, tables, form controls, and feedback
   components where appropriate.
3. Create Catalog-specific components only when the behavior or presentation is
   genuinely feature-specific.

Prefer feature-local components under:

`src/features/catalog/components/`

Shared components belong in the existing shared component location.

Do not introduce a new UI library or component framework.

---

## Data Fetching

Use the frontend architecture's existing server/client data-fetching pattern.

Prefer server-side fetching for initial admin pages.

Use Client Components only where interaction requires them, such as:

* forms
* dialogs
* inline mutations
* interactive filtering
* collection membership management
* optimistic updates where justified

Do not introduce a global state library.

Do not duplicate backend catalog data into global client state.

---

## Forms

Forms should support:

### Category

* name
* description
* slug

### Collection

* name
* description
* slug

### Product

* name
* description
* slug
* category

### Variant

* SKU
* size
* color
* price
* stock

The backend remains authoritative for all validation.

Forms must display backend validation and business-rule errors clearly.

---

## Catalog-Specific Behavior

### Categories

Provide:

* paginated list
* create
* edit
* delete
* useful empty state
* loading state
* error state

Prevent accidental deletion through an appropriate confirmation UI.

If the backend rejects deletion because Products depend on the Category, show a
clear conflict message.

### Collections

Provide:

* paginated list
* create
* edit
* delete
* collection product management
* useful empty state
* loading state
* error state

Deleting a Collection must be treated as deleting the collection only. Products
must never be presented as being deleted with it.

### Products

Provide:

* paginated list
* category filtering
* create
* edit
* delete
* variant management
* collection membership management
* useful empty state
* loading state
* error state

### Variants

Provide:

* variant list for a Product
* create
* edit
* delete

Display:

* SKU
* size
* color
* price
* stock

Do not allow the UI to submit negative stock.

### Collection Membership

Allow an administrator to:

* view products in a collection;
* add a product to a collection;
* remove a product from a collection.

Duplicate membership should be prevented by the UI where practical, while the
backend remains authoritative.

---

## Money Display

The frontend must follow the monetary representation defined by the backend
Catalog contract.

Do not invent a currency conversion or reinterpret the backend price value.

Display monetary values consistently throughout Catalog.

---

## Slugs

Slugs are client-provided.

Create forms for Category, Collection, and Product must provide a slug field.

Do not add automatic slug generation unless explicitly requested.

---

## Error and Loading States

Every Catalog data-dependent view must explicitly handle:

* loading
* empty
* successful
* request failure

Backend errors should be mapped to useful user-facing messages.

Do not expose raw Prisma, database, stack-trace, or internal backend errors.

---

## Responsive Behavior

This is an admin interface, so prioritize:

* desktop usability;
* clear data tables;
* efficient forms;
* predictable navigation.

The interface must remain usable on smaller screens, but do not force the
storefront's mobile-first presentation patterns onto admin data-management
screens.

Use existing design-system tokens and established responsive breakpoints.

---

## Escalation

Ask before proceeding if:

* the existing admin shell/navigation is missing or ambiguous;
* the backend Catalog API differs materially from its documented contract;
* a required admin UI component does not exist and multiple materially different
  designs are possible;
* a required design token is missing;
* monetary representation is unclear;
* Catalog requires a new frontend architecture pattern;
* the backend exposes insufficient information to determine administrative state.

Do not modify a constitution to resolve an implementation question without
explicit approval.

---

## Definition of Done

* [ ] Categories can be listed, created, edited, and deleted.
* [ ] Collections can be listed, created, edited, deleted, and managed.
* [ ] Products can be listed, filtered, created, edited, and deleted.
* [ ] Variants can be listed, created, edited, and deleted.
* [ ] Products can be added to and removed from collections.
* [ ] Backend authorization errors are handled correctly.
* [ ] Loading, empty, success, and error states are implemented.
* [ ] Existing shared components are reused where appropriate.
* [ ] No database or `packages/db` access exists in frontend code.
* [ ] No global state library was introduced.
* [ ] No design tokens were hardcoded.
* [ ] Relevant tests, type checking, and linting were run.
* [ ] Final diff contains no unrelated changes.
