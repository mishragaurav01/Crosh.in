# task.md — Storefront Browse + Cart

Granular checklist. Work top to bottom. Check off only what was actually done
and verified. S3 depends on cart backend Phases 3–5 being complete.

---

## Prerequisites

- [x] Cart backend mounted at `/api/cart`, DTO mapping landed, tests green
      *(verified 2026-08-24: mount at apps/backend/index.ts:41; explicit DTO
      mapping in cart.service.ts; `bun test` = **370 pass / 0 fail** (36
      files); `bunx tsc --noEmit` clean — run independently for this check)*
- [x] Actual cart DTO field names inspected and recorded here before UI wiring:
      ```jsonc
      // GET /api/cart → { success: true, data: <CartDto> }
      // Mutations (POST /items, PATCH /items/:id, DELETE /items/:id, DELETE /)
      // also return { success: true, data: <refreshed CartDto> } (Clarification #5)
      CartDto: {
        items: CartItemDto[],
        subtotal: number        // integer minor units; sums ALL lines incl. unavailable
      }
      CartItemDto: {
        id: string              // cart-item id — path param for PATCH/DELETE
        variantId: string       // body field for POST /api/cart/items
        quantity: number
        price: number           // live-read, integer minor units
        available: boolean      // stock > 0; raw stock never exposed
        size: string
        color: string
        productName: string
        productSlug: string     // links to /products/<productSlug>
        image: { url: string, alt: string | null } | null   // first product image
      }
      ```
      Errors: `409 INSUFFICIENT_STOCK`, `404 CART_ITEM_NOT_FOUND`,
      `422 VALIDATION_ERROR`, `403 CSRF_FAILED`; bodies `{ success:false,
      error:{ code, message } }`. PATCH quantity is absolute-set; `0` removes.
      Empty cart shape: `{ items: [], subtotal: 0 }`.
      **Wiring note:** guests CSRF via non-httpOnly `cart_csrf` cookie +
      `X-CSRF-Token` header (first-ever mutation exempt); `lib/api.ts`
      falls back to `cart_csrf` when identity's `csrf_token` is absent
      *(pulled forward into S2 because the add-to-cart CTA performs guest
      mutations; done 2026-08-24)*.
- [x] Token proposals (T1–T4, S1–S3, R1, tabulated colors) reviewed by user —
      approved items applied to `design-system.md` + `globals.css`; rejected
      items recorded with the fallback used
      *(fully resolved 2026-08-24: T1=18/22, T2 label role, T3 relaxed body,
      T4=sage-dark prices, nav-blur 20px, shadow tokens incl. review-card +
      CTA, R1 catalog-footer radius, [tabulate] colors — all approved &
      applied. No rejections.)*

## S1 — Shell + Home

- [x] `app/(storefront)/` group created; `layout.tsx` shell assembled
- [x] TopAppBar mobile variant: menu icon / centered Playfair logo / bag icon;
      desktop variant: inline nav links (Shop, New Arrivals, Materials, Our
      Story) + favorite/bag icons per existing TopNavBar tokens
      *(menu icon + favorite decorative this pass — no drawer/wishlist)*
- [x] BottomNavBar client component: Home/Shop/Account/Cart, blush pill active
      state, cart badge (mauve circle, white count; hidden when no data)
- [x] Footer mobile variant per frame (cream-alt, wordmark, links row,
      60%-opacity copyright); catalog-page footer top-radius treatment noted
      *(R1 catalog variant landed in S2: rounded-t-4xl + pt-47 on
      /products* and /collections* via pathname-keyed Footer)*
- [x] Home page moved from `app/page.tsx`; old file deleted; admin untouched
- [x] Hero: rounded image, dark gradient overlay, white Playfair heading,
      blush pill CTA → `/products`
      *(image = token gradient placeholder per user approval; copy sample)*
- [x] Featured Collections rail: circular thumbnails (4px border-soft ring),
      centered captions, horizontal scroll, "View All" underlined link
      *(circles = neutral gradient fallback — no image source in DTO, flagged)*
- [x] Bestsellers grid from `GET /api/products`: shared ProductCard (image
      radius-lg, decorative heart overlay, title token per T1 outcome, price
      via formatPrice in color per T4 outcome)
- [x] Brand Story Teaser card (cream-alt, inner image radius-md, centered copy,
      outline pill button)
      *(inner visual = placeholder; pill decorative — no destination page)*
- [x] Testimonials card — static sample content, quote icon, dots (first active)
- [x] Newsletter card — sage bg, cream input radius-md, mauve submit radius-md;
      submit shows visible no-op notice (no backend)
- [x] `formatPrice` util added; used everywhere prices render

## S2 — Catalog Browse

- [x] Products list page (server) reading `searchParams` Promise
      *(also fetches slices 1..N server-side so ?page=N = highest loaded;
      unknown category slug → notFound())*
