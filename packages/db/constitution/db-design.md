# Database Design Constitution

## Purpose

This document defines database design and data-access rules for CroshFinal.

The database is PostgreSQL and Prisma is the primary database abstraction.

This document lives in `packages/db` rather than under the backend, because the
database is shared infrastructure — `apps/backend` is its only current consumer,
but the boundary is owned here, not by the backend.

---

## Database Ownership

Database access is centralized through `packages/db`.

Application code (currently only `apps/backend`) must use this package rather
than creating independent database clients.

The frontend must never access the database directly.

---

## Prisma

Prisma is the standard ORM/database abstraction.

Use existing Prisma capabilities and project conventions before introducing
additional database abstractions.

A repository pattern is not required. Do not introduce repositories solely for
architectural ceremony.

---

## Schema Design

Prioritize: data integrity, clear relationships, predictable naming, appropriate
constraints, appropriate indexing, maintainability.

Database constraints should enforce important invariants where practical rather
than relying exclusively on application code.

---

## IDs

Entity identifiers must use the project's established ID strategy consistently.
Do not introduce multiple ID strategies for similar entities without an explicit
reason. IDs should be opaque to API consumers where appropriate.

**Established strategy: cuid2**, for all entities across all features. See
`constitution/decisions.md` ("Entity ID strategy — 2026-08-18") for the record.

---

## Timestamps

Persist meaningful lifecycle timestamps where useful (`createdAt`, `updatedAt`
are the common pair). Timestamp behavior must be consistent across entities.
Don't add timestamps mechanically when they carry no semantic meaning.

---

## Relationships

Relationships must accurately represent domain ownership and cardinality.
Define appropriate foreign keys and referential behavior. Avoid denormalization
unless there is a clear performance or domain reason.

---

## Nullability

Nullable fields must have a meaningful semantic reason. Do not use `NULL` as a
substitute for an undefined business rule. Prefer required constraints when a
value is required for a valid entity state.

---

## Constraints

Use database constraints for important invariants: uniqueness, foreign keys,
required values, valid relational structure. Application validation does not
replace database integrity.

---

## Indexes

Indexes should support real query patterns. Before adding one, consider query
frequency, filtering, sorting, joins, cardinality, and write overhead. Don't add
indexes without a reasonable performance justification.

---

## Queries

Retrieve only what the operation needs. Avoid unnecessary columns, relations,
repeated queries, and large unbounded result sets. Watch for N+1 patterns.

---

## Transactions

Use transactions when multiple operations must succeed or fail atomically.
Don't use them for independent operations. Boundaries should correspond to
meaningful business operations.

---

## Concurrency

Operations that can race must account for concurrency — use constraints,
transactions, locking, or atomic operations as required. Don't rely solely on a
prior read to guarantee a later write remains valid.

---

## Migrations

All schema changes use the project's Prisma migration workflow. Never manually
modify production schemas outside that process. Migrations should be
intentional, reviewable, reproducible, and deployment-compatible. Destructive
migrations require explicit authorization.

---

## Data Deletion

Deletion strategy must reflect domain requirements. Hard delete only when
permanent removal is appropriate; soft delete only when the domain needs
retention/restoration. Implement soft deletion consistently where used — don't
introduce it globally by default.

---

## Seeds

Seed data must be deterministic and appropriate for dev/testing. Production
data must never be embedded in seed scripts.

---

## Data Integrity

Protect business-critical invariants at the strongest appropriate layer:
application validation, service-level rules, and database constraints together.
The database should stay internally consistent even if application assumptions
fail.

---

## Performance

Consider performance when introducing large queries, repeated queries,
relation-heavy operations, list endpoints, background jobs, or high-frequency
operations. Optimize based on actual query behavior, not premature abstraction.

---

## Database Changes

Before changing a schema, inspect existing relationships, indexes, dependent
application code, API behavior, and migration history. Database changes are
never isolated code changes.
