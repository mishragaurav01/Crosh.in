# design-notes.md — Reconciled Figma Specs

Per-screen visual specs reconciled from user-provided Figma "Copy as Code"
against `design-system.md` + `globals.css @theme`. Implementation reads this
file, not raw Figma dumps. Desktop specs are appended as frames are delivered;
until then desktop is a token-consistent adaptation (recorded per section).

Token mapping uses `globals.css` names (`@theme`) since that is what classes
compile from. Where a value exists in CSS but not in the `design-system.md`
table, it is marked **[tabulate]** — adding it to the doc table needs approval.

---

## Shared elements

### TopAppBar (mobile)
- Height 54px, bg `background (#FFF8F7)`, padding 8px 20px, max-w 1280 centered
- Left: menu icon 17px `primary`; Center: "Crosh.in" Playfair Display 400
  32px/38px, tracking -0.8px, `primary`; Right: bag icon `primary`
- Collection-page variant adds a back/menu button left of logo (same tokens)

### TopAppBar (desktop — adapted until frame arrives)
- Keep existing `TopNavBar.tsx` structure/tokens: inline nav links
  (text-nav-active family), favorite + bag icon buttons. Nav links currently
  point nowhere → Shop→/products, New Arrivals→/products, Materials→/collections,
  Our Story→/#brand-story (anchors allowed; no dead `href="#"`)

### BottomNavBar (mobile only; hidden ≥ md)
- Fixed bottom, full width, h ~57–65px, bg `#FFF8F7`, top radius 12px,
  shadow `0px -4px 20px rgba(0,0,0,0.04)` (**S3 drift**: doc says 10px blur —
  recommend 20px, needs approval)
- Items: Home, Shop, Account, Cart — icon (~16px) over Inter 600 12px/17px label
- Inactive: icon+label `text-secondary (#4F4444)`
- Active: pill bg `primary-container (#F7D8D8)` behind icon+label, radius pill,
  content `text-nav-active (#745D5D)`
- Cart badge: absolute top-right of icon, 15px mauve (`primary`) circle,
  white count 10px (Nimbus Sans in Figma → **Inter**), border-radius pill
- Destinations: / , /products , /features/identity/login , /cart

### Footer (mobile)
- Bg `cream-alt (#F9F2F1)`; Home variant: flat top, padding 32px 20px;
  Catalog variant: top radius 32px (**R1 proposal**), padding-top 47px
- Content: "Crosh.in" Playfair 500 24px/31px `primary`, centered
- Links row: gap 16px, Inter 16px/26px `text-secondary` — Home/About/Contact/
  Shipping (labels from frames; hrefs `/`, `/about`, `/contact`,
  `/shipping` → simple static pages NOT built this pass; use `#`-less anchors
  to real routes only, others render as spans or route home — decide at build:
  default = link Home + Collections only, rest plain text)
- Copyright line: Inter 16px/26px `sage-dark`, opacity 0.6
- Footer links font shows Nimbus Sans on catalog frame → **Inter**

### Buttons
- Primary pill: bg `blush (#FADBDB)`, text `primary` Inter 16/24, padding
  16px 32px, radius pill (hero CTA)
- Outline pill: transparent, 1px `sage-dark` border, text `sage-dark`,
  padding 8px 24px, radius pill (brand story, pagination)
- Filter button: bg `cream-alt`, border 1px rgba(86,97,91,0.2), text
  `sage-dark`, icon 14.58px + label Inter 16/24, padding 8px 16px, radius pill
- Primary CTA (add-to-cart): bg `primary`, white Inter 500 14px/20px tracking
  0.7px, padding 24px 0 within 20px page margins, radius 12px, shadow
  **S2 proposal**
- Newsletter submit: bg `primary`, white Inter 16/24, radius **12px** (NOT
  pill — intentional), shadow `0px 1px 2px rgba(0,0,0,0.05)`

---

## Screen: Home (mobile 390w)

Frame: flex column; sections gap 47px inside main; bottom padding for nav bar.

1. **Hero** — w 350 (20px margins), h 437.5, radius 24, image cover
   (bouquet.jpg placeholder → any hero image asset), gradient overlay
   `linear-gradient(0deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,0) 50%)`, content
   anchored bottom padding 24, gap 16: heading Playfair 600 32px/38px white
   (drop-shadow `0 1px 1px rgba(0,0,0,.05)`) + primary-pill CTA ("Shop Now"
   → /products). Card shadow brand-tinted.
