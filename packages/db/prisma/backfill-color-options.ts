/**
 * One-off idempotent backfill: grounds every distinct legacy `Variant.color`
 * string as a `ColorOption` row and links variants via `Variant.colorId`.
 *
 * Hex values come from swatch-color-map.ts (frontend source of truth);
 * unmapped names get the neutral hex and are flagged in the result.
 *
 * Run from packages/db: bun prisma/backfill-color-options.ts
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { NEUTRAL_COLOR_HEX, SWATCH_COLOR_MAP, canonicalColorName } from "./swatch-color-map.js";

export type ColorHexMap = Record<string, string>;

export type BackfillResult = {
  /** Option rows created by this run (0 when already backfilled). */
  createdOptions: number;
  /** Variants whose colorId was set by this run (0 when already linked). */
  linkedVariants: number;
  /** Canonical color names that had no entry in the map (got neutral hex). */
  flagged: string[];
};

export async function backfillColorOptions(
  prisma: PrismaClient,
  colorMap: ColorHexMap = SWATCH_COLOR_MAP,
): Promise<BackfillResult> {
  const result: BackfillResult = { createdOptions: 0, linkedVariants: 0, flagged: [] };

  const variants = await prisma.variant.findMany({
    where: { colorId: null },
    select: { color: true },
    distinct: ["color"],
  });

  for (const { color } of variants) {
    const name = canonicalColorName(color);
    let hex = colorMap[name];
    if (hex === undefined) {
      hex = NEUTRAL_COLOR_HEX;
      if (!result.flagged.includes(name)) {
        result.flagged.push(name);
      }
    }

    const existing = await prisma.colorOption.findUnique({ where: { name } });
    const option = await prisma.colorOption.upsert({
      where: { name },
      create: { name, hex },
      update: {},
    });
    if (!existing) {
      result.createdOptions += 1;
    }

    const linked = await prisma.variant.updateMany({
      where: { colorId: null, color },
      data: { colorId: option.id },
    });
    result.linkedVariants += linked.count;
  }

  return result;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const result = await backfillColorOptions(prisma);
    console.log(
      `Color option backfill complete. Options created: ${result.createdOptions}, variants linked: ${result.linkedVariants}.`,
    );
    if (result.flagged.length > 0) {
      console.warn(`FLAGGED unmapped colors (given neutral hex): ${result.flagged.join(", ")}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
