import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  getCollection,
  listCollections,
  updateCollection,
} from "../services/collection.service.js";
import {
  addVariantToCollection,
  removeVariantFromCollection,
  listCollectionVariants,
} from "../services/membership.service.js";

// Walks upward from this module's directory until the repo-relative file is
// found, so the test does not depend on how the runner resolves module paths.
function findRepoFile(repoRelativePath: string): string {
  let dir = import.meta.dir;
  for (let depth = 0; depth < 10; depth++) {
    const candidate = join(dir, repoRelativePath);
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error(`Could not locate ${repoRelativePath} from ${import.meta.dir}`);
}

type AnyRow = Record<string, any>;

function uniqueConstraintError() {
  const error = new Error("Unique constraint failed") as Error & { code: string };
  error.code = "P2002";
  return error;
}

function notFoundError() {
  const error = new Error("Record not found") as Error & { code: string };
  error.code = "P2025";
  return error;
}

// Stateful in-memory stand-in for the Prisma client. Unlike the spy-based
// mocks in the other test files, this one actually stores rows and enforces
// the (variantId, collectionId) uniqueness constraint, so membership state
// can be asserted after sequences of operations.
function createCatalogDb() {
  let sequence = 0;
  const nextId = (prefix: string) => `${prefix}-${++sequence}`;
  const now = () => new Date();

  const collections = new Map<string, AnyRow>();
  const variants = new Map<string, AnyRow>();
  const memberships = new Map<string, AnyRow>();
  const membershipKey = (variantId: string, collectionId: string) =>
    `${variantId}::${collectionId}`;

  const db = {
    seedCollection(row: AnyRow) {
      collections.set(row.id, { ...row });
      return row;
    },
    seedVariant(row: AnyRow) {
      variants.set(row.id, { ...row });
      return row;
    },
    seedMembership(variantId: string, collectionId: string) {
      const row = {
        id: nextId("vc"),
        variantId,
        collectionId,
        createdAt: now(),
      };
      memberships.set(membershipKey(variantId, collectionId), row);
      return row;
    },
    membershipCount() {
      return memberships.size;
    },

    collection: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        collections.get(where.id) ?? null,
      findMany: async (args: {
        orderBy?: { createdAt?: "asc" | "desc" };
        skip?: number;
        take?: number;
      }) => {
        let rows = [...collections.values()];
        const ascending = args.orderBy?.createdAt !== "desc";
        rows.sort((a, b) =>
          ascending
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime(),
        );
        if (args.skip) rows = rows.slice(args.skip);
        if (args.take !== undefined) rows = rows.slice(0, args.take);
        return rows.map((r) => ({ ...r }));
      },
      create: async ({
        data,
      }: {
        data: { name: string; description: string | null; slug: string };
      }) => {
        if ([...collections.values()].some((c) => c.slug === data.slug)) {
          throw uniqueConstraintError();
        }
        const row = {
          ...data,
          id: nextId("col"),
          createdAt: now(),
          updatedAt: now(),
        };
        collections.set(row.id, row);
        return { ...row };
      },
      count: async () => collections.size,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<{ name: string; description: string | null; slug: string }>;
      }) => {
        const row = collections.get(where.id);
        if (!row) {
          throw notFoundError();
        }
        if (
          data.slug !== undefined &&
          data.slug !== row.slug &&
          [...collections.values()].some((c) => c.slug === data.slug)
        ) {
          throw uniqueConstraintError();
        }
        Object.assign(row, data, { updatedAt: now() });
        return { ...row };
      },
    },

    variant: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        variants.get(where.id) ?? null,
      findMany: async ({
        where,
      }: {
        where?: { id?: { in?: string[] }; productId?: string };
      }) => {
        let rows = [...variants.values()];
        if (where?.id?.in) {
          const ids = new Set(where.id.in);
          rows = rows.filter((v) => ids.has(v.id));
        }
        if (where?.productId) {
          rows = rows.filter((v) => v.productId === where.productId);
        }
        return rows.map((v) => ({ ...v }));
      },
    },

    variantCollection: {
      findUnique: async ({
        where,
      }: {
        where: { variantId_collectionId: { variantId: string; collectionId: string } };
      }) =>
        memberships.get(
          membershipKey(where.variantId_collectionId.variantId, where.variantId_collectionId.collectionId),
        ) ?? null,
      findMany: async (args: {
        where?: { collectionId?: string | { in?: string[] } };
        orderBy?: { createdAt?: "asc" | "desc" };
        skip?: number;
        take?: number;
      }) => {
        let rows = [...memberships.values()];
        const where = args.where?.collectionId;
        if (typeof where === "string") {
          rows = rows.filter((m) => m.collectionId === where);
        } else if (where?.in) {
          const ids = new Set(where.in);
          rows = rows.filter((m) => ids.has(m.collectionId));
        }
        const ascending = args.orderBy?.createdAt !== "desc";
        rows.sort((a, b) =>
          ascending
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime(),
        );
        if (args.skip) rows = rows.slice(args.skip);
        if (args.take !== undefined) rows = rows.slice(0, args.take);
        return rows.map((r) => ({ ...r }));
      },
      count: async ({ where }: { where?: { collectionId?: string } }) =>
        [...memberships.values()].filter((m) => m.collectionId === where?.collectionId)
          .length,
      create: async ({
        data,
      }: {
        data: { variantId: string; collectionId: string };
      }) => {
        const key = membershipKey(data.variantId, data.collectionId);
        if (memberships.has(key)) {
          throw uniqueConstraintError();
        }
        const row = { id: nextId("vc"), createdAt: now(), ...data };
        memberships.set(key, row);
        return { ...row };
      },
      createMany: async ({
        data,
      }: {
        data: Array<{ variantId: string; collectionId: string }>;
      }) => {
        for (const item of data) {
          const key = membershipKey(item.variantId, item.collectionId);
          if (memberships.has(key)) {
            throw uniqueConstraintError();
          }
          memberships.set(key, { id: nextId("vc"), createdAt: now(), ...item });
        }
        return { count: data.length };
      },
      delete: async ({
        where,
      }: {
        where: { variantId_collectionId: { variantId: string; collectionId: string } };
      }) => {
        const key = membershipKey(
          where.variantId_collectionId.variantId,
          where.variantId_collectionId.collectionId,
        );
        const row = memberships.get(key);
        if (!row) {
          throw notFoundError();
        }
        memberships.delete(key);
        return row;
      },
      deleteMany: async ({ where }: { where?: { collectionId?: string } }) => {
        let count = 0;
        for (const [key, m] of memberships) {
          if (m.collectionId === where?.collectionId) {
            memberships.delete(key);
            count++;
          }
        }
        return { count };
      },
    },

    $transaction: async <T>(fn: (tx: unknown) => T): Promise<T> => fn(db),
  };

  return db as any;
}

