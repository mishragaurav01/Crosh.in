import { describe, it, expect, mock } from "bun:test";
import {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
} from "../services/collection.service.js";

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    collection: {
      create: mock(() =>
        Promise.resolve({
          id: "col-1",
          name: "Summer",
          description: null,
          slug: "summer",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      findUnique: mock(() =>
        Promise.resolve({
          id: "col-1",
          name: "Summer",
          description: null,
          slug: "summer",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      update: mock(() =>
        Promise.resolve({
          id: "col-1",
          name: "Updated",
          description: null,
          slug: "summer",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.collection as object) ?? {}),
    },
  } as any;
}

describe("createCollection", () => {
  it("creates and returns a collection", async () => {
    const prisma = createMockPrisma();
    const result = await createCollection({ name: "Summer", slug: "summer", prisma });

    expect(result.id).toBe("col-1");
    expect(result.name).toBe("Summer");
    expect(prisma.collection.create).toHaveBeenCalledTimes(1);
  });

  it("throws DUPLICATE_SLUG on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      collection: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
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
  it("returns paginated results", async () => {
    const prisma = createMockPrisma();
    const result = await listCollections({ page: 1, limit: 20, prisma });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("getCollection", () => {
  it("returns a collection by id", async () => {
    const prisma = createMockPrisma();
    const result = await getCollection({ id: "col-1", prisma });

    expect(result.id).toBe("col-1");
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
        findUnique: mock(() =>
          Promise.resolve({
            id: "col-1",
            name: "Summer",
            slug: "summer",
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        update: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
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
});
