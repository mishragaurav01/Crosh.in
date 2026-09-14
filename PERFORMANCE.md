# Site Performance — Task Tracker

Living checklist for the hosted-site performance work. Status = checked when
the item is implemented, verified live, and reported here.

Reference: backend on Render (`https://crosh-in.onrender.com`), frontend on
Netlify, DB: Neon (confirmed — not Render free Postgres).

---

## Done

- [x] **T0. Keep-alive: backend `/health` endpoint + pinger**
  - Added public `GET /health` (runs `SELECT 1` against the DB) in `apps/backend/index.ts`.
  - Originally pinged via `.github/workflows/keep-awake.yml` every 10 min
    (committed `c28ea70`), **superseded 2026-09-14**: GitHub Actions
    `schedule` is best-effort and fired only ~6–8×/day, insufficient to
    defeat Render's ~15-min idle spin-down. Replaced with an external
    **cron-job.org** job hitting `/health` every 10 min; `keep-awake.yml`
    deleted (`9d29613`, merged into `main` as `c04f647`).
  - Verified live: `https://crosh-in.onrender.com/health` returns HTTP 200.

- [x] **T0b. `/health` + pinger live on `main`**
  - Render deployed; cron-job.org keep-alive job running; Render deploy
    branch = `main`.

- [x] **T1. ISR on storefront pages — DONE (with decision)**
  - `/`, `/products/[slug]`, `/collections`, `/collections/[slug]` have
    `export const revalidate = 60`. Build against live backend confirms:
    `○ / 1m`, `○ /collections 1m`; `[slug]` routes are on-demand ISR (`ƒ`).
  - **Decision 2026-09-14: `/products` stays `ƒ` dynamic** (option (a)).
    It reads `searchParams` (category/page) which opts it out of ISR in the
    previous (non-Cache-Components) model, and with T3 shipping a client-side
    catalog read the server legs are now cheap anyway.
  - Netlify's Next adapter support for App Router `revalidate` is a
    **post-deploy verification step**: if caching never materializes live,
    revisit T2.

- [x] **T3. `/products` pagination fan-out — client-side Load More**
  - New `catalog-grid.tsx` (client) renders the grid + "Load More" pill. The
    server page (`products/page.tsx`) fetches page 1 and — only for deep links
    `?page=N>1` — appends slices 2..N; every subsequent Load More click issues
    exactly **one** backend request and appends one page in place
    (`router.replace` keeps `?page=N` canonical, `scroll: false`).
  - Error state per contract #6: inline `role="alert"` message with the button
    still available for retry (no silent blank).
  - Old `pagination.tsx` (server Link) deleted as dead code.

- [x] **T4. Image optimization cost**
  - `apps/frontend/next.config.ts` now sets `images: { unoptimized: true }`
    (uploads are already WebP-compressed client-side). Serves the source as-is,
    so `/_next/image` no longer invokes a Netlify function per image. Kept
    `remotePatterns` for the Image component's host allow-list.

- [x] **T5. Render-blocking font CSS**
  - Removed the Material Symbols `<link rel="stylesheet">` from
    `layout.tsx` `<head>`. New client `components/material-symbols.tsx`
    injects the stylesheet after hydration — no third-party render-blocking
    round trip; icons swap in when ready (`display=block` hides the
    raw-text fallback). Axis tags kept lowercase-first alphabetical
    (`opsz,wght` then `FILL,GRAD`) or Google returns 400.

- [x] **T6. Database location confirmed** — Neon (external, no 30-day expiry,
  no idle sleep). No action needed.

---

## Remaining

### T2. Cache headers on public catalog endpoints — DECISION: DEFERRED

T3 introduced a client-side catalog read (`catalog-grid.tsx` load-more), which
was the documented revisit trigger. Revisited 2026-09-14 and still **deferred**:

- The load-more fetch is a **credentialed, cross-origin** request
  (`credentials: "include"` + CSRF cookie). Public, non-authenticated
  CDN/browser caching of that response would need distinct non-credentialed
  caching headers per surface; browsers already bypass shared caches for
  credentialed XHR, so Netlify's edge gain is marginal.
- Refetch frequency is low: one extra page per click is already cheap.
- **Action if it changes:** if live ISR verification shows slow regeneration,
  or a non-credentialed public read appears, add `Cache-Control` to
  `apps/backend/src/features/catalog` public list controllers.

### T7. Uptime monitoring (non-code) — PARTIALLY COVERED

The cron-job.org keep-alive job can email on failure and on recovery after a
prior failure (monitors backend `/health`, 2026-09-14).
**Still open:** cron-job auto-disables a job after ~25 consecutive failures
(a dead URL would silently stop pinging, so nothing re-wakes/reports it), and
there is no monitor on the Netlify site URL. Add a secondary external monitor
(e.g., UptimeRobot free) covering the Netlify site to catch both.

---

## Not run / pending live verification

- Build/typecheck/lint ran locally (see below); **staged-for-live**: T1 Netlify
  ISR behavior, T3 load-more latency, T4 no-optimizer function savings, T5
  first-paint improvement — confirm after next Netlify deploy.
- `turbo lint --filter=frontend` reports **pre-existing** errors in
  `components/LoginForm.tsx:121` (unescaped entity), `components/TopNavBar.tsx:5`
  (`<a>` → `<Link>`), and a warning in
  `app/features/identity/signup/page.tsx:13` — untouched, out of scope here.