const NOW = new Date();

function makeVariant(productId: string, suffix: string) {
  return {
    id: `var-${suffix}`,
    sku: `TEE-${suffix}`,
    size: suffix,
    color: "Black",
    price: 2999,
    stock: 10,
    productId,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

// One product with three variants, plus two collections — the common fixture
// for the membership verification scenarios.
function seedFixture() {
  const prisma = createCatalogDb();
  prisma.seedCollection({
    id: "col-1",
    name: "Summer",
    description: null,
    slug: "summer",
    createdAt: NOW,
    updatedAt: NOW,
  });
  prisma.seedCollection({
    id: "col-2",
    name: "Winter",
    description: null,
    slug: "winter",
    createdAt: NOW,
    updatedAt: NOW,
  });
  prisma.seedVariant(makeVariant("prod-1", "A"));
  prisma.seedVariant(makeVariant("prod-1", "B"));
  prisma.seedVariant(makeVariant("prod-1", "C"));
  return prisma;
}

describe("Verification: adding a Product assigns all of its Variants", () => {
  it("assigns every Variant of the Product when the full set is submitted", async () => {
    const prisma = seedFixture();

    // The UI resolves the Product into its Variant IDs before submitting.
    const productVariants = await prisma.variant.findMany({
      where: { productId: "prod-1" },
    });
    expect(productVariants).toHaveLength(3);

    await updateCollection({
      id: "col-1",
      variantIds: productVariants.map((v: { id: string }) => v.id),
      prisma,
    });

    const collection = await getCollection({ id: "col-1", prisma });
    expect([...collection.variantIds].sort()).toEqual(["var-A", "var-B", "var-C"]);
  });

  it("reports the assigned Variants through the paginated member listing", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-A", "var-B", "var-C"], prisma });

    const listed = await listCollectionVariants({
      collectionId: "col-1",
      page: 1,
      limit: 20,
      prisma,
    });
    expect(listed.total).toBe(3);
    expect(listed.data.map((m: { variantId: string }) => m.variantId).sort()).toEqual([
      "var-A",
      "var-B",
      "var-C",
    ]);
  });

  it("rejects re-adding an already-assigned Variant instead of duplicating the row", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-A"], prisma });

    await expect(
      addVariantToCollection({ collectionId: "col-1", variantId: "var-A", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 409 }),
    );
    expect(prisma.membershipCount()).toBe(1);
  });
});

describe("Verification: selected Variants are assigned independently", () => {
  it("assigns only the submitted subset of a Product's Variants", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-B"], prisma });

    const collection = await getCollection({ id: "col-1", prisma });
    expect(collection.variantIds).toEqual(["var-B"]);
  });

  it("keeps unsubmitted sibling Variants out of the Collection", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-C"], prisma });

    const listed = await listCollectionVariants({
      collectionId: "col-1",
      page: 1,
      limit: 20,
      prisma,
    });
    expect(listed.data.every((m: { variantId: string }) => m.variantId === "var-C")).toBe(true);
  });
});

