# Conventions Constitution — Repository Level

## Purpose

Rules that apply identically regardless of which app or package an agent is
working in. If a convention only matters in one domain (e.g. Prisma naming,
React component structure), it belongs in that domain's constitution instead —
don't duplicate it here.

Load this when: naming anything, writing TypeScript, structuring an error,
writing a commit, or writing a test.

---

## TypeScript

- `strict` mode is on everywhere. Do not weaken `tsconfig` strictness to make a
  task easier — fix the underlying type issue.
- No `any` unless there is no reasonable alternative, and if used, comment why.
- Prefer explicit return types on exported functions.
- Shared types that cross the frontend/backend boundary belong in a shared
  `packages/types` (or equivalent) — do not hand-duplicate a type on both sides.

## Naming

- Files: `kebab-case` (e.g. `create-order.service.ts`).
- Variables/functions: `camelCase`. Types/interfaces/classes: `PascalCase`.
- Constants that are truly fixed: `UPPER_SNAKE_CASE`.
- Booleans read as questions: `isActive`, `hasPermission`, not `active`, `permission`.
- Be consistent with existing naming in a module before introducing a new pattern,
  even if you'd personally choose differently.

## Error Handling Philosophy

- Every app has its own error model (see backend/frontend constitution docs for
  specifics), but the shared philosophy is: fail explicitly, never swallow errors
  silently, never expose internal detail (stack traces, DB errors, file paths)
  to an external consumer.
- Distinguish expected failure (validation, not-found, unauthorized) from
  unexpected failure (bugs, infra issues) in how they're logged and handled.

## Git

- Commit messages: imperative mood, short summary line, body if the "why" isn't
  obvious from the diff. e.g. `Add OTP rate limiting to auth service`.
- One logical change per commit where practical.
- Never commit `.env`, credentials, or generated artifacts that belong in
  `.gitignore`.
- Do not rewrite shared history or use destructive commands (`push --force`,
  `reset --hard` on shared branches) without explicit authorization.

## Testing

- Test files live next to the code they test, or in a parallel `__tests__`
  structure — match whatever the app already does; don't introduce a second
  pattern.
- Test names describe behavior, not implementation: `"rejects expired OTP"`,
  not `"test4"`.
- Never claim a test suite passed without actually running it.

## Documentation Discipline

- Code comments explain *why*, not *what* — the code already says what.
- Update the relevant `AGENTS.md`/constitution doc when a change materially
  affects the rules it describes. Don't let docs silently go stale.
- Constitution documents are not edited casually — see each `AGENTS.md`'s rule
  on constitution changes.
