// Variant `color` is stored as a free-text name in the DB, so swatches need a
// name→hex map (recorded Integration Gap; schema candidate for later). Unknown
// names fall back to a neutral circle + initial letter.
const SWATCH_COLORS: Record<string, string> = {
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

export function swatchHexForColorName(colorName: string): string | null {
  return SWATCH_COLORS[colorName.trim().toLowerCase()] ?? null;
}
