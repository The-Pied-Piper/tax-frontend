import { toCents } from './payPeriod';

/** How many steps a nearby list shows. */
export const NEARBY_LIMIT = 4;

/**
 * The steps nearest to a salary, nearest first and the lower step first on a
 * tie, at most `count`. Salaries are plain money text compared exactly in cents,
 * never as numbers; the list given is not changed.
 */
export function nearestSteps(
  salary: string,
  steps: string[],
  count: number = NEARBY_LIMIT,
): string[] {
  const target = toCents(salary);
  return steps
    .map((step) => {
      const cents = toCents(step);
      const gap = cents > target ? cents - target : target - cents;
      return { step, cents, gap };
    })
    .sort((a, b) => {
      if (a.gap !== b.gap) return a.gap < b.gap ? -1 : 1;
      if (a.cents === b.cents) return 0;
      return a.cents < b.cents ? -1 : 1;
    })
    .slice(0, Math.max(0, count))
    .map(({ step }) => step);
}
