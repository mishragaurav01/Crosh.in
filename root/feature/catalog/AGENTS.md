# AGENTS.md — Catalog Variant Collection Relationship

## Purpose

Refactor catalog collection membership from **Product ↔ Collection** to **Variant ↔ Collection**.

A Product remains the parent catalog entity and owns one or more Variants. A Collection contains selected Variants.

This allows both:

* adding all variants of a Product to a Collection;
* adding only selected Variants of a Product.

## Existing Relationship

```text
Product 1 ──── N Variant
Product N ──── N Collection
```

The Product ↔ Collection relationship must be removed.

## Target Relationship

```text
Product 1 ──── N Variant
Variant N ──── N Collection
```

Variant is the unit of collection membership.

## Business Rules

1. Every Product must have at least one Variant.
2. A Variant can belong to zero or many Collections.
3. A Collection can contain zero or many Variants.
4. A Product does not directly belong to a Collection.
5. Adding a Product through the UI means adding **all of its Variants**.
6. Users must also be able to select individual Variants.
7. Existing Product → Collection assignments must migrate to **all Variants belonging to that Product**.
8. Removing one Variant from a Collection must not remove its sibling Variants.
9. Deleting a Product must follow the existing Variant deletion rules and must not leave orphaned collection memberships.

## Backend Rules

* Collection APIs must operate on `variantIds`.
* Do not introduce a second Product ↔ Collection relationship.
* Product-based convenience operations may resolve a Product into its Variant IDs internally.
* Validation must ensure submitted Variant IDs exist.
* Existing API conventions, authentication, authorization, pagination, error handling, and response formats must remain unchanged.
* Do not introduce a repository pattern solely for this refactor.

## Frontend Rules

The collection UI must support:

```text
Product
├── All variants
├── Variant A
├── Variant B
└── Variant C
```

The user should be able to:

* select the entire Product;
* select individual Variants;
* understand which Variants are currently assigned.

Selecting a Product should resolve to all its Variants rather than creating a Product-level relationship.

## Migration Rules

The migration must preserve existing collection membership.

For every existing:

```text
Product → Collection
```

relationship:

```text
Product → Variant A
Product → Variant B
Product → Variant C
```

must become:

```text
Variant A → Collection
Variant B → Collection
Variant C → Collection
```

No existing collection membership should be silently lost.

## Scope

This is a relationship refactor, not a catalog redesign.

Do not:

* redesign Product or Variant;
* change Variant ownership;
* change collection semantics;
* introduce unrelated API changes;
* rewrite unrelated catalog code;
* add unnecessary abstractions.

## Verification

Verify at minimum:

* Product with multiple Variants can be added to a Collection.
* All Variants are assigned when adding the Product.
* Selected Variants can be assigned independently.
* Two Variants of the same Product can have different Collection memberships.
* Removing one Variant does not remove sibling Variants.
* Existing Product → Collection data is correctly migrated.
* No Product → Collection relation remains in the implementation.
