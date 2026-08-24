# Implementation Plan — Catalog Images

## Objective

Admin-managed images for products, variants, collections, and categories,
stored in S3-compatible object storage (Supabase Storage in dev; Cloudflare R2 at
launch) with direct browser uploads, surfaced through public read DTOs — with
admin ease-of-use as the primary design driver.

All contract decisions are locked in `AGENTS.md` (Locked Decisions section).
This plan only sequences the work.

---

## Slice 1 — Provider setup + config wiring

Manual (user, interactive): create a Supabase project (free tier, no card
required), create a public storage bucket, mint S3 access credentials, note
the endpoint/region/public base URL. At launch, cut over to Cloudflare R2 by
changing env values only.

Code (agent): centralized validated media config module consuming
`S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_BUCKET` /
`S3_PUBLIC_BASE_URL` (+ optional `S3_REGION`); S3-compatible client factory
behind the service boundary; `.env.example` entries. No behavior visible yet;
typecheck green.

## Slice 2 — Schema

Add `Image` model: cuid id, `key` (unique), `alt?`, `sortOrder`, `mimeType`,
nullable `productId` / `variantId` / `collectionId` / `categoryId`, timestamps.
Indexes on each owner FK. Migration named descriptively; `prisma generate`.

## Slice 3 — Media service + admin routes

`services/image.service.ts`: key generation (owner-scoped prefix + random),
presign upload URL, confirm (HEAD-verify object, enforce per-owner limits,
insert row), patch metadata, delete (row + object), list-by-owner.
`controllers/image.controller.ts` mirrors admin controller style:
safeParse → 422 envelope, CatalogError mapping, 500 fallback.
`routes/image.routes.ts` mounts all five endpoints behind
`requireSession` + `requireAdmin`; mount in `index.ts`.
Tests mock the R2 boundary entirely.

## Slice 4 — Cascade cleanup

Existing delete services (product, variant, collection, category) also delete
owned Image rows and their R2 objects before/after removing the owner row.
Deletion never blocks on images. Update affected tests.

## Slice 5 — Public reads integration

Public product list/detail fill the reserved `images` slot from Image rows;
collection detail gains `banner`. Category public exposure stays as-is except
the banner slot is defined in the DTO shape for future use. Feature docs
(`catalog/AGENT.md`) updated; public-read tests extended to assert image/banner
mapping and that no storage internals leak.

## Slice 6 — Frontend uploader kit

`ImageUploader`: drag-drop + file picker, multi-file queue with per-file
progress, client-side compression (~1600px, WebP), mime/size pre-validation,
instant local previews, retry on failure.
`MediaGallery`: thumbnail grid, drag-to-reorder (persists sortOrder), inline
alt editing, delete-with-confirm.
Both consume only the five admin endpoints.

## Slice 7 — Admin form wiring

Embed uploader/gallery into Product editor (gallery), Variant manager
(≤3), Collection editor (single banner), Category editor (single banner).
Banner slots enforce replace-only-one semantics in UI.

## Slice 8 — Verification

* `bun test` full backend suite — report counts
* `bunx tsc --noEmit -p tsconfig.json`
* Frontend typecheck/build if configured
* Full diff review for unrelated changes
* Tick task.md honestly

---

## Completion Criteria

* Admin can upload, reorder, caption, and remove images for all four owners
  without leaving the forms they already know.
* No unauthenticated path can upload, modify, or read image metadata.
* Deleting entities never orphans R2 objects.
* Public product/collection payloads carry derived URLs only.
* Suite green, types clean.
