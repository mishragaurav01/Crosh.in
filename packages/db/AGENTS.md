# AGENTS.md — packages/db

## Purpose

Workflow for working in the shared database package. All *rules* (schema design,
IDs, constraints, migrations, deletion strategy) live in
`constitution/db-design.md` — this file only covers how to operate day to day.

Only `apps/backend` currently consumes this package. `apps/frontend` must never
import from here or touch the database directly.

---

## Context Loading

Load `constitution/db-design.md` for any schema, query pattern, migration, or
data-integrity decision. Load root `constitution/tech-stack.md` only if a
Prisma-version-specific behavior is in question.

---

## Commands

- Generate client: `bunx prisma generate` (run after any schema change, before
  the backend will type-check correctly)
- Create + apply dev migration: `bunx prisma migrate dev --name <description>`
- Apply migrations (non-dev): `bunx prisma migrate deploy`
- Open Prisma Studio: `bunx prisma studio`
- Seed: `bunx prisma db seed` (confirm the seed script path in `package.json`
  before assuming it exists)

Run these from `packages/db` unless a root-level Turborepo script wraps them —
check `turbo.json` before assuming.

---

## Workflow

1. Read `constitution/db-design.md`.
2. Inspect the current `schema.prisma` and relevant migration history before
   changing anything.
3. Make the schema change.
4. Generate a migration with a descriptive name — never hand-edit a migration
   file after it's been applied anywhere shared.
5. Run `prisma generate` so backend types stay in sync.
6. Report the migration name and what it does; flag anything destructive
   explicitly and confirm authorization before applying it beyond local dev.

---

## Escalation

Stop and ask before: any destructive migration (dropping a column/table with
existing data), introducing a second ID strategy, adding a repository layer,
or denormalizing a relationship — these all require explicit authorization per
`constitution/db-design.md`.

---

## Constitution Changes

Do not modify `constitution/db-design.md` without explicit user approval.
