import imageCompression from "browser-image-compression";
import type { ImageOwnerType } from "./types";

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Longest edge the admin uploader compresses images to before upload. */
const COMPRESSED_MAX_EDGE_PX = 1600;

/**
 * Mirrors the backend's per-owner limits (image.service.ts) for UX only —
 * the backend remains authoritative.
 */
export const IMAGE_OWNER_LIMITS: Record<ImageOwnerType, number> = {
  product: 6,
  variant: 3,
  collection: 1,
  category: 1,
};

export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Client-side compression per the locked decision: ~1600px longest edge,
 * WebP output where the browser can encode it; otherwise keeps the source
 * format. Falls back to the original file if compression itself fails.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: MAX_IMAGE_BYTES / (1024 * 1024),
      maxWidthOrHeight: COMPRESSED_MAX_EDGE_PX,
      useWebWorker: true,
      fileType: "image/webp",
    });
  } catch {
    // Some browsers cannot encode WebP from a canvas — retry keeping the
    // original format before giving up entirely.
    try {
      return await imageCompression(file, {
        maxSizeMB: MAX_IMAGE_BYTES / (1024 * 1024),
        maxWidthOrHeight: COMPRESSED_MAX_EDGE_PX,
        useWebWorker: true,
      });
    } catch {
      return file;
    }
  }
}
