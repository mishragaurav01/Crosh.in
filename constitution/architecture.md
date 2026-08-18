# Architecture Constitution — Repository Level

## Purpose

This document defines how CroshFinal is organized as a monorepo: what each app/package
owns, and how they're allowed to depend on each other. It does not define internal
layer architecture for any single app — that's `apps/backend/constitution/backend-architecture.md`
and `apps/frontend/constitution/frontend-architecture.md`.

Load this when: adding a new package, deciding where code should live, or working
across an app boundary.

---

## Module Map

- **`apps/backend`** — Bun-run Express 5 REST API. Owns all business logic,
  authentication, authorization, and external service integration. The only
  consumer of `packages/db`.
- **`apps/frontend`** — Next.js 16 / React 19 application. Talks to `apps/backend`
  exclusively over REST. Never accesses the database directly.
- **`packages/db`** — Prisma schema, migrations, generated client, and database
  access conventions. Owned as shared infrastructure, not backend-specific,
  even though only the backend currently consumes it.
- **`packages/*`** (types, ui, config, etc.) — introduced as genuine sharing needs
  arise. Do not create a shared package for something used in only one app.

---

## Dependency Direction

```
apps/frontend  →  apps/backend (HTTP/REST only)
apps/backend   →  packages/db
apps/backend   →  packages/* (shared utilities, types)
apps/frontend  →  packages/* (shared types, ui)
```

`apps/frontend` must never import from `packages/db` or reach the database directly,
even for convenience during development.

No package may import from an app. Packages are consumed downward only.

Avoid circular dependencies between packages.

---

## Deployment Topology

- Backend and frontend deploy as separate services.
- `packages/db` is not independently deployed — it's consumed at build time by
  the backend and applies migrations against the shared PostgreSQL instance.
- Environment-specific configuration is per-app, loaded through each app's
  configuration layer (see each app's constitution for specifics). Never shared
  via a committed file.

This section should be expanded as actual deployment infrastructure (hosting,
CI/CD, environments) is finalized. Do not treat this document as complete
deployment documentation until it is.

---

## Cross-App Contract

The REST API between `apps/frontend` and `apps/backend` is the only integration
surface between them. Changes to that contract are governed by
`apps/backend/constitution/api-design.md`. Frontend code must not assume backend
implementation details beyond what the API contract publishes.

---

## Adding a New Package

Before adding a new `packages/*` directory, confirm:

- The code is genuinely needed by more than one app, or is infra shared regardless
  of consumer count (like `packages/db`).
- It doesn't duplicate something that already exists.
- Its dependency direction fits the map above without creating a cycle.

If unsure, keep the code local to the app that needs it. Promote to a shared
package only when a second real consumer appears.

---

## Architectural Change

Changes to the module map, dependency direction, or deployment topology require
explicit approval — this is a repo-wide structural decision, not a local
implementation choice.
