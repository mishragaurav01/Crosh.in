# AGENTS.md — Catalog Images

## Purpose

Image management for catalog entities: product galleries, variant images,
collection banners, and category banners. Files live in S3-compatible object
storage (Supabase Storage in dev; Cloudflare R2 at launch); metadata lives in
Postgres beside the rest of the catalog.

This is an additive capability of the existing `catalog` feature. All backend
code lives in `apps/backend/src/features/catalog/`; all admin UI lives in
`apps/frontend/features/catalog/`. No new feature folder in either app.

**Tier 2 feature slice.** Load alongside this file:

* `apps/backend/constitution/backend-architecture.md`
* `apps/backend/constitution/api-design.md`
* `apps/backend/constitution/security-rules.md` (mandatory — file uploads)
* `packages/db/constitution/db-design.md` (migration work)
* `apps/frontend/AGENTS.md` when working on the admin UI

---

## Locked Decisions

These were decided deliberately before implementation. Do not silently change
them; superseding requires an explicit new decision.

* **Provider:** S3-compatible object storage behind a provider-neutral config
  boundary (`S3_*` env vars). Dev: Supabase Storage — free tier, no card
  required, public buckets included. Launch: Cloudflare R2. The cutover is an
  environment change only (endpoint, keys, bucket, public base URL); no code
  change and no data migration. Custom CDN domain at launch.
* **Upload path:** browser uploads directly to the object store via presigned
  PUT URLs. The backend signs and records metadata; it never proxies file
  bytes.
* **Client-side compression:** the admin uploader compresses images before
  upload (~1600px longest edge, WebP where possible) using
  `browser-image-compression`. Originals above the target are never uploaded.
* **Limits:** product ≤ 6 images · variant ≤ 3 · collection = 1 (banner) ·
  category = 1 (banner). Per file: ≤ 5 MB after client compression, JPEG /
  PNG / WebP only.
* **One generic `Image` table** with nullable owner foreign keys
  (`productId`, `variantId`, `collectionId`, `categoryId`); exactly one must
  be set. One upload pipeline serves all four owners.
* **URLs are derived, not stored:** the DB stores the object `key`; public
  URLs are built at DTO-mapping time from the configured public base. Changing
  CDN domains later is an env change, not a data migration.
* **Cascade cleanup:** deleting a catalog entity deletes its Image rows and
  their stored objects. Deletion is never blocked because of attached images.
* **Videos:** out of scope this phase. The schema (`mimeType`, key-based
  objects) and provider choice are video-ready; no rework expected.

---

## Authorization Contract

Every image endpoint is an administrative operation behind
`requireSession` + `requireAdmin`. There is no unauthenticated image
endpoint, ever. Public reads may only ever receive derived image URLs inside
existing public DTO shapes.

---

## API Surface

All routes live under `/api/admin/images` and return the standard envelope.
Validation failures use 422 `VALIDATION_ERROR`.

* `POST /api/admin/images/upload-url`
  Body `{ filename, contentType, size }` → validates type/size, generates a
  safe server-side key, returns `{ key, uploadUrl }` (presigned PUT, short
  expiry).
* `POST /api/admin/images`
  Body `{ key, alt?, owner: { type, id } }` → HEAD-verifies the object exists
  in R2, enforces per-owner limits, creates the row.
* `PATCH /api/admin/images/:id`
  `{ alt?, sortOrder? }` → metadata updates only. Object keys are immutable.
* `DELETE /api/admin/images/:id`
  Removes the row and the R2 object.
* `GET /api/admin/images/:ownerType/:ownerId`
  Lists images for an owner, ordered by `sortOrder` then creation time.
  `ownerType` is a closed enum; unknown types are 422s.

Existing admin entity endpoints are NOT modified to embed images; the admin
UI fetches them through this surface. Public read shapes change separately
(see below).

### Public reads changes

* Product list/detail: the reserved `images: []` slot is filled with
  `{ url, alt }[]` ordered by `sortOrder`.
* Collection detail gains `banner: { url, alt } | null`.
* Category public payloads gain `banner: { url, alt } | null` when category
  listing/detail is exposed publicly later.

---

## Data Exposure Rules

* Only derived public URLs leave the system. Account IDs, access keys, and
  object-signing material never appear in any response, log, or error.
* Client-supplied filenames are never used as storage paths. Keys are
  generated server-side under owner-scoped prefixes.
* Raw S3 SDK errors are logged server-side and surfaced as generic
  `INTERNAL_ERROR`; validation problems use explicit codes.
* Alt text is optional free text from the admin; it is rendered as-is by
  consumers (storefront must treat it as text, not HTML).

## Implementation Rules

* Follow `Route → Controller → Service → Database/External`. The S3 client is
  constructed once behind a small service boundary (`services/s3-client.ts`,
  consumed by `services/image.service.ts`); controllers never import the SDK.
* Credentials flow through the centralized, validated configuration layer —
  never `process.env` reads inside business logic. Required vars:
  `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`,
  `S3_PUBLIC_BASE_URL`; optional: `S3_REGION` (defaults to `auto`).
* New files: `services/image.service.ts`, `controllers/image.controller.ts`,
  `routes/image.routes.ts` mounted at `/api/admin/images` in `index.ts`.
  Schema work adds `models/image.prisma` conventions consistent with the
  existing schema file.
* Cascade cleanup hooks live inside the existing catalog delete services —
  do not add triggers or DB-level cascades for stored objects.
* Tests follow existing Bun conventions in `__tests__/image.*.test.ts`,
  mocking the S3 boundary; no test talks to real object storage.
* Frontend: reusable `ImageUploader` and `MediaGallery` components in
  `apps/frontend/features/catalog/components/`, wired into Product, Variant,
  Collection, and Category editors.

## Out of Scope

* Video upload/playback (schema-ready only)
* Server-side transforms or multi-size derivatives
* CDN custom-domain cutover (launch-time config, documented in setup slice)
* Rate limiting (repo-wide gap, tracked separately)
* Public (non-admin) uploads of any kind

---

## Verification

Verify at minimum:

* Upload-url issuance rejects wrong mime types and oversize files with 422.
* Confirm endpoint rejects keys that do not exist in the bucket (mocked HEAD)
  and enforces per-owner limits with explicit conflict codes.
* PATCH cannot change an image's owner or key.
* DELETE removes the row and calls object-store delete exactly once.
* Deleting a product/variant/collection/category removes its images and
  objects; deletion succeeds even when images exist.
* All image endpoints reject unauthenticated and non-admin requests.
* Public product payloads show mapped `{url, alt}` arrays; collection payloads
  show `banner`; raw stock and internal storage config still never leak.
* Full suite green, typecheck clean, diff reviewed.
