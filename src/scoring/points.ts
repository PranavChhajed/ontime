/** Points are summed as whole hundredths so 4.5 + 1.5 never drifts. */
export const toCenti = (points: number): number => Math.round(points * 100);
export const fromCenti = (centi: number): number => centi / 100;

/** 6 -> "6", 4.5 -> "4.5", 1 -> "1". */
export function formatPoints(points: number): string {
  return String(Number(points.toFixed(2)));
}

/**
 * Percent to one decimal, half-up, in whole tenths (1188 = 118.8%).
 * Integer maths only, so it is exact. Null when there is no base (C1.1 #11).
 */
export function percentTenths(totalCenti: number, baseCenti: number): number | null {
  if (baseCenti <= 0) return null;
  return Math.floor((2000 * totalCenti + baseCenti) / (2 * baseCenti));
}

export function formatPercent(tenths: number | null): string {
  if (tenths === null) return "No score";
  return `${(tenths / 10).toFixed(1)}%`;
}
