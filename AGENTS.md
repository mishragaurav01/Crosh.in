# AGENTS.md — Repository Root

## Purpose

This file orients an agent working anywhere in CroshFinal. It is intentionally short.
It does not contain architecture, conventions, or stack details — those live in
`constitution/` and are loaded selectively (see Context Loading Protocol below).

Read this file first, always. Read nothing else until you know which domain
(backend / frontend / db) and which task type you're working on.

---

## Repository Shape

Turborepo monorepo:

- `apps/backend` — Bun + Express 5 API
- `apps/frontend` — Next.js 16 / React 19
- `packages/db` — Prisma + PostgreSQL, shared database layer
- `packages/*` — other shared packages (types, ui, config) as they appear

Each of `apps/backend`, `apps/frontend`, `packages/db` has its own `AGENTS.md` with
domain-specific workflow, and its own `constitution/` with domain-specific rules.

Feature work happens inside `apps/backend/src/features/<name>/` and
`apps/frontend/src/features/<name>/` (or equivalent), each with its own `AGENTS.md`,
`plan.md`, and `task.md`. Feature-level docs are out of scope for this layer —
consult them only when implementing that feature.

---

## Context Loading Protocol

**Load only what the current task needs.** This repo is documented in layers
specifically so you don't have to ingest all of it at once. Use this table:

| Task type | Load |
|---|---|
| Any task | This file only, to start |
| Backend feature work | `apps/backend/AGENTS.md` → its Context Loading section decides which `apps/backend/constitution/*.md` files apply |
| Frontend feature work | `apps/frontend/AGENTS.md` → its Context Loading section |
| Schema / migration work | `packages/db/AGENTS.md` + `packages/db/constitution/db-design.md` |
| Cross-cutting naming, error handling, TS style | `constitution/conventions.md` |
| "Where does X live" / new package / deployment question | `constitution/architecture.md` |
| Version-specific behavior (Express 5, React 19, Next 16, Bun) | `constitution/tech-stack.md` |
| Why was X decided this way | `constitution/decisions.md` |

Do not preemptively load sibling domains. Backend work does not need frontend
constitution docs loaded, and vice versa. If a task turns out to be cross-domain,
load the second domain's `AGENTS.md` only when you actually reach that boundary.

---

## Global Workflow

1. Identify the domain and task type; load only the docs the table above points to.
2. Locate the relevant feature folder and read its `AGENTS.md`, `plan.md`, `task.md`.
3. Inspect existing code before writing new code.
4. Implement within established architecture. Do not invent new patterns to solve
   a local problem — escalate instead (see each domain's AGENTS.md for specifics).
5. Run the verification the domain's AGENTS.md specifies.
6. Report what changed, what was verified, and what was not run and why.

---

## Global Rules (apply everywhere)

- Never modify a `constitution/` document unless the user explicitly approves that
  specific change. Implementing a feature does not authorize changing the rules.
- Never commit secrets, `.env` files, or credentials.
- Never perform destructive Git operations without explicit authorization.
- Keep changes scoped to the requested task. No opportunistic refactors.
- If a required decision isn't covered by any loaded document, stop and ask —
  don't guess and don't invent a convention that becomes accidental precedent.

---

## Definition of Done (repo-wide floor)

- [ ] Correct-layer docs were loaded (not more, not less).
- [ ] Feature-level docs were followed where applicable.
- [ ] Changes stayed within the scope of the task.
- [ ] Domain-appropriate verification was run and reported honestly.
- [ ] No constitution document was modified without explicit approval.
