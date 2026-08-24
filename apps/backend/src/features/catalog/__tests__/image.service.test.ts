import { describe, it, expect, mock } from "bun:test";
import {
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { CatalogError } from "../types/catalog-errors.js";

process.env.S3_ENDPOINT = "https://test-ref.supabase.co/storage/v1/s3";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY_ID = "test-access-key-id";
process.env.S3_SECRET_ACCESS_KEY = "test-secret-access-key";
process.env.S3_BUCKET = "croshfinal-dev";
process.env.S3_PUBLIC_BASE_URL =
  "https://test-ref.supabase.co/storage/v1/object/public/croshfinal-dev";

type HeadResult = Record<string, unknown> | Error;

let headResult: HeadResult = { ContentLength: 1000, ContentType: "image/webp" };

const sentCommands: unknown[] = [];
const sendMock = mock((command: unknown) => {
  sentCommands.push(command);
  if (headResult instanceof Error) {
    return Promise.reject(headResult);
  }
  return Promise.resolve(headResult);
});

const fakeClient = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});
(fakeClient as unknown as { send: unknown }).send = sendMock;

mock.module("../services/s3-client.js", () => ({
  getS3Client: () => fakeClient,
}));

const {
  generateImageKey,
  createUploadUrl,
  confirmUpload,
  updateImage,
  deleteImage,
  listImagesByOwner,
} = await import("../services/image.service.js");

const now = new Date();

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  const createdRows: Array<Record<string, unknown>> = [];
  const prisma = {
    image: {
      count: mock(() => Promise.resolve(0)),
      create: mock((args: { data: Record<string, unknown> }) => {
        createdRows.push(args.data);
        return Promise.resolve({
          id: "img-1",
          key: args.data.key,
          alt: args.data.alt ?? null,
          sortOrder: args.data.sortOrder ?? 0,
          mimeType: args.data.mimeType,
          createdAt: now,
          updatedAt: now,
        });
      }),
      findUnique: mock((args: { where: { id: string } }) =>
        Promise.resolve(
          args.where.id === "img-1"
            ? { id: "img-1", key: "images/product/prod-1/abc.webp", alt: null, sortOrder: 0, mimeType: "image/webp", createdAt: now, updatedAt: now }
            : null,
        ),
      ),
      findMany: mock(() =>
        Promise.resolve([
          { id: "img-2", key: "images/product/prod-1/b.jpg", alt: "b", sortOrder: 1, mimeType: "image/jpeg", createdAt: now, updatedAt: now },
          { id: "img-1", key: "images/product/prod-1/a.webp", alt: null, sortOrder: 0, mimeType: "image/webp", createdAt: now, updatedAt: now },
        ]),
      ),
      update: mock((args: { where: { id: string } }) =>
        Promise.resolve({ id: args.where.id, key: "images/product/prod-1/abc.webp", alt: "new alt", sortOrder: 3, mimeType: "image/webp", createdAt: now, updatedAt: now }),
      ),
      delete: mock(() => Promise.resolve({})),
    },
    product: { findUnique: mock(() => Promise.resolve({ id: "prod-1" })) },
    variant: { findUnique: mock(() => Promise.resolve({ id: "var-1" })) },
    collection: { findUnique: mock(() => Promise.resolve({ id: "col-1" })) },
    category: { findUnique: mock(() => Promise.resolve({ id: "cat-1" })) },
  };

  for (const [key, value] of Object.entries(overrides)) {
    Object.assign((prisma as Record<string, unknown>)[key] as object, value as object);
  }

  return { prisma, createdRows };
}

function resetHead(result: HeadResult): void {
  headResult = result;
  sentCommands.length = 0;
}