- [x] Quick-filter chips from `GET /api/categories`: active = blush bg /
      text-nav-active; inactive = surface-container / outline-variant border;
      selection rewrites `?category=` URL param
      *(active chip re-click toggles back to All; category switch resets
      ?page)*
- [x] Catalog header row: Playfair semibold H2 left, filter button right per
      frame (cream-alt bg, sage-dark 20% border, icon + label)
      *(filter button decorative — no filter panel exists this pass)*
- [x] Product grid: 2-col mobile, gap 16, cards per design-notes spec
- [x] Pagination control per frame (outline pill), wired to `?page=`
      *(Load More append implemented as RSC re-render of slices 1..N instead
      of client-side accumulation — same observable behavior, URL stays
      canonical; hidden when exhausted)*
- [x] Empty-result state designed (no products for filter)
      *("View everything" reset link when a filter is active)*
- [x] Product detail: swipeable full-width gallery (487px mobile) with
      elongated-active pagination dots overlay
      *(scroll-snap + scroll-tracked dots, dots also clickable; gradient
      placeholder when product has no images)*
- [x] Title row: name left; availability label right (14px medium tracking,
      mauve) driven by selected variant's `available`
      *(eyebrow shows selected variant price above the stock label per
      design-notes; initial selection = first available variant)*
- [x] Description block (Inter relaxed body per T3 outcome)
      *(inline under title row; repeated inside accordion Description row)*
- [x] Variant swatches: 48px circles from name→hex map (fallback neutral +
      initial); selected double-ring; unavailable 60% opacity, unselectable;
      single-variant products skip section entirely
      *(sizes render as chip-style pills when >1 size for the chosen color,
      per recorded adaptation)*
- [x] Details accordion: dividers `E8E1E0`, 14px medium headers, chevrons;
      content sourced from product fields (description/details/care as
      available — no invented data)
      *(description is the only real field → only Description row renders)*