2. **Featured Collections** — header row (padding 0 20): "Featured
   Collections" Playfair 500 24/31 `primary` left; "View All" Inter 16/24
   underline `primary` right → /collections. Rail: horizontal scroll, cards
   200px: circle 200×200 with 4px `border-soft (#EDE7E6)` ring (inner image
   192, round), caption below centered Inter 16/24 `text-primary`. Data:
   `GET /api/collections?page=1&limit=…` (no banner field used here — circles
   need an image; collections DTO has none → **fallback: first member
   variant's product first image via detail call is N+1 — instead render
   neutral gradient circle + name when no image source exists; flagged**).
3. **Bestsellers** — heading Playfair 500 24/31 `primary`, padding 0 20.
   Grid 2-col gap 16 from `GET /api/products?page=1&limit=4`. Card: image
   container 167×222.66 radius 24 (bg cream-alt while loading), heart button
   31.83×36.31 top-right inset 8 (bg white/80 backdrop-blur 2px radius pill,
   heart icon `primary`) — decorative/disabled; title Playfair 400 16/24
   `text-primary` (**T1 conflict note: grid cards elsewhere use 18/22 — Home
   bestsellers frame says 16/24; unify per T1 decision when made**); price
   Inter 16/24 **`sage-dark (#56615B)` — T4 resolved: all prices sage-dark**.
4. **Brand Story Teaser** — card w 350 bg `cream-alt` radius 24 padding
   25/24; inner image 302×169.88 radius 12; heading Playfair 400 16/24
   `primary` centered; body Inter 16/24 `text-secondary` centered; outline
   pill button. Static copy from frame; id="brand-story" anchor.
5. **Testimonials** — white card radius 24 padding 33/32, brand-tinted card
   shadow; quote icon `primary-fixed-dim (#DDC0C0)` **[tabulate]**; quote
   Inter italic 16/24 `text-primary` centered; attribution Inter 16/24
   `primary`; dots row gap 4: active 8px circle `primary`, inactive
   `dot-inactive (#E8E1E0)`. Static sample content.
6. **Newsletter** — card w 350 bg `secondary-container (#D7E2DB)` radius 24
   padding 33/32; heading Playfair 400 16/24 `sage-muted (#5A6560)` centered;
   body Inter 16/24 `rgba(90,101,96,0.8)` centered; input: bg `background`,
   radius 12, padding 18px 24px, placeholder `text-placeholder (#6B7280)`;
   submit per Buttons spec. Submit = visible no-op notice.

Desktop: pending frame — adaptation: max-w container, hero taller, rails keep
scroll behavior, grids go 3–4 col. Recorded here once delivered.

---

## Screen: Products list / "Collection Page" (mobile 390w)

- Page bg `background`; main padding 0 20; sections gap 24; bottom pad 128
  above nav bar.
1. **Catalog Header** — row justify-between align-end: H2 Playfair 600 32/38
   `text-primary` ("Shop" / category name) + filter Button spec (label
   "Filter"). Quick-filter chips rail below (h 58, horizontal scroll, top-pad
   8): chip height 42, padding 8px 16px, radius pill, Inter 16/24;
   - Active: bg `primary-container (#F7D8D8)`, border 1px
     rgba(112,89,89,0.1), text `text-nav-active`
   - Inactive: bg `surface-container (#F3ECEC)` **[tabulate]**, border 1px
     `outline-variant (#D2C3C3)` **[tabulate]**, text `text-secondary`
   - Chips = categories from `GET /api/categories`; selection toggles
     `?category=<slug>`; "All" pseudo-chip clears filter (default active).
2. **Product Grid** — 2 col, column-gap 16 (167px cells), row-gap ~31;
   card: image box 167×222.66 radius 24 bg `cream-alt`; heart overlay 40×40
   circle top-right inset 16 (white/80, blur 2, drop-shadow button, icon
   `primary`/`text-secondary` mixed across frames → normalize `primary`);
   title Playfair 400 **18px/22px (T1)** `text-primary` up to 2 lines;
   price Inter 16/24 `sage-dark (#56615B)` (**T4 conflict vs Home**).
   Data: `GET /api/products?page&limit=6&category=<slug>`.
3. **Pagination** — single outline pill "Load More" (147×58) OR page dots if
   frames imply; default: Load More appends next page client-side; URL stays
   canonical (?page reflects highest loaded). Simpler alternative if state
   complexity bites: classic prev/next pills, same token spec.
4. Footer (catalog variant, R1 radius) + BottomNavBar per shared spec.

Desktop: pending frame.

---

## Screen: Product detail (mobile 390w)

Order: gallery → info → variants → CTA → accordion → reviews → related →

1. **Gallery** — full-bleed swipe container h 487.5; images object-cover;
   horizontal snap scroll; dots overlay bottom-center (bottom 24): active =
   elongated pill 24×8 `primary`, inactive 8×8 white/40.