describe("generateImageKey", () => {
  it("builds an owner-scoped key with a random component", () => {
    const key = generateImageKey("product", "prod-1", "image/jpeg");

    expect(key).toMatch(/^images\/product\/prod-1\/[0-9a-f]{32}\.jpg$/);
  });

  it("never uses the client filename", () => {
    const key = generateImageKey("variant", "var-1", "image/png");

    expect(key).toContain(".png");
    expect(key).toMatch(/^images\/variant\/var-1\//);
  });

  it("generates distinct keys across calls", () => {
    const first = generateImageKey("product", "prod-1", "image/webp");
    const second = generateImageKey("product", "prod-1", "image/webp");

    expect(first).not.toBe(second);
  });
});

describe("createUploadUrl", () => {
  it("returns the generated key and a short-expiry presigned PUT url without contacting storage", async () => {
    resetHead({ ContentLength: 0, ContentType: "image/jpeg" });

    const result = await createUploadUrl({
      contentType: "image/jpeg",
      owner: { type: "product", id: "prod-1" },
    });

    expect(result.key).toMatch(/^images\/product\/prod-1\/[0-9a-f]{32}\.jpg$/);
    expect(result.uploadUrl).toContain("https://");
    expect(result.uploadUrl).toContain("X-Amz-Expires=600");
    expect(result.uploadUrl).toContain("images/product/prod-1");
    expect(sentCommands.length).toBe(0);
  });
});

describe("confirmUpload", () => {
  it("creates the image row when the object exists in storage", async () => {
    resetHead({ ContentLength: 1000, ContentType: "image/webp" });
    const { prisma, createdRows } = createMockPrisma();

    const dto = await confirmUpload({
      key: "images/product/prod-1/abc123.webp",
      alt: "Front view",
      owner: { type: "product", id: "prod-1" },
      prisma: prisma as never,
    });

    expect(sentCommands[0]).toBeInstanceOf(HeadObjectCommand);
    expect(createdRows).toEqual([
      {
        key: "images/product/prod-1/abc123.webp",
        alt: "Front view",
        sortOrder: 0,
        mimeType: "image/webp",
        productId: "prod-1",
      },
    ]);
    expect(dto.url).toBe(
      "https://test-ref.supabase.co/storage/v1/object/public/croshfinal-dev/images/product/prod-1/abc123.webp",
    );
    expect(dto.alt).toBe("Front view");
  });

  it("appends new gallery images after existing ones", async () => {
    resetHead({ ContentLength: 1000, ContentType: "image/jpeg" });
    const { prisma, createdRows } = createMockPrisma({
      image: { count: mock(() => Promise.resolve(4)) },
    });

    await confirmUpload({
      key: "images/product/prod-1/def456.jpg",
      owner: { type: "product", id: "prod-1" },
      prisma: prisma as never,
    });

    expect(createdRows[0]?.sortOrder).toBe(4);
    expect(createdRows[0]?.alt).toBeNull();
  });

  it("rejects keys outside the owner prefix without touching storage", async () => {
    resetHead({ ContentLength: 1000, ContentType: "image/jpeg" });
    const { prisma } = createMockPrisma();

    const error = await confirmUpload({
      key: "images/variant/var-1/abc123.jpg",
      owner: { type: "product", id: "prod-1" },
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("INVALID_IMAGE_KEY");
    expect(sentCommands.length).toBe(0);
  });

  it("rejects keys that do not exist in the bucket", async () => {
    resetHead(new Error("NotFound"));
    const { prisma } = createMockPrisma();

    const error = await confirmUpload({
      key: "images/product/prod-1/missing.jpg",
      owner: { type: "product", id: "prod-1" },
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("OBJECT_NOT_FOUND");
    expect((error as CatalogError).statusCode).toBe(400);
  });

  it("rejects objects larger than the size limit", async () => {
    resetHead({ ContentLength: 6 * 1024 * 1024, ContentType: "image/jpeg" });
    const { prisma } = createMockPrisma();

    const error = await confirmUpload({
      key: "images/product/prod-1/huge.jpg",
      owner: { type: "product", id: "prod-1" },
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("IMAGE_TOO_LARGE");
    expect((error as CatalogError).statusCode).toBe(413);
  });

  it("rejects objects whose stored content type is not an image", async () => {
    resetHead({ ContentLength: 1000, ContentType: "application/pdf" });
    const { prisma } = createMockPrisma();

    const error = await confirmUpload({
      key: "images/product/prod-1/file.pdf",
      owner: { type: "product", id: "prod-1" },
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("INVALID_IMAGE_TYPE");
  });

  it("rejects owners that do not exist", async () => {
    resetHead({ ContentLength: 1000, ContentType: "image/jpeg" });
    const { prisma } = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });

    const error = await confirmUpload({
      key: "images/product/ghost/abc.jpg",
      owner: { type: "product", id: "ghost" },
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("INVALID_OWNER");
    expect((error as CatalogError).statusCode).toBe(400);
  });

  it("enforces the six-image product limit", async () => {
    resetHead({ ContentLength: 1000, ContentType: "image/jpeg" });
    const { prisma } = createMockPrisma({
      image: { count: mock(() => Promise.resolve(6)) },
    });

    const error = await confirmUpload({
      key: "images/product/prod-1/seventh.jpg",
      owner: { type: "product", id: "prod-1" },
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("IMAGE_LIMIT_REACHED");
    expect((error as CatalogError).statusCode).toBe(409);
  });

  it("enforces the single-banner collection limit", async () => {
    resetHead({ ContentLength: 1000, ContentType: "image/jpeg" });
    const { prisma } = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve({ id: "col-1" })) },
      image: { count: mock(() => Promise.resolve(1)) },
    });

    const error = await confirmUpload({
      key: "images/collection/col-1/banner.jpg",
      owner: { type: "collection", id: "col-1" },
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("IMAGE_LIMIT_REACHED");
  });
});

describe("updateImage", () => {
  it("updates alt text and sort order", async () => {
    const { prisma } = createMockPrisma();

    const dto = await updateImage({
      id: "img-1",
      alt: "new alt",
      sortOrder: 3,
      prisma: prisma as never,
    });

    expect(dto.sortOrder).toBe(3);
    expect(dto.alt).toBe("new alt");
  });

  it("returns 404 for a missing image", async () => {
    const { prisma } = createMockPrisma();

    const error = await updateImage({
      id: "missing",
      sortOrder: 1,
      prisma: prisma as never,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("IMAGE_NOT_FOUND");
    expect((error as CatalogError).statusCode).toBe(404);
  });
});

describe("deleteImage", () => {
  it("deletes the stored object exactly once and then removes the row", async () => {
    resetHead({ ContentLength: 0, ContentType: "image/webp" });
    const { prisma } = createMockPrisma();

    await deleteImage({ id: "img-1", prisma: prisma as never });

    const deletes = sentCommands.filter(
      (command) => command instanceof DeleteObjectCommand,
    );
    expect(deletes).toHaveLength(1);
    expect((deletes[0] as DeleteObjectCommand).input.Key).toBe(
      "images/product/prod-1/abc.webp",
    );
    expect(prisma.image.delete).toHaveBeenCalledWith({ where: { id: "img-1" } });
  });

  it("does not contact storage when the image does not exist", async () => {
    resetHead({ ContentLength: 0, ContentType: "image/webp" });
    const { prisma } = createMockPrisma();

    const error = await deleteImage({ id: "missing", prisma: prisma as never }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(CatalogError);
    expect((error as CatalogError).code).toBe("IMAGE_NOT_FOUND");
    expect(sentCommands.length).toBe(0);
    expect(prisma.image.delete).not.toHaveBeenCalled();
  });
});

describe("listImagesByOwner", () => {
  it("lists images ordered by sortOrder then creation time and maps public urls", async () => {
    resetHead({ ContentLength: 0, ContentType: "image/webp" });
    const { prisma } = createMockPrisma();

    const dtos = await listImagesByOwner({
      ownerType: "product",
      ownerId: "prod-1",
      prisma: prisma as never,
    });

    expect(prisma.image.findMany).toHaveBeenCalledWith({
      where: { productId: "prod-1" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    expect(dtos.map((dto: { id: string }) => dto.id)).toEqual(["img-2", "img-1"]);
    expect(dtos.every((dto: { url: string }) => dto.url.startsWith("https://"))).toBe(true);
    expect(JSON.stringify(dtos)).not.toContain('"key"');
  });
});
