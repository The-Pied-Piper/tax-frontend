import { readFileSync } from 'node:fs';
import type { EngineAnswer, EngineAnswers } from '../salaryPages/generate';
import { responseChecker } from './openApiCheck';

/** What build/localEngine/engine_figures.py writes, once every page answer is checked. */
export type EngineFigures = {
  /** The tax-engine release that produced them. */
  engine: string;
  /** The answers for the pre-built salary pages. */
  answers: EngineAnswers;
  /** The hub-chart sweep of each province, by jurisdiction code. */
  sweeps: Record<string, EngineSweep>;
};

/** One sweep point as the Python step writes it: the API's text figures. */
export type EngineSweepPoint = {
  salary: string;
  total_deductions: string;
  income_tax: string;
  take_home: string;
  average_rate: string;
  marginal_rate: string;
  year_total: string;
};

/** The sweep of one province: its points, lowest salary first, and the units written once. */
export type EngineSweep = {
  points: EngineSweepPoint[];
  /** Where the marginal rate changes: [the sweep salary below, the salary it first moves, the salary it has settled, the rate there]. */
  edges: string[][];
  /** Engine parameters and band figures the notes quote, by name, as text. */
  facts: Record<string, string>;
  units: {
    unit: unknown;
    average_income_tax_rate: unknown;
  };
};

const POINT_FIELDS = [
  'salary',
  'total_deductions',
  'income_tax',
  'take_home',
  'average_rate',
  'marginal_rate',
  'year_total',
] as const;

function isSweepPoint(value: unknown): value is EngineSweepPoint {
  return (
    isRecord(value) && POINT_FIELDS.every((f) => typeof value[f] === 'string')
  );
}

function readSweep(
  code: string,
  province: Record<string, unknown>,
): EngineSweep {
  const { sweep, sweep_units: units, edges, facts } = province;
  if (!Array.isArray(sweep) || !sweep.every(isSweepPoint)) {
    throw new Error(`Engine figures: ${code} has no valid sweep`);
  }
  if (
    !isRecord(units) ||
    !('unit' in units) ||
    !('average_income_tax_rate' in units)
  ) {
    throw new Error(`Engine figures: ${code} has no sweep units`);
  }
  if (
    !Array.isArray(edges) ||
    !edges.every(
      (edge) =>
        Array.isArray(edge) &&
        edge.length === 4 &&
        edge.every((part) => typeof part === 'string'),
    )
  ) {
    throw new Error(`Engine figures: ${code} has no valid edges`);
  }
  if (
    !isRecord(facts) ||
    !Object.values(facts).every((fact) => typeof fact === 'string')
  ) {
    throw new Error(`Engine figures: ${code} has no valid facts`);
  }
  return {
    points: sweep,
    edges: edges as string[][],
    facts: facts as Record<string, string>,
    units: {
      unit: units.unit,
      average_income_tax_rate: units.average_income_tax_rate,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads the file the Python step wrote. Every page answer must fit the
 * ComputeTakeHomeCalculationResponse schema of api/openapi.yml (a `provisional` is added
 * for the check, as the build adds the real one later), so a drift between the script and
 * the service's response shape fails the build here.
 */
export function readEngineFigures(
  file: string,
  check: (answer: unknown) => string[] = responseChecker(),
): EngineFigures {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Engine figures: cannot read ${file}`, { cause: error });
  }
  if (
    !isRecord(parsed) ||
    typeof parsed.engine !== 'string' ||
    !isRecord(parsed.provinces)
  ) {
    throw new Error(
      `Engine figures: ${file} is not what the Python step writes`,
    );
  }
  const answers: EngineAnswers = {};
  const sweeps: Record<string, EngineSweep> = {};
  for (const [code, province] of Object.entries(parsed.provinces)) {
    if (!isRecord(province) || !isRecord(province.pages)) {
      throw new Error(`Engine figures: ${code} has no pages`);
    }
    const bySalary: Record<string, EngineAnswer> = {};
    for (const [salary, answer] of Object.entries(province.pages)) {
      if (!isRecord(answer)) {
        throw new Error(`Engine figures: ${code}/${salary} is not an object`);
      }
      const problems = check({ ...answer, provisional: false });
      if (problems.length > 0) {
        throw new Error(
          `Engine figures: ${code}/${salary} does not fit api/openapi.yml: ${problems.join('; ')}`,
        );
      }
      // Fit to the schema just above, so this is the engine answer's shape.
      bySalary[salary] = answer as EngineAnswer;
    }
    answers[code] = bySalary;
    sweeps[code] = readSweep(code, province);
  }
  return { engine: parsed.engine, answers, sweeps };
}
