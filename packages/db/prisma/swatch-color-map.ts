/**
 * Name→hex lookup for color options.
 *
 * Source of truth: apps/frontend/app/features/storefront/swatch-colors.ts
 * (`SWATCH_COLORS`). Duplicated here because packages/db must not import from
 * the frontend app; if the frontend map changes, update this copy to match.
 *
 * Keys are lowercase color names; lookups must normalize with
 * trim().toLowerCase() before consulting this record.
 */
export const SWATCH_COLOR_MAP: Record<string, string> = {
  black: "#1d1b1b",
  white: "#ffffff",
  cream: "#fff8f7",
  beige: "#e8dcc8",
  tan: "#d2b48c",
  brown: "#705959",
  terracotta: "#c86f4f",
  red: "#b3423a",
  pink: "#f4c2c2",
  blush: "#fadbdb",
  mauve: "#9a7d7d",
  purple: "#65587a",
  navy: "#2c3e50",
  blue: "#5b7c99",
  teal: "#4f7f7b",
  green: "#5a7052",
  sage: "#d7e2db",
  olive: "#6b6b3a",
  mustard: "#d4a017",
  yellow: "#e5c95c",
  orange: "#d97b29",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  charcoal: "#3a3a3a",
};

// Fallback for legacy color strings with no entry in the map; such values are
// still grounded as options but flagged to the operator during backfill.
export const NEUTRAL_COLOR_HEX = "#cccccc";

export function canonicalColorName(colorName: string): string {
  return colorName.trim().toLowerCase();
}
