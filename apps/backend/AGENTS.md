# AGENTS.md — Backend

## Purpose

Operational instructions for working in `apps/backend`. This file governs
*workflow* — how to work. Architecture and rules live in `constitution/` and are
loaded selectively per the table below. Do not restate architecture, error
model, or validation rules here — those belong in the constitution docs and
duplicating them here is how the two drift out of sync.

---

## Context Loading

Always load this file first. Then, based on task type:

| Task type | Load |
|---|---|
| Module structure / request flow / layering question | `constitution/backend-architecture.md` |
| Endpoint / request-response / status code work | `constitution/api-design.md` |
| Auth, authorization, secrets, sensitive data, file uploads, rate limiting | `constitution/security-rules.md` |
| Schema, query, migration work | `packages/db/constitution/db-design.md` (not stored here — db is shared infra) |
| Naming, TS style, error philosophy, git, testing | root `constitution/conventions.md` |
| Version-specific Express/Bun behavior | root `constitution/tech-stack.md` |

Also read the relevant feature's `AGENTS.md` before touching that feature's code.
Do not load unrelated feature docs.

---

## Commands

- Install: `bun install` (run from repo root; Turborepo manages workspaces)
- Dev server: `turbo dev --filter=backend`
- Build: `turbo build --filter=backend`
- Test: `turbo test --filter=backend` (Bun's built-in test runner)
- Type check: `turbo typecheck --filter=backend`
- Lint: `turbo lint --filter=backend`
- Migrate (dev): `bunx prisma migrate dev` (run from `packages/db`, or via the
  package.json script that wraps it — confirm current script name before running)

If a command above doesn't match what's actually in `package.json`/`turbo.json`,
trust the repo over this file and flag the mismatch.

---

## Development Workflow

1. Load context per the table above.
2. Locate the affected feature under `src/features/<name>/`; read its `AGENTS.md`.
3. Inspect existing implementation and related tests before changing anything.
4. For non-trivial changes, state a short implementation plan before writing code.
5. Implement within `Route → Controller → Service → Database/External` boundaries.
6. Run the relevant commands above.
7. Review the diff for unintended changes.
8. Report what changed and what was actually verified.

---

## Change Scope

Do not perform unrelated refactoring, introduce new architectural patterns,
bypass established layer boundaries for convenience, duplicate existing
utilities/services, or touch unrelated feature code. If a task seems to require
a real architectural change, explain the impact before proceeding.

---

## Security-Sensitive Work

Treat as security-sensitive: authentication, OTP, OAuth, sessions/tokens,
authorization, permissions, secrets, sensitive user data, credential handling,
file uploads, rate limiting. Load `constitution/security-rules.md` for any of
these. Never weaken a security requirement to make implementation easier —
escalate instead.

---

## Constitution Changes

Do not modify any file under `constitution/` (here or at repo root) unless the
user explicitly approves that specific change. Being asked to implement a
feature does not authorize changing the rules.

---

## Escalation

Ask instead of guessing when: requirements conflict, an architectural boundary
would need breaking, a destructive database operation is required, security
requirements are ambiguous, multiple materially different approaches are
possible, or a needed decision isn't in any loaded document (check
`constitution/decisions.md` at root first — it may already be answered).

---

## Definition of Done

- [ ] Correct constitution docs were loaded for this task (see table above).
- [ ] Existing implementation was inspected before changes.
- [ ] Changes stayed in scope; layer boundaries preserved.
- [ ] Relevant commands were actually run (not assumed).
- [ ] Feature docs updated if the change affects feature-specific behavior.
- [ ] No constitution document modified without explicit approval.
- [ ] Known limitations or failed checks reported honestly.
