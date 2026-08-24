"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import {
  createImageUploadUrl,
  confirmImage,
  putFileToPresignedUrl,
} from "../api";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  compressImage,
  formatBytes,
  isAcceptedImageType,
} from "../images";
import type { ApiError } from "../types";
import type { CatalogImage, ImageOwnerType } from "../types";

type QueueStatus =
  | "queued"
  | "compressing"
  | "signing"
  | "uploading"
  | "finishing"
  | "done"
  | "error";

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string | null;
  status: QueueStatus;
  progress: number;
  error: ApiError | null;
}

const STATUS_LABELS: Record<QueueStatus, string> = {
  queued: "Queued",
  compressing: "Compressing...",
  signing: "Preparing...",
  uploading: "Uploading...",
  finishing: "Finishing...",
  done: "Uploaded",
  error: "Failed",
};

const IN_FLIGHT_STATUSES: QueueStatus[] = [
  "compressing",
  "signing",
  "uploading",
  "finishing",
];

interface ImageUploaderProps {
  ownerType: ImageOwnerType;
  ownerId: string;
  maxImages: number;
  /** Images already attached to the owner (from the gallery). */
  currentCount: number;
  /** Called after an image is fully uploaded and confirmed by the backend. */
  onUploaded?: (image: CatalogImage) => void;
}

