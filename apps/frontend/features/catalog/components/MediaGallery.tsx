"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PageLoading } from "@/components/ui/Loading";
import EmptyState from "@/components/ui/EmptyState";
import CatalogError from "./CatalogError";
import { deleteImage, listImagesByOwner, updateImage } from "../api";
import type { ApiError } from "../types";
import type { CatalogImage, ImageOwnerType } from "../types";

interface MediaGalleryProps {
  ownerType: ImageOwnerType;
  ownerId: string;
  /** Notifies the parent after any add/remove/reorder/alt change. */
  onChange?: (images: CatalogImage[]) => void;
  /**
   * Bump to make the gallery refetch (e.g. after a sibling uploader
   * confirms an image the gallery cannot see).
   */
  refreshKey?: number;
}

export default function MediaGallery({
  ownerType,
  ownerId,
  onChange,
  refreshKey = 0,
}: MediaGalleryProps) {
  const [images, setImages] = useState<CatalogImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CatalogImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const mounted = useRef(true);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        const data = await listImagesByOwner(ownerType, ownerId);
        if (!mounted.current) return;
        setError(null);
        setImages(data);
        onChangeRef.current?.(data);
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
  }, [ownerType, ownerId, refreshKey]);

  function applyChange(next: CatalogImage[]) {
    setImages(next);
    onChangeRef.current?.(next);
  }

  async function refetch() {
    try {
      const data = await listImagesByOwner(ownerType, ownerId);
      if (!mounted.current) return;
      setError(null);
      applyChange(data);
    } catch (err: unknown) {
      if (mounted.current) setError(err as ApiError);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteImage(deleteTarget.id);
      if (!mounted.current) return;
      setDeleteTarget(null);
      applyChange(images.filter((image) => image.id !== deleteTarget.id));
    } catch (err: unknown) {
      if (!mounted.current) return;
      setDeleteTarget(null);
      setError(err as ApiError);
    } finally {
      if (mounted.current) setDeleting(false);
    }
  }

  function startAltEdit(image: CatalogImage) {
    setEditingAltId(image.id);
    setAltDraft(image.alt ?? "");
  }

  function cancelAltEdit() {
    setEditingAltId(null);
    setAltDraft("");
  }

  async function saveAltEdit(image: CatalogImage) {
    if (savingAlt) return;
    const trimmed = altDraft.trim();
    if (trimmed === (image.alt ?? "")) {
      cancelAltEdit();
      return;
    }
    setSavingAlt(true);
    try {
      const updated = await updateImage(image.id, {
        alt: trimmed.length > 0 ? trimmed : null,
      });
      if (!mounted.current) return;
      applyChange(
        images.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      cancelAltEdit();
    } catch (err: unknown) {
      if (mounted.current) setError(err as ApiError);
    } finally {
      if (mounted.current) setSavingAlt(false);
    }
  }

  async function commitReorder(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Reindex deterministically; only PATCH rows whose sortOrder changed.
    renumber(reordered);
    const changed = reordered.filter(
      (image) =>
        images.find((entry) => entry.id === image.id)?.sortOrder !==
        image.sortOrder,
    );

    setDragIndex(null);
    setOverIndex(null);

    if (changed.length === 0) {
      return;
    }

    setReordering(true);
    applyChange(reordered);
    try {
      for (const image of changed) {
        await updateImage(image.id, { sortOrder: image.sortOrder });
        if (!mounted.current) return;
      }
    } catch (err: unknown) {
      if (!mounted.current) return;
      setError(err as ApiError);
      await refetch();
    } finally {
      if (mounted.current) setReordering(false);
    }
  }

  const canReorder = images.length > 1 && !reordering;

  return (
    <div className="space-y-sm">
      {error && <CatalogError error={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <PageLoading message="Loading images..." />
      ) : images.length === 0 ? (
        <EmptyState
          icon="image"
          title="No images yet"
          description={`Upload images to show alongside this ${ownerType}.`}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-sm sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => {
            const isEditingAlt = editingAltId === image.id;
            return (
              <li
                key={image.id}
                draggable={canReorder}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => {
                  if (dragIndex !== null && canReorder) {
                    event.preventDefault();
                    setOverIndex(index);
                  }
                }}
                onDragLeave={() => setOverIndex(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  void commitReorder(index);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`group relative overflow-hidden rounded-xl border bg-surface-container-low transition-shadow duration-200 ${
                  canReorder ? "cursor-grab active:cursor-grabbing" : ""
                } ${
                  overIndex === index && dragIndex !== null
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-outline-variant/50"
                } ${dragIndex === index ? "opacity-50" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt ?? ""}
                  className="aspect-square w-full object-cover"
                />

                {canReorder && (
                  <span
                    aria-hidden="true"
                    className="absolute left-xs top-xs rounded-full bg-inverse-surface/70 p-1 text-inverse-on-surface opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      drag_indicator
                    </span>
                  </span>
                )}

                <button
                  type="button"
                  aria-label="Delete image"
                  onClick={() => setDeleteTarget(image)}
                  className="absolute right-xs top-xs rounded-full bg-error-container/90 p-1 text-on-error-container opacity-0 transition-opacity duration-200 hover:bg-error hover:text-on-error group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    delete
                  </span>
                </button>

                <div className="space-y-xs p-sm">
                  {isEditingAlt ? (
                    <div className="space-y-xs">
                      <input
                        autoFocus
                        value={altDraft}
                        maxLength={1000}
                        aria-label="Alt text"
                        placeholder="Describe this image…"
                        onChange={(event) => setAltDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void saveAltEdit(image);
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
                        <Button
                          size="sm"
                          loading={savingAlt}
                          onClick={() => void saveAltEdit(image)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="truncate text-label-sm text-on-surface-variant">
                        {image.alt ?? "No alt text"}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startAltEdit(image)}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          edit
                        </span>
                        Alt text
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canReorder && (
        <p className="text-label-sm text-on-surface-variant">
          Drag thumbnails to reorder. Order is saved automatically.
          {reordering ? " Saving new order…" : ""}
        </p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete image"
        message={
          deleteTarget
            ? "Delete this image? It will be removed from storage and cannot be undone."
            : ""
        }
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

function renumber(images: CatalogImage[]): void {
  for (let index = 0; index < images.length; index += 1) {
    images[index] = { ...images[index], sortOrder: index };
  }
}