describe("Verification: Variants of one Product hold independent memberships", () => {
  it("allows two Variants of the same Product to belong to different Collections", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-A"], prisma });
    await updateCollection({ id: "col-2", variantIds: ["var-B"], prisma });

    const summer = await getCollection({ id: "col-1", prisma });
    const winter = await getCollection({ id: "col-2", prisma });

    expect(summer.variantIds).toEqual(["var-A"]);
    expect(winter.variantIds).toEqual(["var-B"]);
  });

  it("leaves a sibling's membership in another Collection untouched when removing a Variant", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-A"], prisma });
    await updateCollection({ id: "col-2", variantIds: ["var-B"], prisma });

    await removeVariantFromCollection({ collectionId: "col-1", variantId: "var-A", prisma });

    const winter = await getCollection({ id: "col-2", prisma });
    expect(winter.variantIds).toEqual(["var-B"]);
  });
});

describe("Verification: removing one Variant keeps its siblings assigned", () => {
  it("removes only the targeted membership from the Collection", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-A", "var-B", "var-C"], prisma });

    await removeVariantFromCollection({ collectionId: "col-1", variantId: "var-B", prisma });

    const collection = await getCollection({ id: "col-1", prisma });
    expect(collection.variantIds.sort()).toEqual(["var-A", "var-C"]);
  });

  it("does not delete or alter the removed Variant itself", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-A", "var-B", "var-C"], prisma });
    await removeVariantFromCollection({ collectionId: "col-1", variantId: "var-B", prisma });

    const remaining = await prisma.variant.findMany({ where: { productId: "prod-1" } });
    expect(remaining).toHaveLength(3);
  });

  it("rejects removing a Variant that is not a member without changing existing memberships", async () => {
    const prisma = seedFixture();

    await updateCollection({ id: "col-1", variantIds: ["var-A", "var-C"], prisma });

    await expect(
      removeVariantFromCollection({ collectionId: "col-1", variantId: "var-B", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 404 }),
    );

    const collection = await getCollection({ id: "col-1", prisma });
    expect(collection.variantIds.sort()).toEqual(["var-A", "var-C"]);
  });
});

describe("Verification: migrated Collections retain their memberships", () => {
  it("preserves memberships seeded by the Product-to-Variant migration", async () => {
    const prisma = createCatalogDb();
    prisma.seedCollection({ id: "col-1", name: "Summer", description: null, slug: "summer", createdAt: NOW, updatedAt: NOW });
    prisma.seedVariant({ id: "prod-1-var-1", sku: "S-1", size: "S", color: "Black", price: 2999, stock: 10, productId: "prod-1", createdAt: NOW, updatedAt: NOW });
    prisma.seedVariant({ id: "prod-1-var-2", sku: "S-2", size: "M", color: "Black", price: 2999, stock: 10, productId: "prod-1", createdAt: NOW, updatedAt: NOW });
    prisma.seedVariant({ id: "prod-2-var-1", sku: "H-1", size: "L", color: "White", price: 4999, stock: 10, productId: "prod-2", createdAt: NOW, updatedAt: NOW });

    // What the migration writes: for each former Product -> Collection row,
    // one VariantCollection row per Variant of that Product.
    prisma.seedMembership("prod-1-var-1", "col-1");
    prisma.seedMembership("prod-1-var-2", "col-1");
    prisma.seedMembership("prod-2-var-1", "col-1");

    const collections = await listCollections({ page: 1, limit: 20, prisma });
    const summer = collections.data[0];
    expect(summer?.variantIds.sort()).toEqual([
      "prod-1-var-1",
      "prod-1-var-2",
      "prod-2-var-1",
    ]);

    const single = await getCollection({ id: "col-1", prisma });
    expect(single.variantIds).toHaveLength(3);
  });
});

describe("Verification: no Product-Collection relation remains in the implementation", () => {
  it("schema defines only Variant-level collection membership", () => {
    const schemaPath = findRepoFile("packages/db/prisma/schema.prisma");
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).not.toMatch(/model\s+ProductCollection\b/);
    expect(schema).toMatch(/model\s+VariantCollection\b/);
    expect(schema).not.toMatch(/products\s+ProductCollection\[\]/);
    expect(schema).toMatch(/collections\s+VariantCollection\[\]/);
  });

  it("membership listing is served through the collection-variant endpoint surface", async () => {
    const prisma = seedFixture();
    await updateCollection({ id: "col-1", variantIds: ["var-A"], prisma });

    // The only membership read path operates on collection + variant rows.
    const listed = await listCollectionVariants({
      collectionId: "col-1",
      page: 1,
      limit: 20,
      prisma,
    });
    expect(listed.total).toBe(1);
    expect(prisma.product).toBeUndefined();
  });
});