- [x] Add-to-cart CTA: full-width minus padding, mauve bg radius-md, white
      14px medium tracked label, CTA shadow per S2 outcome; disabled until a
      selectable variant is chosen; posts to `/api/cart/items`
      *(guest CSRF: cart_csrf fallback pulled forward into lib/api.ts — was
      an S3 note but S2's mutation needs it for repeat adds)*
- [x] INSUFFICIENT_STOCK inline message near CTA; state refresh handled
      *(message done; refreshed-DTO swap has no consumer until the S3 cart
      provider lands — response intentionally unused this slice, flagged)*
- [x] Related rail: same-category products excluding current; 256px cards
      (image 320 tall, radius-lg, title 14px medium, price mauve per frame)
      *(price normalized to sage-dark per T4; required approved backend
      addition `categorySlug` on public product detail DTO)*
- [x] Reviews section rendered as static sample layout (no API calls)
- [x] Collections list + detail pages (banner when present, member variants
      grouped by productName); empty-collection state designed
      *(list page adapted, not designed — circular-thumb grid per Home rail
      treatment; required approved `productSlug` on collection member
      variants so groups link to product pages; banner = rounded image block
      adapted since no frame delivered)*
- [x] Unknown slugs hit `notFound()` → 404 page
      *(branded `(storefront)/not-found.tsx` added; root catch-all unchanged)*
- [x] `loading.tsx` + `error.tsx` on every data-dependent segment

## S3 — Cart

- [x] `app/features/cart/api.ts` over `lib/api.ts` only (no second client)
      *(thin wrappers; every endpoint returns CartDto per Clarification #5)*
- [x] Cart provider: fetch on mount + on auth change; badge consumes it
      *(auth change = identity id transition via useAuth; mutations apply the
      refreshed DTO directly — no refetch round trip; BottomNavBar badge now
      renders CartBadge from the provider; add-to-cart CTA feeds it too)*
- [x] Cart page renders DTO: name/slug link, attributes, unit price, line
      total, availability flag; subtotal from server field only
      *(no delivered frame — token-consistent adaptation, recorded in
      design-notes; unavailable lines show Out-of-Stock tag + disabled
      steppers, remain removable)*
- [x] Quantity steppers PATCH absolute values; clicks serialized (last wins)
      *(single mutation queue; queued absolute target computed from newest
      intended value so rapid +/+ lands 3 then 4)*
- [x] Stepping to 0 removes the line in UI terms (backend semantics)
      *(minus button always enabled on available lines; PATCH quantity 0)*
- [x] Remove-line button (DELETE item); clear-cart with confirm (DELETE cart)
      *(confirm = window.confirm — no overlay primitive exists, adaptation
      recorded)*
- [x] CART_ITEM_NOT_FOUND treated as stale UI: refetch + notice
      *(provider swallows it, refetches, shows transient status notice)*
- [x] Other errors → explicit error state (never silent blank)
      *(INSUFFICIENT_STOCK inline at control; everything else page-level
      alert banner; load failure → SegmentError with retry)*
- [x] Empty-cart state with link back to `/products`
- [x] Cart page loading + error states implemented
      *(segment loading.tsx/error.tsx + in-view skeleton/error from provider
      status — shared CartSkeleton component)*

      *(S3 machine-verified 2026-08-24: `bunx tsc --noEmit` clean, ESLint
      clean on all touched files, `bunx next build` passes with /cart
      prerendering its shell; live mutation behavior is exercised by the S4
      browser walkthrough below.)*

## S4 — Verification

Walkthrough checklist (real browser, 390px viewport + desktop where frames
exist). Record outcomes, not intentions:

- [x] Guest: browse → add to cart → reload → cart persists (cookie survived)
      *(HTTP-level machine-verified: persistence across requests with the
      guest cookie jar; real-browser click-through not performed)*
- [x] Guest adds item → logs into account without cart → merged/promoted
      visible after login refetch *(machine-verified: OTP login, post-login
      refetch shows merged cart, `guest_token` cleared)*
- [x] Guest adds overlapping variant → logs in → summed, capped at stock
      *(machine-verified: server cart @stock=200 + guest @1 → login → 200,
      not 201)*
- [ ] Unavailable variant cannot be added; single-variant product bypasses
      selector *(backend 409 rejection machine-verified; swatch opacity/CTA
      gating and single-variant bypass are UI behaviors — browser-pending)*
- [ ] PATCH beyond stock → inline message; state consistent afterward
      *(state consistency after 409 machine-verified; inline message rendering
      is browser-pending)*
- [ ] Remove line / clear cart behave and re-render correctly *(API behavior +
      refreshed-DTO swap machine-verified; re-render is browser-pending)*
- [x] Unknown product/collection slug → 404 page *(machine-verified that
      `notFound()` fires and the branded `(storefront)/not-found.tsx` content
      + `next-error` marker are delivered in both dev and prod responses;
      caveat below)*
- [ ] Admin routes (`/catalog/*`) untouched and still guarded *(diff confirms
      zero admin files touched; guard is client-side `AdminGuard` — redirect
      assertion is browser-pending)*
- [ ] Loading/error states observed (throttled network or stopped backend)
      *(partially machine-verified: stopped backend → page throws `fetch
      failed` with error digest logged, segment `error.tsx` engaged as
      client-side fallback over streamed shell; loading-skeleton shells
      present in SSR output. Actual visual observation is browser-pending)*
- [ ] Built pages visually compared against delivered frames; deviations listed
      *(not performed — requires a real browser; no substitute exists)*
- [x] `bunx tsc --noEmit` in apps/frontend run — result reported
      *(clean, 2026-08-25)*
- [x] ESLint on changed files — result reported honestly (pre-existing
      LoginForm/TopNavBar errors noted, not silently ignored) *(changed-file
      runs clean; full repo matches documented baseline: 2 pre-existing
      errors in LoginForm.tsx / TopNavBar.tsx, 3 warnings elsewhere)*
- [x] Full diff reviewed for scope creep; deviations reported explicitly
      *(all tracked modifications map to recorded approved decisions; no
      `(admin)` files touched)*

### S4 machine-check notes (2026-08-25)

* Method: live HTTP walkthrough script against running backend (:3002) +
  frontend (:3000) — 25/25 checks passed covering guest lifecycle, CSRF
  exemption on first mutation, stock caps (409 `INSUFFICIENT_STOCK`),
  unavailable-variant rejection, `CART_ITEM_NOT_FOUND` recovery paths,
  DTO shape (no Prisma leakage), merge-promotion, and overlap-cap-on-login.
  Backend test suite at time of check: 370 pass / 0 fail.
* Known limitation (streaming): unknown slugs deliver a 200 first byte
  because `loading.tsx` flushes the shell before the page resolves; the
  branded 404 renders client-side via Next's error-fallback payload
  (`NEXT_HTTP_ERROR_FALLBACK;404`, confirmed dev + prod build). If wire-level
  404 statuses are required (SEO/analytics), revisit the loading-boundary
  placement for dynamic detail segments — needs a decision, not fixed here.
* Observation for backend owners: response cookie values show `guest_token`
  and `cart_csrf` share the same value; consider independent secrets.
  Out of scope for this frontend feature; flagged only.
* Test fixtures used: product `rose`; red variant
  `cmt29flq10004j422mn87vh7a` (stock 200); black variant
  `cmt29dwuy0003j422mu21u05k` (unavailable); emails `s4-promo@example.com`,
  `s4-overlap@example.com`.

## Reporting

On completion report: what shipped per slice; walkthrough evidence (which
clauses machine-checked vs eyeballed); typecheck/lint results; every deviation
from AGENTS.md/design-notes; anything left open.
