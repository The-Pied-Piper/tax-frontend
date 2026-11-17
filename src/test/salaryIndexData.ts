// Test data only: nothing in the build imports this file. A small salary
// group for the tests of the hub pages.
import { readUnit } from '../adapters/fallback';
import { strings } from '../strings';
import { compute70000 } from './syntheticPages';

const indexUnit = readUnit(compute70000.unit) ?? strings.fallbackUnit;

function group(code: string, name: string, slug: string, salaries: number[]) {
  return {
    code,
    name,
    unit: indexUnit,
    pages: salaries.map((n) => ({
      salary: n.toString(),
      href: `/${slug}/${n.toString()}/`,
    })),
  };
}

const steps = Array.from({ length: 25 }, (_, i) => 30000 + i * 5000);

/** Ontario's 25 steps, as the build writes them. */
export const ontarioGroup = group('CA-ON', 'Ontario', 'ca-on', steps);
