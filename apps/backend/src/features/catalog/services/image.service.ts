import type { PrismaClient } from "db/client";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";
import { getS3Client } from "./s3-client.js";
import { getMediaConfig } from "../../../config/media.config.js";
import { CatalogError } from "../types/catalog-errors.js";
import {
  MAX_IMAGE_BYTES,
  type ImageMimeType,
  type ImageOwnerRef,
} from "../schemas/image.schema.js";

const UPLOAD_URL_EXPIRY_SECONDS = 600;

const OWNER_LIMITS: Record<ImageOwnerRef["type"], number> = {
  product: 6,
  variant: 3,
  collection: 1,
  category: 1,
};

const EXTENSION_BY_MIME: Record<ImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface ImageDto {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImageRow {
  id: string;
  key: string;
  alt: string | null;
  sortOrder: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}

type OwnerFilter =
  | { productId: string }
  | { variantId: string }
  | { collectionId: string }
  | { categoryId: string };

export function generateImageKey(
  ownerType: ImageOwnerRef["type"],
  ownerId: string,
  contentType: ImageMimeType,
): string {
  const extension = EXTENSION_BY_MIME[contentType];
  const random = randomBytes(16).toString("hex");
  return `images/${ownerType}/${ownerId}/${random}.${extension}`;
}

export async function createUploadUrl(params: {
  contentType: ImageMimeType;
  owner: ImageOwnerRef;
}): Promise<{ key: string; uploadUrl: string }> {
  const { contentType, owner } = params;
  const key = generateImageKey(owner.type, owner.id, contentType);
  const command = new PutObjectCommand({
    Bucket: getMediaConfig().S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });
  return { key, uploadUrl };
}

export async function confirmUpload(params: {
  key: string;
  alt?: string | null;
  owner: ImageOwnerRef;
  prisma: PrismaClient;
}): Promise<ImageDto> {
  const { key, alt, owner, prisma } = params;

  if (!key.startsWith(ownerPrefix(owner)) || key.includes("..")) {
    throw new CatalogError(
      "INVALID_IMAGE_KEY",
      "Object key does not match the requested owner",
      400,
    );
  }

  let contentType: unknown;
  let contentLength: number;
  try {
    const head = await getS3Client().send(
      new HeadObjectCommand({ Bucket: getMediaConfig().S3_BUCKET, Key: key }),
    );
    contentType = head.ContentType;
    contentLength = head.ContentLength ?? 0;
  } catch (error) {
    console.error("[confirmUpload] object lookup failed", error);
    throw new CatalogError(
      "OBJECT_NOT_FOUND",
      "Uploaded file was not found in storage. Upload the file again.",
      400,
    );
  }

  if (contentLength > MAX_IMAGE_BYTES) {
    throw new CatalogError("IMAGE_TOO_LARGE", "Image must be 5 MB or smaller", 413);
  }

  const mimeType = resolveStoredMimeType(key, contentType);

  await assertOwnerExists(prisma, owner);

  const existingCount = await prisma.image.count({ where: ownerFilter(owner) });
  const limit = OWNER_LIMITS[owner.type];
  if (existingCount >= limit) {
    throw new CatalogError(
      "IMAGE_LIMIT_REACHED",
      `This ${owner.type} already has the maximum of ${limit} image${limit === 1 ? "" : "s"}`,
      409,
    );
  }

  const image = await prisma.image.create({
    data: {
      key,
      alt: alt ?? null,
      sortOrder: existingCount,
      mimeType,
      ...ownerFilter(owner),
    },
  });

  return toImageDto(image);
}

export async function updateImage(params: {
  id: string;
  alt?: string | null;
  sortOrder?: number;
  prisma: PrismaClient;
}): Promise<ImageDto> {
  const { id, alt, sortOrder, prisma } = params;

  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) {
    throw new CatalogError("IMAGE_NOT_FOUND", "Image not found", 404);
  }

  const image = await prisma.image.update({
    where: { id },
    data: {
      ...(alt !== undefined && { alt }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return toImageDto(image);
}

export async function deleteImage(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { id, prisma } = params;

  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) {
    throw new CatalogError("IMAGE_NOT_FOUND", "Image not found", 404);
  }

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getMediaConfig().S3_BUCKET,
      Key: existing.key,
    }),
  );

  await prisma.image.delete({ where: { id } });
}

export async function deleteImagesForOwner(params: {
  ownerType: ImageOwnerRef["type"];
  ownerId: string;
  prisma: PrismaClient;
}): Promise<number> {
  const { ownerType, ownerId, prisma } = params;
  const filter = ownerFilter({ type: ownerType, id: ownerId });

  const images = await prisma.image.findMany({
    where: filter,
    select: { id: true, key: true },
  });

  if (images.length === 0) {
    return 0;
  }

  for (const image of images) {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getMediaConfig().S3_BUCKET,
        Key: image.key,
      }),
    );
  }

  await prisma.image.deleteMany({ where: filter });

  return images.length;
}

export async function listImagesByOwner(params: {
  ownerType: ImageOwnerRef["type"];
  ownerId: string;
  prisma: PrismaClient;
}): Promise<ImageDto[]> {
  const { ownerType, ownerId, prisma } = params;

  const images = await prisma.image.findMany({
    where: ownerFilter({ type: ownerType, id: ownerId }),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return images.map(toImageDto);
}

function ownerPrefix(owner: ImageOwnerRef): string {
  return `images/${owner.type}/${owner.id}/`;
}

function ownerFilter(owner: ImageOwnerRef): OwnerFilter {
  switch (owner.type) {
    case "product":
      return { productId: owner.id };
    case "variant":
      return { variantId: owner.id };
    case "collection":
      return { collectionId: owner.id };
    case "category":
      return { categoryId: owner.id };
  }
}

async function assertOwnerExists(
  prisma: PrismaClient,
  owner: ImageOwnerRef,
): Promise<void> {
  let exists: boolean;
  switch (owner.type) {
    case "product":
      exists =
        (await prisma.product.findUnique({ where: { id: owner.id } })) !== null;
      break;
    case "variant":
      exists =
        (await prisma.variant.findUnique({ where: { id: owner.id } })) !== null;
      break;
    case "collection":
      exists =
        (await prisma.collection.findUnique({ where: { id: owner.id } })) !==
        null;
      break;
    case "category":
      exists =
        (await prisma.category.findUnique({ where: { id: owner.id } })) !==
        null;
      break;
  }

  if (!exists) {
    throw new CatalogError(
      "INVALID_OWNER",
      `The referenced ${owner.type} does not exist`,
      400,
    );
  }
}

function resolveStoredMimeType(key: string, storedContentType: unknown): string {
  if (
    typeof storedContentType === "string" &&
    storedContentType in EXTENSION_BY_MIME
  ) {
    return storedContentType;
  }

  const extension = key.split(".").pop()?.toLowerCase();
  for (const [mime, ext] of Object.entries(EXTENSION_BY_MIME)) {
    if (extension === ext) {
      return mime;
    }
  }

  throw new CatalogError(
    "INVALID_IMAGE_TYPE",
    "Only JPEG, PNG, and WebP images are supported",
    400,
  );
}

export function buildPublicUrl(key: string): string {
  const base = getMediaConfig().S3_PUBLIC_BASE_URL.replace(/\/+$/, "");
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function toImageDto(image: ImageRow): ImageDto {
  return {
    id: image.id,
    url: buildPublicUrl(image.key),
    alt: image.alt,
    sortOrder: image.sortOrder,
    mimeType: image.mimeType,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  };
}
