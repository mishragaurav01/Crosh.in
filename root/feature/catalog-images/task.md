# Tasks — Catalog Images

Slices follow `plan.md`. Each slice is independently verifiable; tick only
after its verification actually ran.

## Slice 1 — Provider setup + config wiring

* [x] User: Supabase project (free, no card), public storage bucket, S3 access credentials (guided checklist). Launch: swap env values to Cloudflare R2.
* [x] Centralized validated media config module; `.env.example` entries
* [x] S3-compatible client factory behind service boundary; typecheck green

## Slice 2 — Schema

* [x] `Image` model with owner FKs, unique `key`, `alt`, `sortOrder`, `mimeType`
* [x] Migration applied via `packages/db` workflow; `prisma generate`

## Slice 3 — Media service + admin routes

* [x] `upload-url`: validate mime/size → safe key → presigned PUT
* [x] `confirm`: HEAD-verify object, enforce per-owner limits, create row
* [x] `PATCH /:id`: alt/sortOrder only — key and owner immutable
* [x] `DELETE /:id`: row + R2 object removed
* [x] `GET /:ownerType/:ownerId`: closed enum, ordered listing
* [x] Routes mounted at `/api/admin/images` behind session+admin middleware
* [x] Tests for all five endpoints incl. auth rejection, 422s, limit conflicts

## Slice 4 — Cascade cleanup

* [x] Product/variant/collection/category deletes remove Image rows + objects
* [x] Deletion succeeds regardless of attached images; tests updated

## Slice 5 — Public reads integration

* [x] Product list/detail `images` filled (`{url, alt}`, sortOrder order)
* [x] Collection detail `banner`; category DTO shape reserves banner
* [x] `catalog/AGENT.md` contract updated; public-read tests extended

## Slice 6 — Frontend uploader kit

* [x] `ImageUploader`: drag-drop, queue, progress, compression, previews, retry
* [x] `MediaGallery`: reorder, inline alt edit, delete-with-confirm

## Slice 7 — Admin wiring

* [x] Product gallery · Variant (≤3) · Collection banner · Category banner
* [x] Banner slots enforce single-image replace semantics

## Slice 8 — Verification

* [x] `bun test` full suite — report counts
* [x] `bunx tsc --noEmit -p tsconfig.json`
* [x] Full diff reviewed for unrelated changes

## Done When

* [x] All four owners support upload / reorder / alt / delete from admin UI
* [x] Every image endpoint rejects unauthenticated and non-admin requests
* [x] Entity deletion cascades image cleanup; no orphaned R2 objects
* [x] Public payloads expose derived URLs only; no storage internals leak
* [x] Full suite green, typecheck clean