export default function ImageUploader({
  ownerType,
  ownerId,
  maxImages,
  currentCount,
  onUploaded,
}: ImageUploaderProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const previews = queueRef.current;
    return () => {
      mountedRef.current = false;
      for (const item of previews) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const remainingSlots =
    maxImages -
    currentCount -
    items.filter((item) => item.status === "done").length;
  const atCapacity = remainingSlots <= 0;

  const updateItem = useCallback(
    (id: string, changes: Partial<QueueItem>) => {
      const mutate = (list: QueueItem[]) =>
        list.map((item) => (item.id === id ? { ...item, ...changes } : item));
      queueRef.current = mutate(queueRef.current);
      if (mountedRef.current) setItems(mutate);
    },
    [],
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      for (;;) {
        const next = queueRef.current.find((item) => item.status === "queued");
        if (!next) break;

        updateItem(next.id, { status: "compressing", error: null });
        let fileToUpload: File;
        try {
          fileToUpload = await compressImage(next.file);
        } catch {
          fileToUpload = next.file;
        }

        if (!isAcceptedImageType(fileToUpload.type)) {
          updateItem(next.id, {
            status: "error",
            error: {
              code: "INVALID_TYPE",
              message:
                "Unsupported format after compression. Use JPEG, PNG, or WebP.",
            },
          });
          continue;
        }
        if (fileToUpload.size > MAX_IMAGE_BYTES) {
          updateItem(next.id, {
            status: "error",
            error: {
              code: "TOO_LARGE",
              message: `Compressed image is still ${formatBytes(fileToUpload.size)} — over the ${formatBytes(MAX_IMAGE_BYTES)} limit.`,
            },
          });
          continue;
        }

        updateItem(next.id, { status: "signing" });
        let uploadUrl: string;
        let key: string;
        try {
          const result = await createImageUploadUrl({
            filename: fileToUpload.name || next.file.name,
            contentType: fileToUpload.type,
            size: fileToUpload.size,
            owner: { type: ownerType, id: ownerId },
          });
          uploadUrl = result.uploadUrl;
          key = result.key;
        } catch (err: unknown) {
          updateItem(next.id, { status: "error", error: err as ApiError });
          continue;
        }

        updateItem(next.id, { status: "uploading", progress: 0 });
        try {
          await putFileToPresignedUrl(
            uploadUrl,
            fileToUpload.type,
            fileToUpload,
            (percent) => updateItem(next.id, { progress: percent }),
          );
        } catch (err: unknown) {
          updateItem(next.id, { status: "error", error: err as ApiError });
          continue;
        }

        updateItem(next.id, { status: "finishing" });
        try {
          const image = await confirmImage({
            key,
            owner: { type: ownerType, id: ownerId },
          });
          if (mountedRef.current) {
            onUploaded?.(image);
          }
          updateItem(next.id, { status: "done", progress: 100 });
        } catch (err: unknown) {
          updateItem(next.id, { status: "error", error: err as ApiError });
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [ownerId, ownerType, onUploaded, updateItem]);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const accepted: QueueItem[] = [];
      const rejected: QueueItem[] = [];
      for (const file of Array.from(fileList)) {
        if (!isAcceptedImageType(file.type)) {
          rejected.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            previewUrl: null,
            status: "error",
            progress: 0,
            error: {
              code: "INVALID_TYPE",
              message: "Unsupported format. Use JPEG, PNG, or WebP.",
            },
          });
          continue;
        }
        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          status: "queued",
          progress: 0,
          error: null,
        });
      }

      const slotsLeft = Math.max(
        0,
        maxImages -
          currentCount -
          queueRef.current.filter((i) => i.status === "done").length,
      );
      const fitting = accepted.slice(0, slotsLeft);
      const overflowItems = accepted.slice(slotsLeft).map((item) => ({
        ...item,
        status: "error" as QueueStatus,
        error: {
          code: "LIMIT_REACHED",
          message: `This ${ownerType} allows at most ${maxImages} image${maxImages === 1 ? "" : "s"}.`,
        },
      }));

      if (fitting.length === 0 && overflowItems.length === 0 && rejected.length === 0) {
        return;
      }

      const nextItems = [
        ...queueRef.current,
        ...fitting,
        ...overflowItems,
        ...rejected,
      ];
      queueRef.current = nextItems;
      setItems(nextItems);

      if (fitting.length > 0) {
        void processQueue();
      }
    },
    [currentCount, maxImages, ownerType, processQueue],
  );

  function removeItem(id: string) {
    const item = queueRef.current.find((entry) => entry.id === id);
    if (!item || IN_FLIGHT_STATUSES.includes(item.status)) return;
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    const nextItems = queueRef.current.filter((entry) => entry.id !== id);
    queueRef.current = nextItems;
    setItems(nextItems);
  }

  function retryItem(id: string) {
    updateItem(id, { status: "queued", progress: 0, error: null });
    void processQueue();
  }

  function clearDone() {
    const doneIds = new Set(
      queueRef.current.filter((item) => item.status === "done").map((i) => i.id),
    );
    for (const item of queueRef.current) {
      if (doneIds.has(item.id) && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    }
    const nextItems = queueRef.current.filter((item) => !doneIds.has(item.id));
    queueRef.current = nextItems;
    setItems(nextItems);
  }

  return (
    <div className="space-y-sm">
      <div
        role="button"
        tabIndex={atCapacity ? -1 : 0}
        aria-disabled={atCapacity}
        aria-label={`Upload images for this ${ownerType}`}
        onClick={() => {
          if (!atCapacity) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !atCapacity) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!atCapacity) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!atCapacity) addFiles(event.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-xs rounded-xl border-2 border-dashed px-lg py-xl text-center transition-colors duration-200 ${
          atCapacity
            ? "border-outline-variant/40 opacity-60 cursor-not-allowed"
            : dragOver
              ? "border-primary bg-primary-container/40 cursor-pointer"
              : "border-outline-variant/60 bg-surface-container-low hover:border-primary/50 cursor-pointer"
        }`}
      >
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
          cloud_upload
        </span>
        <p className="text-body-md text-on-surface">
          {atCapacity
            ? `Image limit reached (${maxImages}/${maxImages})`
            : "Drag & drop images here, or click to browse"}
        </p>
        <p className="text-label-md text-on-surface-variant">
          JPEG, PNG, or WebP · up to {formatBytes(MAX_IMAGE_BYTES)} each ·{" "}
          {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left · images are
          resized to ~1600px automatically
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_EXTENSIONS}
          multiple={maxImages > 1}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="space-y-xs" aria-label="Upload queue">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-sm rounded-xl border border-outline-variant/50 bg-surface-container-low p-sm"
            >
              {item.previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                    image
                  </span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-label-md text-on-surface">
                  {item.file.name}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {formatBytes(item.file.size)} · {STATUS_LABELS[item.status]}
                  {item.status === "uploading" && ` ${item.progress}%`}
                </p>
                {(item.status === "uploading" ||
                  item.status === "compressing") && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{
                        width: `${item.status === "uploading" ? item.progress : 15}%`,
                      }}
                    />
                  </div>
                )}
                {item.error && (
                  <p className="mt-1 text-label-sm text-error">
                    {item.error.message ||
                      "The upload failed. Please try again."}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-xs">
                {item.status === "error" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => retryItem(item.id)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      refresh
                    </span>
                    Retry
                  </Button>
                )}
                {item.status === "done" && (
                  <span className="material-symbols-outlined self-center text-[20px] text-secondary">
                    check_circle
                  </span>
                )}
                {!IN_FLIGHT_STATUSES.includes(item.status) &&
                  item.status !== "done" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${item.file.name} from queue`}
                      onClick={() => removeItem(item.id)}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close
                      </span>
                    </Button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.some((item) => item.status === "done") && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={clearDone}>
            Clear uploaded
          </Button>
        </div>
      )}
    </div>
  );
}
