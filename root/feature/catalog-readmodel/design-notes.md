# Design Notes — Catalog Read Model

Decisions, rejected alternatives, and open items for this feature. Anything
here that changes must be recorded below with date + reason.

## Decisions

### D1 — Fix the read model, not the membership model (2026-08-25)

Collection membership stays variant-grain (`VariantCollection`). It is
genuinely useful ("gifts under ₹500 = specific variants") and standard among
merchandising tools. The lag was that no read path assembled products from
members. We add `products[]` to collection detail rather than adding
product-grain membership.

### D2 — `products[]` reuses `ProductListItemDto` exactly (2026-08-25)

No parallel "collection card" shape. Same fields (`id`, `name`, `slug`,
`priceMin`, `images[]`, …) so the storefront renders one component
(`ProductCard`) everywhere and future surfaces (search, home rails) reuse it.

**priceMin semantics:** computed across the product's FULL variant set — not
just member variants — so a card shows identical price on `/products` and in
a collection. Membership affects *whether* a product appears, never its price.

### D3 — Status lifecycle defaults (2026-08-25)

* Enum: `DRAFT | PUBLISHED | ARCHIVED`.
* Existing rows at migration → PUBLISHED (storefront unchanged on deploy).
* Admin create → default DRAFT; publish is an explicit act.
* Public visibility: published only. Draft/archived detail requests return
  404 `PRODUCT_NOT_FOUND` — indistinguishable from a nonexistent slug, so no
  existence oracle.
* Admin list: all statuses by default, optional `?status=` filter (UI later).

### D4 — Color grounding via lookup table, staged (2026-08-25)

`ColorOption { id, name unique, hex }` + nullable `Variant.colorId`. The
legacy free-text `color` string column REMAINS during transition; both stay
populated where a mapping exists. Enforcement (requiring colorId) defers until
admin color management exists. Backfill source of truth for name→hex:
`apps/frontend/app/features/storefront/swatch-colors.ts`; unmapped legacy
names get option rows with a neutral hex and are flagged at backfill time.

Public variant DTOs gain `colorHex: string | null`; the frontend keeps its
map only as fallback for null hex until admin data is trustworthy.

Rejected: full EAV/attribute-value modeling — overkill today, blocks nothing
later (colorId FK can be superseded without data loss).

### D5 — Variant ordering (2026-08-25)

Additive `Variant.sortOrder Int @default(0)`; public detail orders by
`sortOrder asc, createdAt asc` (createdAt remains the tiebreaker, matching
the existing stable-order rule). No backfill: existing rows keep relative
order via createdAt tiebreak.

## Deferred / Open Items

| Item | Why deferred |
|---|---|
| Image ownership CHECK constraint (exactly-one-owner) | Prisma can't express it; needs raw migration; upload flow currently controls writes. Hygiene batch later. |
| Primary-image flag vs sortOrder-0 convention | Current derivation works; revisit when admin gallery UI lands. |
| Size normalization | Single-store, few sizes; string acceptable until filtering by size exists. |
| Slug-redirect table for renamed entities | SEO concern post-launch. |
| Category nesting | No nav requirement yet. |
| Admin UI for status/color management | Endpoints land here; screens belong to a catalog-admin feature. |

## Cross-feature Coordination

`storefront-browse-cart/AGENTS.md` says "no backend changes" — that constraint
bound THAT feature during its build. This feature supersedes it narrowly:
backend catalog read/schema changes are authorized here, and Slice 4 touches
one storefront file (`collections/[slug]/page.tsx`). Nothing in
storefront-browse-cart's task/design docs is edited retroactively.

## Resolutions during build (2026-08-25)

*(none yet — appended as slices land)*
