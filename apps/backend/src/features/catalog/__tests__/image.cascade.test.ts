import { describe, it, expect, mock } from "bun:test";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

process.env.S3_ENDPOINT = "https://test-ref.supabase.co/storage/v1/s3";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY_ID = "test-access-key-id";
process.env.S3_SECRET_ACCESS_KEY = "test-secret-access-key";
process.env.S3_BUCKET = "croshfinal-dev";
process.env.S3_PUBLIC_BASE_URL =
  "https://test-ref.supabase.co/storage/v1/object/public/croshfinal-dev";

const sentCommands: unknown[] = [];
const sendMock = mock((command: unknown) => {
  sentCommands.push(command);
  return Promise.resolve({});
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

const { deleteProduct } = await import("../services/product.service.js");
const { deleteVariant } = await import("../services/variant.service.js");
const { deleteCollection } = await import("../services/collection.service.js");
const { deleteCategory } = await import("../services/category.service.js");

function createBasePrisma(images: Array<{ key: string }> = []) {
  const deletedImageFilters: Array<Record<string, unknown>> = [];
  const now = new Date();

  const prisma: any = {
    image: {
      findMany: mock(() =>
        Promise.resolve(
          images.map((image, index) => ({
            id: `img-${index + 1}`,
            key: image.key,
          })),
        ),
      ),
      deleteMany: mock((args: { where: Record<string, unknown> }) => {
        deletedImageFilters.push(args.where);
        return Promise.resolve({ count: images.length });
      }),
    },
    product: {
      findUnique: mock(() =>
        Promise.resolve({ id: "prod-1", name: "Tee", slug: "tee", categoryId: "cat-1", description: null, createdAt: now, updatedAt: now }),
      ),
      count: mock(() => Promise.resolve(0)),
      delete: mock(() => Promise.resolve({})),
    },
    variant: {
      findUnique: mock(() =>
        Promise.resolve({ id: "prod-1", name: "Tee", slug: "tee", categoryId: "cat-1", description: null, createdAt: now, updatedAt: now }),
      ),
      findFirst: mock(() =>
        Promise.resolve({ id: "var-1", sku: "TEE-S-BLK", size: "S", color: "Black", price: 2999, stock: 50, productId: "prod-1", createdAt: now, updatedAt: now }),
      ),
      count: mock(() => Promise.resolve(0)),
      delete: mock(() => Promise.resolve({})),
    },
    collection: {
      findUnique: mock(() =>
        Promise.resolve({ id: "col-1", name: "Summer", slug: "summer", description: null, createdAt: now, updatedAt: now }),
      ),
      delete: mock(() => Promise.resolve({})),
    },
    category: {
      findUnique: mock(() =>
        Promise.resolve({ id: "cat-1", name: "Shirts", slug: "shirts", description: null, createdAt: now, updatedAt: now }),
      ),
      delete: mock(() => Promise.resolve({})),
    },
    variantCollection: {
      count: mock(() => Promise.resolve(0)),
      findMany: mock(() => Promise.resolve([])),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
  };

  prisma.$transaction = mock((fn: (tx: unknown) => unknown) => Promise.resolve(fn(prisma)));

  return { prisma, deletedImageFilters };
}

function resetStorage(): void {
  sentCommands.length = 0;
}

function storedDeletedKeys(): string[] {
  return sentCommands
    .filter((command) => command instanceof DeleteObjectCommand)
    .map((command) => (command as DeleteObjectCommand).input.Key as string);
}

describe("product deletion cascades images", () => {
  it("removes every stored object exactly once and clears the owned rows", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([
      { key: "images/product/prod-1/a.webp" },
      { key: "images/product/prod-1/b.jpg" },
    ]);

    await deleteProduct({ id: "prod-1", prisma });

    expect(storedDeletedKeys()).toEqual([
      "images/product/prod-1/a.webp",
      "images/product/prod-1/b.jpg",
    ]);
    expect(deletedImageFilters).toEqual([{ productId: "prod-1" }]);
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: "prod-1" } });
  });

  it("deletes successfully even when images are attached", async () => {
    resetStorage();
    const { prisma } = createBasePrisma([
      { key: "images/product/prod-1/full.webp" },
    ]);

    await expect(deleteProduct({ id: "prod-1", prisma })).resolves.toBeUndefined();
    expect(prisma.product.delete).toHaveBeenCalledTimes(1);
  });

  it("never contacts storage or touches image rows when no images exist", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([]);

    await deleteProduct({ id: "prod-1", prisma });

    expect(sentCommands.length).toBe(0);
    expect(deletedImageFilters).toEqual([]);
    expect(prisma.product.delete).toHaveBeenCalledTimes(1);
  });

  it("does not clean up images when the delete is rejected by variants", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([
      { key: "images/product/prod-1/a.webp" },
    ]);
    prisma.variant.count = mock(() => Promise.resolve(2));

    await expect(deleteProduct({ id: "prod-1", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_HAS_VARIANTS", statusCode: 409 }),
    );

    expect(sentCommands.length).toBe(0);
    expect(deletedImageFilters).toEqual([]);
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });
});

