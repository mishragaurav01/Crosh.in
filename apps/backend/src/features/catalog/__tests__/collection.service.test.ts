import { describe, it, expect, mock } from "bun:test";
import {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
} from "../services/collection.service.js";

const baseCollection = {
  id: "col-1",
  name: "Summer",
  description: null,
  slug: "summer",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function uniqueConstraintError() {
  const error = new Error("Unique constraint failed") as Error & { code: string };
  error.code = "P2002";
  return error;
}

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    collection: {
      create: mock(() => Promise.resolve({ ...baseCollection })),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      findUnique: mock(() => Promise.resolve({ ...baseCollection })),
      update: mock(() => Promise.resolve({ ...baseCollection, name: "Updated" })),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.collection as object) ?? {}),
    },
    variant: {
      // Reflects which submitted IDs "exist".
      findMany: mock((args: any) =>
        Promise.resolve(
          ((args?.where?.id?.in ?? []) as string[]).map((id) => ({ id })),
        ),
      ),
      ...((overrides.variant as object) ?? {}),
    },
    variantCollection: {
      createMany: mock(() => Promise.resolve({ count: 0 })),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
      findMany: mock(() => Promise.resolve([])),
      ...((overrides.variantCollection as object) ?? {}),
    },
    image: {
      findMany: mock(() => Promise.resolve([])),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
  };

  prisma.$transaction = mock((fn: (tx: unknown) => unknown) => Promise.resolve(fn(prisma)));

  return prisma;
}

