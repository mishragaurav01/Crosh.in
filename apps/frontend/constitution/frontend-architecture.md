# Frontend Architecture Constitution

## Purpose

Defines the architecture that applies across the CroshFinal frontend. Feature-specific
UI structure may extend this but must remain compatible.

---

## Framework

Next.js 16, App Router, React 19.

Server Components are the default. Use Client Components (`"use client"`) only
when interactivity, browser APIs, or hooks genuinely require it — don't mark a
component client-side by default or out of habit.

---

## Data Flow

The frontend communicates with `apps/backend` exclusively via the REST API
defined in `apps/backend/constitution/api-design.md`. It never accesses
`packages/db` or the database directly, even in server-side code.

Prefer server-side data fetching (Server Components, route handlers) for initial
page data. Use client-side fetching only for interactive, post-load updates
(e.g. cart mutations, live search).

---

## Feature Organization

Frontend code is organized by business feature under `src/features/<name>/`,
mirroring the backend's feature boundaries (`identity`, `catalog`, `cart`,
`payment`, `order`, `shipment`). A feature folder may contain its own
components, hooks, types, and API client functions.

Shared, cross-feature UI belongs in a shared `components/` or `packages/ui`
location — do not duplicate a component across features when it's genuinely
generic.

---

## State Management

- Server state (data from the backend) is fetched, not duplicated into global
  client state, unless a specific caching/optimistic-update need justifies it.
- Local UI state uses React's built-in state (`useState`, `useReducer`,
  React 19 `useActionState`/`useOptimistic` for form/mutation flows).
- Do not introduce a global state library (Redux, Zustand, etc.) without an
  explicit, demonstrated need — this is an architectural change requiring review.

---

## Forms & Mutations

Prefer React 19 Actions for form submission and mutation flows where they fit
naturally. Validate on the client for UX only — the backend validation via Zod
is authoritative and must never be treated as redundant.

---

## Styling

Tailwind CSS. Design tokens (colors, typography, spacing) are defined in
`constitution/design-system.md` — do not hardcode brand values inline.

---

## Error & Loading States

Every data-dependent view must define its loading and error states explicitly
(Next.js `loading.tsx`/`error.tsx` conventions, or component-level equivalents).
Do not let a failed fetch render a blank or broken page silently.

---

## Authentication State

The frontend reflects authentication state provided by the backend (session/
token) but never independently decides authorization — it only reflects what
the backend allows. UI-level hiding of an action is a UX convenience, not a
security boundary; the backend enforces the real check.

---

## Architectural Change

Introducing a new framework-level pattern (state library, alternate data-fetching
approach, routing pattern outside App Router conventions) requires explicit
review before implementation.