describe("variant deletion cascades images", () => {
  it("removes every stored object exactly once and clears the owned rows", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([
      { key: "images/variant/var-1/a.webp" },
      { key: "images/variant/var-1/b.png" },
      { key: "images/variant/var-1/c.jpg" },
    ]);

    await deleteVariant({ productId: "prod-1", variantId: "var-1", prisma });

    expect(storedDeletedKeys()).toEqual([
      "images/variant/var-1/a.webp",
      "images/variant/var-1/b.png",
      "images/variant/var-1/c.jpg",
    ]);
    expect(deletedImageFilters).toEqual([{ variantId: "var-1" }]);
    expect(prisma.variant.delete).toHaveBeenCalledWith({ where: { id: "var-1" } });
  });

  it("deletes successfully even when images are attached", async () => {
    resetStorage();
    const { prisma } = createBasePrisma([
      { key: "images/variant/var-1/a.webp" },
    ]);

    await expect(
      deleteVariant({ productId: "prod-1", variantId: "var-1", prisma }),
    ).resolves.toBeUndefined();
    expect(prisma.variant.delete).toHaveBeenCalledTimes(1);
  });

  it("never contacts storage when no images exist", async () => {
    resetStorage();
    const { prisma } = createBasePrisma([]);

    await deleteVariant({ productId: "prod-1", variantId: "var-1", prisma });

    expect(sentCommands.length).toBe(0);
    expect(prisma.variant.delete).toHaveBeenCalledTimes(1);
  });
});

describe("collection deletion cascades images", () => {
  it("removes the banner object and owned rows outside the membership transaction", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([
      { key: "images/collection/col-1/banner.webp" },
    ]);

    await deleteCollection({ id: "col-1", prisma });

    expect(storedDeletedKeys()).toEqual(["images/collection/col-1/banner.webp"]);
    expect(deletedImageFilters).toEqual([{ collectionId: "col-1" }]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.variantCollection.deleteMany).toHaveBeenCalledWith({
      where: { collectionId: "col-1" },
    });
    expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
  });

  it("deletes successfully even when a banner is attached", async () => {
    resetStorage();
    const { prisma } = createBasePrisma([
      { key: "images/collection/col-1/banner.webp" },
    ]);

    await expect(deleteCollection({ id: "col-1", prisma })).resolves.toBeUndefined();
    expect(prisma.collection.delete).toHaveBeenCalledTimes(1);
  });

  it("never contacts storage when no banner exists", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([]);

    await deleteCollection({ id: "col-1", prisma });

    expect(sentCommands.length).toBe(0);
    expect(deletedImageFilters).toEqual([]);
    expect(prisma.collection.delete).toHaveBeenCalledTimes(1);
  });
});

describe("category deletion cascades images", () => {
  it("removes the banner object and owned rows", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([
      { key: "images/category/cat-1/banner.jpg" },
    ]);

    await deleteCategory({ id: "cat-1", prisma });

    expect(storedDeletedKeys()).toEqual(["images/category/cat-1/banner.jpg"]);
    expect(deletedImageFilters).toEqual([{ categoryId: "cat-1" }]);
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
  });

  it("deletes successfully even when a banner is attached", async () => {
    resetStorage();
    const { prisma } = createBasePrisma([
      { key: "images/category/cat-1/banner.jpg" },
    ]);

    await expect(deleteCategory({ id: "cat-1", prisma })).resolves.toBeUndefined();
    expect(prisma.category.delete).toHaveBeenCalledTimes(1);
  });

  it("does not clean up images when the delete is rejected by products", async () => {
    resetStorage();
    const { prisma, deletedImageFilters } = createBasePrisma([
      { key: "images/category/cat-1/banner.jpg" },
    ]);
    prisma.product.count = mock(() => Promise.resolve(3));

    await expect(deleteCategory({ id: "cat-1", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "CATEGORY_HAS_PRODUCTS", statusCode: 409 }),
    );

    expect(sentCommands.length).toBe(0);
    expect(deletedImageFilters).toEqual([]);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });
});