2. **Product Info** (padding 32px 20px 0, gap 7) — row: name Playfair 400
   16/24 `text-primary` left + availability/price eyebrow right Inter 500
   14/20 tracking 0.7 `primary` (renders selected variant price short-form +
   "In Stock"/"Out of Stock"); description Inter 16/**26 (T3)** `text-secondary`.
3. **Variant Selection** (gap 16) — label "SELECT COLOR"/"SELECT SIZE"
   Inter 600 12/17 tracking 0.6 uppercase `text-primary`; swatches: 48px
   circles, gap 16 columns; selected ring via box-shadow
   `0 0 0 2px #FFFFFF, 0 0 0 4px #705959`; unselected `0 0 0 2px #FFFFFF,
   0 0 0 2px #705959`; unavailable opacity .6 + unselectable; label under
   swatch Inter 600 12/17 (selected `text-primary`, else `text-secondary`).
   Size values render as small pill buttons same states if sizes exist
   (frames show color circles; size treatment adapted, recorded).
   Colors: name→hex map file; unknown → neutral circle + initial letter.
4. **Add-to-cart CTA** — sticky-feel block between variants and accordion
   per frame placement (top ~814); Buttons spec (Primary CTA).
5. **Details Accordion** — dividers 1px `dot-inactive (#E8E1E0)`; items
   padding 24px 20px; header Inter 500 14/20 tracking 0.7 `text-primary`;
   chevron 11.31×6.71 rotates open. Items: Description / Details & Care /
   Shipping — body from product fields only (description real; Details &
   Care and Shipping have no data source → omit rows rather than invent,
   unless user supplies copy).
6. **Reviews** — STATIC layout only: header row "Reviews" Playfair 400 16/24
   + star icon `primary` + rating 14px medium + count `text-secondary`;
   review cards bg `cream-alt` radius 16 padding 24 shadow **S1**, author
   Inter 600 12/17, five stars 15px `primary`, quote Inter 16/26
   `text-secondary`. Sample copy from frame.
7. **Related Items** — heading "You might also love" Playfair 400 16/24;
   h-scroll cards 256 wide gap 16: image 256×320 radius 24, title Inter 500
   14/20 tracking 0.7 `text-primary`, price Inter 16/26
   **`sage-dark (#56615B)`** (frame showed `#705959` — normalized per T4).
   Source: same-category products minus current (max ~6).

Desktop: pending frame.

---

## Resolutions during S1 build (2026-08-24)

- **T1 approved:** grid product-card titles unified at Playfair 18px/22px
  everywhere (Home bestsellers included); written into design-system.md.
- **All remaining proposals approved 2026-08-24:** T2 (Inter 14/20 medium
  label role, tracking 0.7px), T3 (Inter 16/26 relaxed body), review-card
  shadow (`shadow-review-card`) + CTA shadow (`shadow-cta`) tokens, R1
  catalog-footer top radius (rounded-t-4xl), and [tabulate] color rows
  (primary-fixed-dim / surface-container / outline-variant). Applied to
  design-system.md (+ globals.css for the two new shadow tokens). No
  rejections.
- **Bottom-nav shadow blur 20px approved** over the doc's 10px;
  design-system.md updated.
- **Shadow tokens approved:** `--shadow-card` / `--shadow-button` /
  `--shadow-bottom-nav` added to `globals.css @theme` (values = doc table).
- **Hero asset:** no image exists in-repo; hero renders a token-based gradient
  placeholder at exact frame dimensions until an asset lands (user-approved).
- **Home route** uses `export const dynamic = "force-dynamic"` — catalog data
  must not be statically prerendered at build time (build failed against a
  stopped backend otherwise).
- Brand-story outline pill renders as decorative span (no destination page);
  hero copy "Handcrafted Warmth" and testimonial/newsletter copy are sample
  text pending real copy.
- Footer links: Home + Collections hyperlink; About/Contact/Shipping render as
  plain spans (per recorded default).

## Resolutions during S2 build (2026-08-24)

- **Approved backend DTO additions (user-approved, additive only):** public
  product detail now carries `categorySlug` (related-rail source), and public
  collection members carry `productSlug` (group → /products/<slug> links).
  Public-read tests updated; backend suite green.
- **S1 pagination bug fixed:** public list endpoints return
  `{ data, total, page, limit }`, but `lib/api.ts PaginatedData` declared
  `{ items, … totalPages }` — Home read `.items` (always undefined) and would
  have rendered empty bestsellers/collections with a live backend. Type
  corrected + call sites moved to `.data`.
- **Load More append model:** `?page=N` means highest-loaded; the server page
  fetches slices 1..N and concatenates, so clicking the pill appends via RSC
  re-render instead of client-side accumulation. Same observable behavior as
  the design default, no client state. Pill hidden when exhausted.
- **Footer catalog variant:** Footer is now pathname-keyed (client, like
  BottomNavBar) — `/products*` and `/collections*` get R1 rounded-t-4xl +
  pt-47px; other storefront pages keep the flat Home footer.
- **Collections index:** no delivered frame — adapted, not designed: 140px
  circular-thumb grid reusing the Home rail treatment.
- **Collection detail banner:** rendered as a rounded image block above the
  title (adaptation; no frame). Groups link their Playfair product heading to
  `/products/<productSlug>`; variant rows show color · size, price
  (sage-dark), and an Out of Stock tag when unavailable.
- **Add-to-cart guest CSRF:** `lib/api.ts` now falls back to `cart_csrf`
  after identity's `csrf_token` (pulled forward from the S3 note — S2's CTA
  is a real guest mutation surface and repeat adds would 403 otherwise).
- **`app/features/cart/types.ts` created early** holding the verified CartDto
  contract so the S2 CTA types its mutation response; S3's api/provider
  import it rather than redeclaring.
- **Filter button on catalog header is decorative** (`aria-hidden` span) —
  no filter panel exists this pass; matches decorative-hearts precedent.
- **Swatch defaults:** initial selection = first *available* variant (a
  multi-variant page never opens on an unpurchasable choice); size row renders
  as chip pills when >1 size exists for the chosen color; unknown color names
  render neutral circle + initial per gap table.
- **Gallery:** scroll-snap swipe + scroll-tracked dots (dots clickable);
  gradient placeholder block when the product has zero images.
- **Related rail failure is non-fatal:** if the same-category fetch fails the
  rail silently omits rather than tripping the segment error boundary.

## Resolutions during S3 build (2026-08-24)

- **Cart screen has no delivered frame** (mobile or desktop) — the cart page
  is a token-consistent adaptation, not a designed layout: Playfair 32/38 H1,
  product-card image treatment at 80×100 radius-md, Playfair 18/22 line titles
  (T1 role), Inter 16/24 attributes, prices sage-dark per T4, dividers in
  `surface-container-highest` (#E8E1E0, accordion precedent), outline-pill
  secondary actions. Recorded here so S4's visual comparison treats it as an
  adaptation, not a deviation from a frame.
- **Provider architecture:** single client provider in
  `app/features/cart/cart-context.tsx` mounted on `(storefront)/layout.tsx`.
  Fetch on mount + on auth-identity change (guests: no extra fetch; login:
  refetch picks up the server-side merge). All mutations flow through one
  promise queue; each success swaps state to the refreshed DTO — no refetch
  round trips, no duplicated store (contract clause 3 / Decision #6).
- **Stepper serialization:** queued writes carry an absolute target computed
  from the newest intended value (pending target if one is queued/in flight,
  else current quantity), so rapid clicks resolve in order with last-write-
  wins semantics — two fast +1 clicks PATCH 3 then 4.
- **Badge count = sum of item quantities** (no count field on CartDto);
  hidden while cart is null or empty, per S1 treatment. BottomNavBar's
  `cartCount` prop removed in favor of the feature-local CartBadge.
- **Unavailable lines:** stepper disabled + "Out of Stock" tag (collection-
  detail precedent), media dimmed 60% like unavailable swatches; line stays
  removable. Backend would 409 a qty change anyway.
- **Clear-cart confirm uses `window.confirm`** — no overlay/dialog primitive
  exists this pass (same rationale as the no-drawer decision).
- **Error surfaces:** INSUFFICIENT_STOCK renders inline next to the control;
  CART_ITEM_NOT_FOUND never reaches components (provider refetches + shows a
  transient status notice); every other mutation failure lands in a page-level
  alert banner; load failure renders SegmentError with retry. No silent blanks.
- **Add-to-cart CTA now feeds the provider** (`addItem`), closing the S2 open
  item — the badge updates straight from each add's refreshed DTO.
- **CartView imports storefront's SegmentError** rather than duplicating it —
  treated as shared UI for this slice; flagged if a proper shared location
  gets established later.

## Open items carried into build

- Featured-collections circle imagery has no DTO source — neutral fallback
  unless user provides per-collection images approach (applies to the
  collections index circles too)
- Accordion non-description rows omitted unless copy supplied
- Desktop frames outstanding for all screens (cart included — see S3
  resolutions above for the recorded adaptation)
- Guest-cart CSRF: ~~S3 must extend `lib/api.ts`~~ done in S2 (cart_csrf
  fallback live)
