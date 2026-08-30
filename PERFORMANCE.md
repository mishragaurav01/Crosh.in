# Site Performance — Task Tracker

Living checklist for the hosted-site performance work. Status = checked when
the item is implemented, verified live, and reported here.

Reference: backend on Render (`https://crosh-in.onrender.com`), frontend on
Netlify, DB: Neon (confirmed — not Render free Postgres).

---

## Done

- [x] **T0. Keep-alive: backend `/health` endpoint + GitHub Actions pinger**
  - Added public `GET /health` (runs `SELECT 1` against the DB) in `apps/backend/index.ts`.
  - Added `.github/workflows/keep-awake.yml` — pings `/health` every 10 min.
  - Committed `c28ea70`, pushed to `main`.
  - Verified live: `https://crosh-in.onrender.com/health` returns HTTP 200.

- [x] **T0b. `/health` + workflow live on `main`**
  - Render deployed; keep-awake workflow running.
  - Render deploy branch = `main`.

- [x] **T6. Database location confirmed** — Neon (external, no 30-day expiry,
  no idle sleep). No action needed.

---

## Remaining

### T1. ISR on storefront pages — DONE (with caveat)

Swap `export const revalidate = 60` in (verified: `bun run build` against live
backend, clean typecheck):

- `apps/frontend/app/(storefront)/page.tsx` ✅ — route: `○ / 1m`
- `apps/frontend/app/(storefront)/products/page.tsx` ⚠️ — **still `ƒ` dynamic**
- `apps/frontend/app/(storefront)/products/[slug]/page.tsx` ✅ — on-demand ISR
- `apps/frontend/app/(storefront)/collections/page.tsx` ✅ — `○ /collections 1m`
- `apps/frontend/app/(storefront)/collections/[slug]/page.tsx` ✅ — on-demand ISR

**Caveat:** `/products` reads `searchParams` (category/page), which opts the
page out of ISR — `revalidate` is ignored there. Options when T3 is scheduled:
(a) accept dynamic on `/products` only, or (b) static shell + client-side list
(which then needs T2 cache headers to stay cheap). Also: Netlify's Next
adapter support for App Router `revalidate` must be confirmed after deploy —
fall back to T2 if caching never materializes.

### T2. Cache headers on public catalog endpoints — DECISION PENDING

Netlify's Next adapter already uses durable caching for cacheable Next.js
responses, and the storefront has zero client-side catalog fetches (all reads
are in the ISR pages above). So backend `Cache-Control` headers likely add a
second, redundant layer — recommended to **defer unless live ISR verification
shows otherwise**. Revisit only if:
- ISR regeneration proves slow, or
- a client-side/public catalog read appears later.

### T3. `/products` pagination fan-out

`apps/frontend/app/(storefront)/products/page.tsx` fires one backend request
per loaded page (N parallel calls per render). Finesse the "load more" model
or paginate properly. Lower priority once T1 lands.

### T4. Image optimization cost

`apps/frontend/next.config.ts` allows any remote host → every
`/_next/image` request runs through a Netlify function (function-invocation
budget + latency). Consider `images: { unoptimized: true }` (uploads are
already compressed WebP client-side) or Netlify's image CDN.

### T5. Render-blocking font CSS

Material Symbols loaded via `<link rel="stylesheet">` in
`apps/frontend/app/layout.tsx` — third-party render-blocking round trip.
Minor; self-host or preload/async where possible.

### T7. Uptime monitoring (non-code)

Add an external monitor (e.g., UptimeRobot free) on backend `/health` and the
Netlify site URL — emails you if something is actually down. The GitHub
Actions pinger cannot report its own death.