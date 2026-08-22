# AGENTS.md — Frontend

## Purpose

Operational instructions for `apps/frontend`. This file governs workflow.
Architecture, component conventions, and design system rules live in
`constitution/` and are loaded selectively.

---

## Context Loading

Always load this file first. Then, based on task type:

| Task type | Load |
|---|---|
| Routing, data fetching, rendering strategy, app structure | `constitution/frontend-architecture.md` |
| Component structure, props, state patterns | `constitution/frontend-architecture.md` |
| Colors, typography, spacing, brand tokens | `constitution/design-system.md` |
| Calling the backend API | `apps/backend/constitution/api-design.md` (read-only reference — never implies frontend can bypass it) |
| Naming, TS style, error philosophy, git, testing | root `constitution/conventions.md` |
| Version-specific Next.js/React behavior | root `constitution/tech-stack.md` |

Also read the relevant feature's `AGENTS.md` before touching that feature's UI.
Do not load backend feature docs unless implementing the integration itself.

---

## Commands

- Install: `bun install` (from repo root)
- Dev server: `turbo dev --filter=frontend`
- Build: `turbo build --filter=frontend`
- Test: `turbo test --filter=frontend`
- Type check: `turbo typecheck --filter=frontend`
- Lint: `turbo lint --filter=frontend`

If these don't match `package.json`/`turbo.json`, trust the repo and flag it.

---

## Development Workflow

1. Load context per the table above.
2. Locate the affected feature under `src/features/<name>/`; read its `AGENTS.md`.
3. Inspect existing components/patterns before adding new ones — check for an
   existing component before building a new one from scratch.
4. Implement, matching established patterns (data fetching, state, styling).
5. Run the relevant commands above.
6. Review the diff; report what changed and what was verified.

---

## Boundaries

- The frontend must never access the database or `packages/db` directly.
- The frontend is not a security boundary — never treat client-side validation
  or UI-hidden actions as sufficient authorization; the backend enforces that.
- Do not hardcode values that belong in `constitution/design-system.md` (colors,
  fonts, spacing) — use the established Tailwind config/tokens.

---

## Change Scope

Do not perform unrelated refactoring, introduce new state-management patterns,
duplicate existing components/hooks, or touch unrelated feature code.

---

## Constitution Changes

Do not modify any file under `constitution/` (here or at repo root) without
explicit user approval.

---

## Escalation

Ask instead of guessing when: the required backend endpoint doesn't exist yet,
a design token isn't defined for a needed value, multiple materially different
component approaches are possible, or a needed decision isn't in any loaded
document.

---

## Definition of Done

- [ ] Correct constitution docs were loaded for this task.
- [ ] Existing components/patterns were inspected before adding new ones.
- [ ] Changes stayed in scope.
- [ ] Relevant commands were actually run.
- [ ] No design tokens or values hardcoded outside the design system.
- [ ] No constitution document modified without explicit approval.
- [ ] Known limitations or failed checks reported honestly.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
