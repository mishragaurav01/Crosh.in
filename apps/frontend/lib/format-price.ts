const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export function formatPrice(minorUnits: number): string {
  return formatter.format(minorUnits / 100);
}
