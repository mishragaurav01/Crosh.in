import { describe, it, expect, mock } from "bun:test";
import type { PrismaClient } from "../generated/prisma/client";
import { backfillColorOptions } from "./backfill-color-options.js";
import { NEUTRAL_COLOR_HEX } from "./swatch-color-map.js";

type Row = Record<string, unknown>;

function createMockPrisma(options: Row[], variants: Row[]) {
  return {
    colorOption: {
      findUnique: mock(async ({ where }: any) =>
        options.find((o) => o.name === where.name) ?? null,
      ),
      upsert: mock(async ({ where, create }: any) => {
        const found = options.find((o) => o.name === where.name);
        if (found) {
          return found;
        }
        const now = new Date();
        const row = {
          id: `opt-${options.length + 1}`,
          createdAt: now,
          updatedAt: now,
          ...create,
        };
        options.push(row);
        return row;
      }),
    },
    variant: {
      findMany: mock(async ({ where }: any) => {
        const seen = new Set<string>();
        const rows: Row[] = [];
        for (const v of variants) {
          if ((where?.colorId === undefined || v.colorId === where.colorId) && !seen.has(v.color as string)) {
            seen.add(v.color as string);
            rows.push({ color: v.color });
          }
        }
        return rows;
      }),
      updateMany: mock(async ({ where, data }: any) => {
        let count = 0;
        for (const v of variants) {
          if (v.colorId === null && v.color === where.color) {
            v.colorId = data.colorId;
            count += 1;
          }
        }
        return { count };
      }),
    },
  } as unknown as PrismaClient;
}

function variantRow(color: string): Row {
  return { color, colorId: null };
}

describe("backfillColorOptions", () => {
  it("creates an option per distinct legacy color and links its variants", async () => {
    const options: Row[] = [];
    const variants = [variantRow("Yellow"), variantRow("Yellow"), variantRow("Red")];
    const prisma = createMockPrisma(options, variants);

    const result = await backfillColorOptions(prisma, { yellow: "#e5c95c", red: "#b3423a" });

    expect(result.createdOptions).toBe(2);
    expect(result.linkedVariants).toBe(3);
    expect(result.flagged).toEqual([]);
    expect(options.map((o) => o.name).sort()).toEqual(["red", "yellow"]);
    expect(variants.every((v) => typeof v.colorId === "string")).toBe(true);
  });

  it("normalizes case and whitespace before mapping", async () => {
    const options: Row[] = [];
    const variants = [variantRow("  BLACK ")];
    const prisma = createMockPrisma(options, variants);

    const result = await backfillColorOptions(prisma, { black: "#1d1b1b" });

    expect(result.flagged).toEqual([]);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("black");
    expect(options[0].hex).toBe("#1d1b1b");
  });

  it("grounds unmapped colors with the neutral hex and flags them", async () => {
    const options: Row[] = [];
    const variants = [variantRow("Mauveline")];
    const prisma = createMockPrisma(options, variants);

    const result = await backfillColorOptions(prisma, {});

    expect(result.flagged).toEqual(["mauveline"]);
    expect(options[0].hex).toBe(NEUTRAL_COLOR_HEX);
    expect(result.linkedVariants).toBe(1);
  });

  it("is idempotent: a second run creates and links nothing", async () => {
    const options: Row[] = [];
    const variants = [variantRow("Yellow"), variantRow("Pink")];
    const map = { yellow: "#e5c95c", pink: "#f4c2c2" };
    const prisma = createMockPrisma(options, variants);

    await backfillColorOptions(prisma, map);
    const second = await backfillColorOptions(prisma, map);

    expect(second.createdOptions).toBe(0);
    expect(second.linkedVariants).toBe(0);
    expect(second.flagged).toEqual([]);
    expect(options).toHaveLength(2);
  });
});
