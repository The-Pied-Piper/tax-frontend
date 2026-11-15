/**
 * The year the calculator opens on: the current year if the place lists it,
 * else the listed year nearest to it (a tie goes to the earlier year).
 * Null when the place lists no year.
 */
export function pickDefaultYear(
  years: readonly { year: number }[],
  currentYear: number,
): number | null {
  let best: number | null = null;
  for (const { year } of years) {
    if (best === null) {
      best = year;
      continue;
    }
    const gap = Math.abs(year - currentYear);
    const bestGap = Math.abs(best - currentYear);
    if (gap < bestGap || (gap === bestGap && year < best)) best = year;
  }
  return best;
}
