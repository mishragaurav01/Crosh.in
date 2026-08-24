"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PageLoading } from "@/components/ui/Loading";
import CatalogError from "./CatalogError";
import ImageUploader from "./ImageUploader";
import {
  confirmImage,
  createImageUploadUrl,
  deleteImage,
  listImagesByOwner,
  putFileToPresignedUrl,
  updateImage,
} from "../api";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  compressImage,
  formatBytes,
  isAcceptedImageType,
} from "../images";
import type { ApiError } from "../types";
import type { CatalogImage } from "../types";

interface BannerSlotProps {
  ownerType: "collection" | "category";
  ownerId: string;
}

/**
 * Single-image slot for collection/category banners. When a banner exists it
 * is shown with alt editing plus Replace/Remove; Replace deletes the current
 * banner and uploads the picked file in one flow (the backend allows only one
 * image per owner, so the old object must go before the new one confirms).
 */
export default function BannerSlot({ ownerType, ownerId }: BannerSlotProps) {
  const [banner, setBanner] = useState<CatalogImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [replacing, setReplacing] = useState(false);

  const [editingAlt, setEditingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);

  const mounted = useRef(true);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        const images = await listImagesByOwner(ownerType, ownerId);
        if (!mounted.current) return;
        setError(null);
        setBanner(images[0] ?? null);
      } catch (err: unknown) {
        if (mounted.current) setError(err as ApiError);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted.current = false;
    };
  }, [ownerType, ownerId]);

  async function refetch() {
    try {
      const images = await listImagesByOwner(ownerType, ownerId);
      if (!mounted.current) return;
      setBanner(images[0] ?? null);
    } catch {
      // Surfaced by the caller's error handling.
    }
  }

  async function handleRemoveConfirm() {
    if (!banner || deleting) return;
    setDeleting(true);
    try {
      await deleteImage(banner.id);
      if (!mounted.current) return;
      setConfirmRemove(false);
      setError(null);
      setBanner(null);
    } catch (err: unknown) {
      if (!mounted.current) return;
      setConfirmRemove(false);
      setError(err as ApiError);
    } finally {
      if (mounted.current) setDeleting(false);
    }
  }

  async function handleReplaceFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !banner || replacing) return;
    setError(null);

    if (!isAcceptedImageType(file.type)) {
      setError({
        code: "INVALID_TYPE",
        message: "Unsupported format. Use JPEG, PNG, or WebP.",
      });
      return;
    }

    setReplacing(true);
    try {
      // Compress and re-validate BEFORE freeing the slot so a bad file never
      // costs the existing banner.
      const compressed = await compressImage(file);
      if (!isAcceptedImageType(compressed.type)) {
        throw {
          code: "INVALID_TYPE",
          message:
            "Unsupported format after compression. Use JPEG, PNG, or WebP.",
        } satisfies ApiError;
      }
      if (compressed.size > MAX_IMAGE_BYTES) {
        throw {
          code: "TOO_LARGE",
          message: `Compressed image is still ${formatBytes(compressed.size)} — over the ${formatBytes(MAX_IMAGE_BYTES)} limit.`,
        } satisfies ApiError;
      }

      const previousAlt = banner.alt;
      await deleteImage(banner.id);

      const { key, uploadUrl } = await createImageUploadUrl({
        filename: compressed.name,
        contentType: compressed.type,
        size: compressed.size,
        owner: { type: ownerType, id: ownerId },
      });
      await putFileToPresignedUrl(uploadUrl, compressed.type, compressed);

      // Carry the caption over so replacing a banner keeps its alt text.
      const created = await confirmImage({
        key,
        alt: previousAlt,
        owner: { type: ownerType, id: ownerId },
      });
      if (!mounted.current) return;
      setBanner(created);
    } catch (err: unknown) {
      if (!mounted.current) return;
      setError(err as ApiError);
      // The old banner may already be gone; resync with server truth so the
      // admin is never shown a phantom banner.
      await refetch();
    } finally {
      if (mounted.current) setReplacing(false);
    }
  }

  function startAltEdit() {
    if (!banner) return;
    setEditingAlt(true);
    setAltDraft(banner.alt ?? "");
  }

  function cancelAltEdit() {
    setEditingAlt(false);
    setAltDraft("");
  }

  async function saveAltEdit() {
    if (!banner || savingAlt) return;
    const trimmed = altDraft.trim();
    if (trimmed === (banner.alt ?? "")) {
      cancelAltEdit();
      return;
    }
    setSavingAlt(true);
    try {
      const updated = await updateImage(banner.id, {
        alt: trimmed.length > 0 ? trimmed : null,
      });
      if (!mounted.current) return;
      setBanner(updated);
      cancelAltEdit();
    } catch (err: unknown) {
      if (mounted.current) setError(err as ApiError);
    } finally {
      if (mounted.current) setSavingAlt(false);
    }
  }

  if (loading) {
    return <PageLoading message="Loading banner..." />;
  }

  return (
    <div className="space-y-sm">
      {error && <CatalogError error={error} onDismiss={() => setError(null)} />}

      {!banner ? (
        <ImageUploader
          ownerType={ownerType}
          ownerId={ownerId}
          maxImages={1}
          currentCount={0}
          onUploaded={(image) => setBanner(image)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-low">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.url}
            alt={banner.alt ?? ""}
            className={`aspect-video w-full object-cover ${
              replacing ? "opacity-50" : ""
            }`}
          />

          <div className="space-y-sm p-sm">
            {editingAlt ? (
              <div className="space-y-xs">
                <input
                  autoFocus
                  value={altDraft}
                  maxLength={1000}
                  aria-label="Banner alt text"
                  placeholder="Describe this banner…"
                  onChange={(event) => setAltDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void saveAltEdit();
                    }
                    if (event.key === "Escape") {
                      cancelAltEdit();
                    }
                  }}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg px-sm py-xs text-label-md text-on-surface placeholder:text-outline/50"
                />
                <div className="flex justify-end gap-xs">
                  <Button size="sm" variant="ghost" onClick={cancelAltEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" loading={savingAlt} onClick={() => void saveAltEdit()}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="truncate text-label-sm text-on-surface-variant">
                {banner.alt ?? "No alt text"}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-xs">
              <Button
                size="sm"
                variant="ghost"
                disabled={replacing}
                onClick={startAltEdit}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Alt text
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={replacing}
                disabled={editingAlt}
                onClick={() => replaceInputRef.current?.click()}
              >
                <span className="material-symbols-outlined text-[16px]">
                  cached
                </span>
                Replace
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={replacing || editingAlt}
                onClick={() => setConfirmRemove(true)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        className="hidden"
        onChange={(event) => {
          void handleReplaceFile(event.target.files);
          event.target.value = "";
        }}
      />

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemoveConfirm}
        title="Remove banner"
        message="Remove this banner? It will be deleted from storage and cannot be undone."
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  );
}
