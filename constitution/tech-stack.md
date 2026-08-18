# Tech Stack Constitution — Repository Level

## Purpose

Pins the actual versions in use and flags version-specific behavior that differs
from what a model's training data typically assumes. This matters more than usual
here because several parts of this stack are newer than most training data —
default to what's written here over general knowledge.

Load this when: unsure whether an API/pattern is valid for the pinned version,
or about to suggest a dependency.

---

## Core Stack

| Layer | Choice | Notes |
|---|---|---|
| Monorepo | Turborepo | Task orchestration via `turbo.json`, not raw workspace scripts |
| Runtime / package manager | Bun | Use `bun` / `bunx`, not `npm`/`yarn`/`pnpm`, unless a specific tool requires it |
| Backend framework | Express 5 | See gotchas below — error handling and routing behavior changed from Express 4 |
| Frontend framework | Next.js 16 | App Router assumed unless stated otherwise |
| UI library | React 19 | See gotchas below |
| Database | PostgreSQL | Accessed only through `packages/db` |
| ORM | Prisma | Standard and only database abstraction — see `packages/db/constitution/db-design.md` |
| Validation | Zod | Standard validation mechanism, backend and frontend |
| Styling (frontend) | Tailwind | Design tokens defined in `apps/frontend/constitution/frontend-architecture.md` |

*(Update this table as versions are bumped or tools change — this must stay accurate,
not aspirational.)*

---

## Version-Specific Gotchas

### Express 5
- Async errors in route handlers are now caught automatically and forwarded to
  error-handling middleware — do not manually wrap every handler in try/catch
  purely to forward errors, but centralized error middleware is still required.
- Some Express 4 middleware patterns and removed methods no longer apply. Verify
  against Express 5 docs before assuming Express 4 knowledge transfers.

### React 19
- Actions, `useActionState`, and `useOptimistic` are stable — prefer these over
  older manual-state patterns for form/mutation handling where appropriate.
- `forwardRef` is no longer required for function components in the same way —
  check current API before defaulting to older patterns.

### Next.js 16
- Confirm current caching and data-fetching defaults before assuming behavior
  from earlier Next.js versions — these have changed across major versions and
  training data is frequently stale here.

### Bun
- Use Bun's built-in test runner (`bun test`) unless the project has explicitly
  adopted a different one.
- Bun's Node compatibility is broad but not total — if a package misbehaves,
  check Bun compatibility before assuming the code is wrong.

---

## Adding a Dependency

Before adding any new package:

- Confirm it's actually necessary — don't add a library for something Bun,
  Prisma, Zod, or the framework already does.
- Prefer actively maintained packages with Bun/Express 5/React 19 compatibility
  confirmed, not just assumed from past versions.
- Security-sensitive dependencies (auth, crypto, payments) require extra scrutiny
  per `apps/backend/constitution/security-rules.md`.

---

## Uncertainty Rule

If you're not sure whether a pattern is valid for the pinned version, say so
explicitly rather than confidently applying older-version knowledge. Flag it and,
where possible, verify against current documentation before implementing.