describe("createCollection", () => {
  it("creates and returns a collection", async () => {
    const prisma = createMockPrisma();
    const result = await createCollection({ name: "Summer", slug: "summer", prisma });

    expect(result.id).toBe("col-1");
    expect(result.name).toBe("Summer");
    expect(prisma.collection.create).toHaveBeenCalledTimes(1);
  });

  it("returns variantIds in the response", async () => {
    const prisma = createMockPrisma({
      variantCollection: {
        findMany: mock(() =>
          Promise.resolve([
            { collectionId: "col-1", variantId: "var-1" },
            { collectionId: "col-1", variantId: "var-2" },
          ]),
        ),
      },
    });

    const result = await createCollection({ name: "Summer", slug: "summer", prisma });

    expect(result.variantIds).toEqual(["var-1", "var-2"]);
  });

  it("links submitted variants to the new collection atomically", async () => {
    const prisma = createMockPrisma();

    await createCollection({
      name: "Summer",
      slug: "summer",
      variantIds: ["var-1", "var-2"],
      prisma,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.variantCollection.createMany).toHaveBeenCalledWith({
      data: [
        { variantId: "var-1", collectionId: "col-1" },
        { variantId: "var-2", collectionId: "col-1" },
      ],
    });
  });

  it("deduplicates submitted variant IDs", async () => {
    const prisma = createMockPrisma();

    await createCollection({
      name: "Summer",
      slug: "summer",
      variantIds: ["var-1", "var-1"],
      prisma,
    });

    expect(prisma.variantCollection.createMany).toHaveBeenCalledWith({
      data: [{ variantId: "var-1", collectionId: "col-1" }],
    });
  });

  it("throws VARIANT_NOT_FOUND when a submitted variant does not exist", async () => {
    const prisma = createMockPrisma({
      variant: {
        findMany: mock(() => Promise.resolve([{ id: "var-1" }])),
      },
    });

    await expect(
      createCollection({
        name: "Summer",
        slug: "summer",
        variantIds: ["var-1", "missing"],
        prisma,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
    expect(prisma.collection.create).not.toHaveBeenCalled();
  });

  it("throws DUPLICATE_SLUG on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      collection: {
        create: mock(() => {
          throw uniqueConstraintError();
        }),
      },
    });

    await expect(
      createCollection({ name: "Summer", slug: "summer", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("listCollections", () => {
  it("returns paginated results with variantIds", async () => {
    const prisma = createMockPrisma({
      collection: {
        findMany: mock(() => Promise.resolve([{ ...baseCollection }])),
        count: mock(() => Promise.resolve(1)),
      },
      variantCollection: {
        findMany: mock(() =>
          Promise.resolve([{ collectionId: "col-1", variantId: "var-1" }]),
        ),
      },
    });

    const result = await listCollections({ page: 1, limit: 20, prisma });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.variantIds).toEqual(["var-1"]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("getCollection", () => {
  it("returns a collection by id including variantIds", async () => {
    const prisma = createMockPrisma();

    const result = await getCollection({ id: "col-1", prisma });

    expect(result.id).toBe("col-1");
    expect(result.variantIds).toEqual([]);
  });

  it("throws COLLECTION_NOT_FOUND when not found", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(getCollection({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("updateCollection", () => {
  it("updates and returns the collection", async () => {
    const prisma = createMockPrisma();
    const result = await updateCollection({ id: "col-1", name: "Updated", prisma });

    expect(result.name).toBe("Updated");
    expect(prisma.collection.update).toHaveBeenCalledTimes(1);
  });

  it("replaces the full membership set when variantIds are submitted", async () => {
    const prisma = createMockPrisma();

    await updateCollection({
      id: "col-1",
      variantIds: ["var-2", "var-3"],
      prisma,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.variantCollection.deleteMany).toHaveBeenCalledWith({
      where: { collectionId: "col-1" },
    });
    expect(prisma.variantCollection.createMany).toHaveBeenCalledWith({
      data: [
        { variantId: "var-2", collectionId: "col-1" },
        { variantId: "var-3", collectionId: "col-1" },
      ],
    });
  });

  it("clears all memberships when an empty variantIds array is submitted", async () => {
    const prisma = createMockPrisma();

    await updateCollection({ id: "col-1", variantIds: [], prisma });

    expect(prisma.variantCollection.deleteMany).toHaveBeenCalledWith({
      where: { collectionId: "col-1" },
    });
    expect(prisma.variantCollection.createMany).not.toHaveBeenCalled();
  });

  it("leaves memberships untouched when variantIds are omitted", async () => {
    const prisma = createMockPrisma();

    await updateCollection({ id: "col-1", name: "Updated", prisma });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.variantCollection.deleteMany).not.toHaveBeenCalled();
    expect(prisma.variantCollection.createMany).not.toHaveBeenCalled();
  });

  it("removing one variant keeps sibling variants assigned", async () => {
    const prisma = createMockPrisma({
      variantCollection: {
        createMany: mock(() => Promise.resolve({ count: 0 })),
        deleteMany: mock(() => Promise.resolve({ count: 0 })),
        findMany: mock(() =>
          Promise.resolve([
            { collectionId: "col-1", variantId: "var-1" },
            { collectionId: "col-1", variantId: "var-2" },
          ]),
        ),
      },
    });

    const result = await updateCollection({
      id: "col-1",
      variantIds: ["var-1", "var-2"],
      prisma,
    });

    expect(prisma.variantCollection.createMany).toHaveBeenCalledWith({
      data: [
        { variantId: "var-1", collectionId: "col-1" },
        { variantId: "var-2", collectionId: "col-1" },
      ],
    });
    expect(result.variantIds).toEqual(["var-1", "var-2"]);
  });

  it("throws VARIANT_NOT_FOUND when a submitted variant does not exist", async () => {
    const prisma = createMockPrisma({
      variant: {
        findMany: mock(() => Promise.resolve([{ id: "var-1" }])),
      },
    });

    await expect(
      updateCollection({ id: "col-1", variantIds: ["var-1", "missing"], prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
    expect(prisma.variantCollection.deleteMany).not.toHaveBeenCalled();
  });

  it("throws COLLECTION_NOT_FOUND when collection does not exist", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      updateCollection({ id: "missing", name: "Nope", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws DUPLICATE_SLUG on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      collection: {
        update: mock(() => {
          throw uniqueConstraintError();
        }),
      },
    });

    await expect(
      updateCollection({ id: "col-1", slug: "taken", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("deleteCollection", () => {
  it("deletes an existing collection", async () => {
    const prisma = createMockPrisma();
    await deleteCollection({ id: "col-1", prisma });

    expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
  });

  it("throws COLLECTION_NOT_FOUND when collection does not exist", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(deleteCollection({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("removes VariantCollection rows before deleting the collection", async () => {
    const prisma = createMockPrisma();
    await deleteCollection({ id: "col-1", prisma });

    expect(prisma.variantCollection.deleteMany).toHaveBeenCalledWith({ where: { collectionId: "col-1" } });
    expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
  });
});
